import { createClient } from "@supabase/supabase-js";
import { getOptionalEnv, getRequiredEnv, isProductionRuntime } from "@/lib/env";

let client: ReturnType<typeof createClient> | null = null;

export function hasSupabaseBrowserConfig() {
  const url = getOptionalEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = getOptionalEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return Boolean(url && anonKey);
}

export function getSupabaseBrowserClient() {
  if (client) return client;

  const url = getOptionalEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = getOptionalEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (isProductionRuntime()) {
    if (!url) getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
    if (!anonKey) getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  if (!url || !anonKey) {
    return null;
  }

  client = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return client;
}
