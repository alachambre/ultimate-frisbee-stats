import {
  createContext,
  useContext,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";

import { getAuthMe, type AuthMeResponse } from "../services/auth";
import { setApiAccessToken } from "../services/api";
import { getCapabilitiesForRole } from "./capabilities";
import { getAuthConfig, isAuthConfigured } from "./config";
import { loadSupabaseClient } from "./supabase";
import type { AppRole, AuthEnforcementMode, AuthState } from "./types";

export interface AuthProviderProps {
  children: ReactNode;
  role?: AppRole;
  email?: string | null;
  isLoading?: boolean;
  isAuthenticated?: boolean;
  hasAppAccess?: boolean;
  isConfigured?: boolean;
  enforcementMode?: AuthEnforcementMode;
  authUserId?: string | null;
}

type AuthSnapshot = Omit<AuthState, "signInWithPassword" | "signOut">;

const noopAsync = async () => {};

const defaultAuthSnapshot: AuthSnapshot = {
  role: "public",
  capabilities: getCapabilitiesForRole("public"),
  isAuthenticated: false,
  hasAppAccess: false,
  isLoading: false,
  email: null,
  isConfigured: false,
  enforcementMode: "off",
  authUserId: null,
};

const AuthContext = createContext<AuthState>({
  ...defaultAuthSnapshot,
  signInWithPassword: noopAsync,
  signOut: noopAsync,
});

function buildStaticSnapshot({
  configured,
  role = "public",
  email = null,
  isLoading = false,
  isAuthenticated,
  hasAppAccess,
  isConfigured,
  enforcementMode = "off",
  authUserId = null,
}: {
  configured: boolean;
  role?: AppRole;
  email?: string | null;
  isLoading?: boolean;
  isAuthenticated?: boolean;
  hasAppAccess?: boolean;
  isConfigured?: boolean;
  enforcementMode?: AuthEnforcementMode;
  authUserId?: string | null;
}): AuthSnapshot {
  const resolvedIsConfigured = isConfigured ?? configured;
  const resolvedIsAuthenticated = isAuthenticated ?? role !== "public";
  const resolvedHasAppAccess = hasAppAccess ?? resolvedIsAuthenticated;

  return {
    role,
    capabilities: getCapabilitiesForRole(role),
    isAuthenticated: resolvedIsAuthenticated,
    hasAppAccess: resolvedHasAppAccess,
    isLoading,
    email,
    isConfigured: resolvedIsConfigured,
    enforcementMode,
    authUserId,
  };
}

function buildSnapshotFromAuthMe(
  authMe: AuthMeResponse,
  configured: boolean
): AuthSnapshot {
  return {
    role: authMe.role,
    capabilities: authMe.capabilities,
    isAuthenticated: authMe.is_authenticated,
    hasAppAccess: authMe.has_app_access,
    isLoading: false,
    email: authMe.email,
    isConfigured: configured,
    enforcementMode: authMe.enforcement_mode,
    authUserId: authMe.auth_user_id,
  };
}

function buildFallbackSnapshot(
  session: Session | null,
  configured: boolean
): AuthSnapshot {
  return {
    role: "public",
    capabilities: getCapabilitiesForRole("public"),
    isAuthenticated: Boolean(session),
    hasAppAccess: false,
    isLoading: false,
    email: session?.user.email ?? null,
    isConfigured: configured,
    enforcementMode: "off",
    authUserId: session?.user.id ?? null,
  };
}

function buildBootstrappingSnapshot(configured: boolean): AuthSnapshot {
  return {
    ...defaultAuthSnapshot,
    isLoading: configured,
    isConfigured: configured,
  };
}

export function AuthProvider({
  children,
  role,
  email,
  isLoading,
  isAuthenticated,
  hasAppAccess,
  isConfigured,
  enforcementMode,
  authUserId,
}: AuthProviderProps) {
  const queryClient = useQueryClient();
  const { supabaseUrl, supabaseAnonKey } = getAuthConfig();
  const configured = isAuthConfigured({
    supabaseUrl,
    supabaseAnonKey,
  });
  const hasStaticOverride =
    role !== undefined ||
    email !== undefined ||
    isLoading !== undefined ||
    isAuthenticated !== undefined ||
    hasAppAccess !== undefined ||
    isConfigured !== undefined ||
    enforcementMode !== undefined ||
    authUserId !== undefined;
  const requestCounterRef = useRef(0);
  const [snapshot, setSnapshot] = useState<AuthSnapshot>(() =>
    hasStaticOverride
      ? buildStaticSnapshot({
          configured,
          role,
          email,
          isLoading,
          isAuthenticated,
          hasAppAccess,
          isConfigured,
          enforcementMode,
          authUserId,
        })
      : configured
        ? buildBootstrappingSnapshot(configured)
        : buildStaticSnapshot({ configured })
  );

  const syncSession = useEffectEvent(async (session: Session | null) => {
    const requestId = ++requestCounterRef.current;
    setSnapshot((current) => ({
      ...current,
      isLoading: true,
      isConfigured: configured,
    }));
    setApiAccessToken(session?.access_token ?? null);

    try {
      const authMe = await getAuthMe();
      if (requestCounterRef.current !== requestId) {
        return;
      }
      setSnapshot(buildSnapshotFromAuthMe(authMe, configured));
    } catch (error) {
      console.error("Failed to bootstrap auth state", error);
      if (requestCounterRef.current !== requestId) {
        return;
      }
      setSnapshot(buildFallbackSnapshot(session, configured));
    }

    await queryClient.invalidateQueries();
  });

  useEffect(() => {
    if (hasStaticOverride) {
      requestCounterRef.current += 1;
      setApiAccessToken(null);
      setSnapshot(
        buildStaticSnapshot({
          configured,
          role,
          email,
          isLoading,
          isAuthenticated,
          hasAppAccess,
          isConfigured,
          enforcementMode,
          authUserId,
        })
      );
      return undefined;
    }

    if (!configured) {
      requestCounterRef.current += 1;
      setApiAccessToken(null);
      setSnapshot(buildStaticSnapshot({ configured }));
      return undefined;
    }

    setSnapshot(buildBootstrappingSnapshot(configured));

    let isDisposed = false;
    let unsubscribe: (() => void) | undefined;

    void (async () => {
      const supabase = await loadSupabaseClient();
      if (isDisposed) {
        return;
      }

      if (!supabase) {
        setApiAccessToken(null);
        setSnapshot(buildStaticSnapshot({ configured }));
        return;
      }

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (isDisposed) {
          return;
        }
        void syncSession(session);
      });
      unsubscribe = () => subscription.unsubscribe();

      const { data, error } = await supabase.auth.getSession();
      if (isDisposed) {
        return;
      }

      if (error) {
        console.error("Failed to load Supabase session", error);
        setApiAccessToken(null);
        setSnapshot(buildFallbackSnapshot(null, configured));
        return;
      }

      await syncSession(data.session);
    })();

    return () => {
      isDisposed = true;
      requestCounterRef.current += 1;
      unsubscribe?.();
    };
  }, [
    authUserId,
    configured,
    email,
    enforcementMode,
    hasAppAccess,
    hasStaticOverride,
    isAuthenticated,
    isConfigured,
    isLoading,
    role,
  ]);

  const signInWithPassword = async (nextEmail: string, password: string) => {
    if (!configured) {
      throw new Error("Authentication is not configured");
    }

    const supabase = await loadSupabaseClient();
    if (!supabase) {
      throw new Error("Authentication is not configured");
    }

    setSnapshot((current) => ({ ...current, isLoading: true }));
    const { data, error } = await supabase.auth.signInWithPassword({
      email: nextEmail,
      password,
    });
    if (error) {
      setSnapshot((current) => ({ ...current, isLoading: false }));
      throw error;
    }

    await syncSession(data.session ?? null);
  };

  const signOut = async () => {
    const supabase = await loadSupabaseClient();
    if (!supabase) {
      setApiAccessToken(null);
      setSnapshot(buildStaticSnapshot({ configured }));
      return;
    }

    setSnapshot((current) => ({ ...current, isLoading: true }));
    const { error } = await supabase.auth.signOut();
    if (error) {
      setSnapshot((current) => ({ ...current, isLoading: false }));
      throw error;
    }

    await syncSession(null);
  };

  const value = useMemo<AuthState>(
    () => ({
      ...snapshot,
      signInWithPassword,
      signOut,
    }),
    [signInWithPassword, signOut, snapshot]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
