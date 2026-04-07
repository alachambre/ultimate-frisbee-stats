export type AppRole = "public" | "team_member" | "team_analyst" | "admin";
export type AuthEnforcementMode = "off" | "shadow" | "enforced";

export interface AppCapabilities {
  canViewPublicContent: boolean;
  canViewComments: boolean;
  canViewStrategies: boolean;
  canEditData: boolean;
  canViewStatistics: boolean;
  canExportStatistics: boolean;
  canManageUsers: boolean;
}

export interface AuthConfig {
  supabaseUrl: string | null;
  supabaseAnonKey: string | null;
}

export interface AuthState {
  role: AppRole;
  capabilities: AppCapabilities;
  isAuthenticated: boolean;
  hasAppAccess: boolean;
  isLoading: boolean;
  email: string | null;
  isConfigured: boolean;
  enforcementMode: AuthEnforcementMode;
  authUserId: string | null;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}
