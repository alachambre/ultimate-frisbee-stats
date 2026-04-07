import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getAuthConfig, isAuthConfigured } from "./config";

let supabaseClient: SupabaseClient | null | undefined;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClient !== undefined) {
    return supabaseClient;
  }

  const config = getAuthConfig();
  if (!isAuthConfigured(config)) {
    supabaseClient = null;
    return supabaseClient;
  }

  const { supabaseUrl, supabaseAnonKey } = config;
  supabaseClient = createClient(supabaseUrl as string, supabaseAnonKey as string, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
  return supabaseClient;
}
