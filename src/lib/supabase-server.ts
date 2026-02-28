import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { getOptionalEnv, getRequiredEnv, isProductionRuntime } from "@/lib/env";

function getServerSupabaseClient() {
  const url = getOptionalEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = getOptionalEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (isProductionRuntime()) {
    if (!url) getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
    if (!anonKey) getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  if (!url || !anonKey) return null;

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export async function getAuthenticatedUserFromRequest(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) return null;

  const supabase = getServerSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}
