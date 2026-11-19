import "server-only";
import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import {
  EDITABLE_PROFILE_COLUMNS,
  PUBLIC_PROFILE_COLUMNS,
  type EditableProfile,
  type ProfileStats,
  type PublicProfile,
} from "@/types/database";

export const MEDIA_BUCKET = "media";
/** Validade dos links assinados das imagens (segundos). */
const SIGNED_URL_TTL = 60 * 60;

/**
 * Gera links temporários para arquivos do bucket privado.
 * O Storage só assina o que a RLS permite a este cliente:
 * arquivos do próprio usuário ou vinculados a perfis públicos.
 */
export async function signMediaPaths(
  supabase: SupabaseClient,
  paths: Array<string | null | undefined>,
): Promise<Record<string, string>> {
  const unique = Array.from(new Set(paths.filter((p): p is string => Boolean(p))));
  if (unique.length === 0) return {};
  const { data, error } = await supabase.storage.from(MEDIA_BUCKET).createSignedUrls(unique, SIGNED_URL_TTL);
  if (error || !data) return {};
  const result: Record<string, string> = {};
  for (const item of data) {
    if (item.path && item.signedUrl && !item.error) result[item.path] = item.signedUrl;
  }
  return result;
}

/** Perfil do usuário logado (memorizado por requisição). */
export const getOwnProfile = cache(async (userId: string): Promise<EditableProfile | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select(EDITABLE_PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle<EditableProfile>();
  return data ?? null;
});

/** Perfil do usuário logado + links assinados de foto e capa. */
export const getOwnProfileWithImages = cache(async (userId: string) => {
  const profile = await getOwnProfile(userId);
  if (!profile) return null;
  const supabase = await createClient();
  const urls = await signMediaPaths(supabase, [profile.avatar_path, profile.cover_path]);
  return {
    profile,
    avatarUrl: profile.avatar_path ? (urls[profile.avatar_path] ?? null) : null,
    coverUrl: profile.cover_path ? (urls[profile.cover_path] ?? null) : null,
  };
});

export type AthletePageData = {
  profile: PublicProfile;
  stats: ProfileStats | null;
  avatarUrl: string | null;
  coverUrl: string | null;
};

/**
 * Carrega a página de um atleta.
 *  - asOwner = true  → usa a sessão do dono (vê tudo, inclusive se privado)
 *  - asOwner = false → usa o papel anônimo: exatamente o que um visitante vê
 * Perfis privados não são retornados para visitantes (a RLS bloqueia a linha).
 */
export const getAthletePage = cache(async (slug: string, asOwner: boolean): Promise<AthletePageData | null> => {
  const supabase = asOwner ? await createClient() : createPublicClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select(PUBLIC_PROFILE_COLUMNS)
    .eq("slug", slug)
    .maybeSingle<PublicProfile>();
  if (!profile) return null;

  const [{ data: stats }, urls] = await Promise.all([
    supabase.from("profile_stats").select("*").eq("athlete_id", profile.id).maybeSingle<ProfileStats>(),
    signMediaPaths(supabase, [profile.avatar_path, profile.cover_path]),
  ]);

  return {
    profile,
    stats: stats ?? null,
    avatarUrl: profile.avatar_path ? (urls[profile.avatar_path] ?? null) : null,
    coverUrl: profile.cover_path ? (urls[profile.cover_path] ?? null) : null,
  };
});

/** Slug do perfil dono de uma sessão (para decidir se quem visita é o dono). */
export async function getOwnSlug(userId: string): Promise<string | null> {
  return (await getOwnProfile(userId))?.slug ?? null;
}
