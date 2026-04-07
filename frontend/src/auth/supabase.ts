import type { SupabaseClient } from "@supabase/supabase-js";

import { getAuthConfig, isAuthConfigured } from "./config";

let supabaseClient: SupabaseClient | null | undefined;
let supabaseClientPromise: Promise<SupabaseClient | null> | null = null;

export async function loadSupabaseClient(): Promise<SupabaseClient | null> {
  if (supabaseClient !== undefined) {
    return Promise.resolve(supabaseClient);
  }

  if (supabaseClientPromise) {
    return supabaseClientPromise;
  }

  const config = getAuthConfig();
  if (!isAuthConfigured(config)) {
    supabaseClient = null;
    return Promise.resolve(supabaseClient);
  }

  const { supabaseUrl, supabaseAnonKey } = config;

  supabaseClientPromise = import("@supabase/supabase-js")
    .then(({ createClient }) => {
      supabaseClient = createClient(
        supabaseUrl as string,
        supabaseAnonKey as string,
        {
          auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
          },
        }
      );
      return supabaseClient;
    })
    .finally(() => {
      supabaseClientPromise = null;
    });

  return supabaseClientPromise;
}
