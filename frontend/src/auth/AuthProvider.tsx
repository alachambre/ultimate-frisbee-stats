import { createContext, useContext, useMemo, type ReactNode } from "react";

import { getCapabilitiesForRole } from "./capabilities";
import { getAuthConfig, isAuthConfigured } from "./config";
import type { AppRole, AuthState } from "./types";

interface AuthProviderProps {
  children: ReactNode;
  role?: AppRole;
  email?: string | null;
  isLoading?: boolean;
}

const defaultAuthState: AuthState = {
  role: "public",
  capabilities: getCapabilitiesForRole("public"),
  isAuthenticated: false,
  isLoading: false,
  email: null,
  isConfigured: false,
};

const AuthContext = createContext<AuthState>(defaultAuthState);

export function AuthProvider({
  children,
  role = "public",
  email = null,
  isLoading = false,
}: AuthProviderProps) {
  const { supabaseUrl, supabaseAnonKey } = getAuthConfig();

  const value = useMemo<AuthState>(
    () => ({
      role,
      capabilities: getCapabilitiesForRole(role),
      isAuthenticated: role !== "public",
      isLoading,
      email,
      isConfigured: isAuthConfigured({
        supabaseUrl,
        supabaseAnonKey,
      }),
    }),
    [email, isLoading, role, supabaseAnonKey, supabaseUrl]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
