import type { AuthConfig } from "./types";

type AuthEnv = Pick<ImportMetaEnv, "VITE_SUPABASE_URL" | "VITE_SUPABASE_ANON_KEY">;

export function getAuthConfig(env: AuthEnv = import.meta.env): AuthConfig {
  return {
    supabaseUrl: env.VITE_SUPABASE_URL ?? null,
    supabaseAnonKey: env.VITE_SUPABASE_ANON_KEY ?? null,
  };
}

export function isAuthConfigured(config: AuthConfig): boolean {
  return Boolean(config.supabaseUrl && config.supabaseAnonKey);
}
