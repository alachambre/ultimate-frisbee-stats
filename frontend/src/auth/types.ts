export type AppRole = "public" | "team_member" | "team_analyst" | "admin";

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
  isLoading: boolean;
  email: string | null;
  isConfigured: boolean;
}
