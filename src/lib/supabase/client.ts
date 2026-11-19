import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";

/** Cliente Supabase para Client Components (navegador). Usa apenas a chave pública. */
export function createClient() {
  return createBrowserClient(env.supabaseUrl(), env.supabaseKey());
}
