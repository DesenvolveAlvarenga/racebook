import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/**
 * Cliente Supabase SEM sessão (papel "anon"), apenas no servidor.
 * Enxerga exatamente o que um visitante não logado enxerga pela RLS.
 * Usado na página pública do atleta e no modo "ver como visitante".
 */
export function createPublicClient() {
  return createSupabaseClient(env.supabaseUrl(), env.supabaseKey(), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
