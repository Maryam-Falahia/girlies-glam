import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

export function supabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // The auth client sends this key as Authorization: Bearer. Publishable keys are not
  // JWTs, so GoTrue rejects password sign-in. The anon key is a JWT and belongs here.
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return { url, key };
}

let browserClient: SupabaseClient | null = null;

export function getSupabase() {
  const env = supabaseEnv();
  if (!env) return null;
  if (!browserClient) browserClient = createBrowserClient(env.url, env.key);
  return browserClient;
}
