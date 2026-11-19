"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { MEDIA_BUCKET } from "@/lib/profile";
import { isReservedSlug, newSlugError, RESERVED_SLUG_MESSAGE } from "@/lib/slug";
import {
  PROFILE_IMAGE_MAX_BYTES,
  PROFILE_IMAGE_TYPES,
  type ProfileImageKind,
  type ProfileImageMime,
} from "@/lib/constants/profile";
import { imageKindSchema, prepareImageSchema, profileSchema } from "@/lib/validations/profile";
import {
  SIGNATURE_BYTES,
  detectImageMime,
  expectedMimeFromPath,
  selectOrphanFiles,
} from "@/lib/image-validation";
import type { EditableProfile } from "@/types/database";

export type ProfileFormValues = {
  displayName: string;
  bio: string;
  city: string;
  state: string;
  sports: string[];
  slug: string;
  isPublic: boolean;
};

export type ProfileFormState = {
  error?: string;
  success?: string;
  fieldErrors?: Partial<Record<keyof ProfileFormValues, string[] | undefined>>;
  values?: ProfileFormValues;
  /** Incrementa a cada envio bem-sucedido (permite reagir no cliente). */
  savedAt?: number;
};

const text = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
};

function revalidateProfile(...slugs: Array<string | null | undefined>) {
  revalidatePath("/painel", "layout");
  for (const slug of new Set(slugs)) if (slug) revalidatePath(`/atleta/${slug}`);
}

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

/** Pasta exclusiva de um tipo de imagem do perfil: "{id}/avatar" ou "{id}/cover". */
const imageFolder = (userId: string, kind: ProfileImageKind) => `${userId}/${kind}`;

/**
 * Apaga a imagem anterior SOMENTE se ela estiver na pasta do mesmo tipo
 * (nunca toca em fotos de provas, treinos ou equipamentos).
 */
async function removePreviousImage(
  supabase: ServerSupabase,
  userId: string,
  kind: ProfileImageKind,
  previous: string | null,
  current: string | null,
) {
  if (!previous || previous === current) return;
  if (!previous.startsWith(`${imageFolder(userId, kind)}/`)) return;
  // Se falhar, o arquivo vira órfão e é recolhido pela próxima limpeza.
  await supabase.storage.from(MEDIA_BUCKET).remove([previous]);
}

/**
 * Limpa arquivos órfãos (uploads interrompidos ou exclusões que falharam)
 * apenas na pasta {id}/{tipo}. Preserva a imagem em uso e arquivos com menos
 * de 1 hora (uploads em andamento em outra aba).
 */
async function cleanupOrphanImages(supabase: ServerSupabase, userId: string, kind: ProfileImageKind) {
  const folder = imageFolder(userId, kind);
  const storage = supabase.storage.from(MEDIA_BUCKET);

  const [{ data: files, error }, { data: profile }] = await Promise.all([
    storage.list(folder, { limit: 100, sortBy: { column: "created_at", order: "asc" } }),
    supabase
      .from("profiles")
      .select("avatar_path, cover_path")
      .eq("id", userId)
      .maybeSingle<Pick<EditableProfile, "avatar_path" | "cover_path">>(),
  ]);
  // Sem a lista ou sem saber a imagem em uso, não apaga nada.
  if (error || !files || !profile) return;

  const orphans = selectOrphanFiles(folder, files, [profile.avatar_path, profile.cover_path], Date.now());
  if (orphans.length) await storage.remove(orphans);
}

/** Lê os primeiros bytes do arquivo enviado para conferir a assinatura real. */
async function readFileSignature(supabase: ServerSupabase, path: string): Promise<Uint8Array | null> {
  const { data } = await supabase.storage.from(MEDIA_BUCKET).createSignedUrl(path, 60);
  if (!data?.signedUrl) return null;
  try {
    const response = await fetch(data.signedUrl, {
      headers: { Range: `bytes=0-${SIGNATURE_BYTES - 1}` },
      cache: "no-store",
    });
    if (!response.ok || !response.body) return null;
    // Lê só o início, mesmo que o servidor ignore o cabeçalho Range.
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (total < SIGNATURE_BYTES) {
      const { done, value } = await reader.read();
      if (done || !value) break;
      chunks.push(value);
      total += value.length;
    }
    await reader.cancel().catch(() => {});
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    return bytes.slice(0, SIGNATURE_BYTES);
  } catch {
    return null;
  }
}

/** Mensagens das exceções lançadas por public.swap_profile_image. */
function swapErrorMessage(message: string | undefined): string {
  if (message?.includes("file_not_found")) return "Não encontramos o arquivo enviado. Tente novamente.";
  if (message?.includes("invalid_file_type") || message?.includes("invalid_file_size")) {
    return "Arquivo inválido. Envie uma imagem JPG, PNG ou WEBP de até 5 MB.";
  }
  return "Não foi possível salvar a imagem. Tente novamente.";
}

// -----------------------------------------------------------------------------
// Salvar dados do perfil
// -----------------------------------------------------------------------------
export async function updateProfileAction(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const user = await getSessionUser();
  if (!user) redirect("/entrar?next=/painel/perfil");

  const values: ProfileFormValues = {
    displayName: text(formData, "displayName"),
    bio: text(formData, "bio"),
    city: text(formData, "city"),
    state: text(formData, "state"),
    sports: formData.getAll("sports").filter((v): v is string => typeof v === "string"),
    slug: text(formData, "slug").trim().toLowerCase(),
    isPublic: formData.get("isPublic") === "on",
  };

  const parsed = profileSchema.safeParse(values);
  if (!parsed.success) {
    return {
      error: "Revise os campos destacados.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      values,
    };
  }
  const input = parsed.data;

  const supabase = await createClient();

  const { data: current } = await supabase
    .from("profiles")
    .select("slug")
    .eq("id", user.id)
    .maybeSingle<Pick<EditableProfile, "slug">>();
  if (!current) return { error: "Perfil não encontrado. Entre novamente.", values };

  if (input.slug !== current.slug) {
    // Reservados só bloqueiam a TROCA de endereço (o banco também garante isso).
    if (isReservedSlug(input.slug)) return { fieldErrors: { slug: [RESERVED_SLUG_MESSAGE] }, values };
    const { data: available, error } = await supabase.rpc("is_slug_available", { p_slug: input.slug });
    if (error) return { error: "Não foi possível verificar o endereço. Tente novamente.", values };
    if (!available) {
      return { fieldErrors: { slug: ["Este endereço já está em uso. Escolha outro."] }, values };
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: input.displayName,
      bio: input.bio,
      city: input.city,
      state: input.state,
      sports: input.sports,
      slug: input.slug,
      is_public: input.isPublic,
      onboarding_done: true,
    })
    .eq("id", user.id);

  if (error) {
    // 23505 = violação de unicidade (alguém pegou o slug entre a checagem e o update)
    if (error.code === "23505") {
      return { fieldErrors: { slug: ["Este endereço já está em uso. Escolha outro."] }, values };
    }
    // 23514 + reserved_slug = gatilho do banco recusou um endereço reservado
    if (error.code === "23514" && error.message.includes("reserved_slug")) {
      return { fieldErrors: { slug: [RESERVED_SLUG_MESSAGE] }, values };
    }
    return { error: "Não foi possível salvar seu perfil. Tente novamente.", values };
  }

  revalidateProfile(current.slug, input.slug);

  return {
    success: input.isPublic
      ? "Perfil salvo! Ele já está visível no seu endereço público."
      : "Perfil salvo! Ele está privado: só você consegue vê-lo.",
    values: {
      ...values,
      displayName: input.displayName,
      bio: input.bio ?? "",
      city: input.city ?? "",
      state: input.state ?? "",
      sports: input.sports,
      slug: input.slug,
    },
    savedAt: Date.now(),
  };
}

// -----------------------------------------------------------------------------
// Checagem de disponibilidade do slug (usada enquanto o atleta digita)
// -----------------------------------------------------------------------------
export type SlugCheckResult = { available: boolean; message: string };

export async function checkSlugAction(rawSlug: string): Promise<SlugCheckResult> {
  const user = await getSessionUser();
  if (!user) return { available: false, message: "Sua sessão expirou. Entre novamente." };

  const slug = typeof rawSlug === "string" ? rawSlug.trim().toLowerCase() : "";
  const formatError = newSlugError(slug);
  if (formatError) return { available: false, message: formatError };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("is_slug_available", { p_slug: slug });
  if (error) return { available: false, message: "Não foi possível verificar agora." };
  return data
    ? { available: true, message: "Endereço disponível." }
    : { available: false, message: "Este endereço já está em uso." };
}

// -----------------------------------------------------------------------------
// Tela de boas-vindas
// -----------------------------------------------------------------------------
export async function completeOnboardingAction(formData: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!user) redirect("/entrar");

  const destination = text(formData, "next") === "perfil" ? "/painel/perfil" : "/painel";

  const supabase = await createClient();
  await supabase.from("profiles").update({ onboarding_done: true }).eq("id", user.id);

  revalidatePath("/painel", "layout");
  redirect(destination);
}

// -----------------------------------------------------------------------------
// Upload de foto de perfil e capa
//  1. prepare: o servidor valida tipo/tamanho e gera um link de upload para um
//     caminho que ELE escolhe, dentro da pasta do usuário.
//  2. o navegador envia o arquivo direto ao Supabase Storage (sem passar pela
//     Vercel, que limita o corpo das requisições).
//  3. commit: o servidor confere o arquivo enviado e grava no perfil.
// -----------------------------------------------------------------------------
export type ImageActionResult =
  | { ok: true; path?: string; token?: string; url?: string | null }
  | { ok: false; error: string };

export async function prepareProfileImageAction(input: {
  kind: string;
  contentType: string;
  size: number;
}): Promise<ImageActionResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Sua sessão expirou. Entre novamente." };

  const parsed = prepareImageSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Arquivo inválido." };
  }

  const ext = PROFILE_IMAGE_TYPES[parsed.data.contentType as ProfileImageMime];
  const path = `${user.id}/${parsed.data.kind}/${randomUUID()}.${ext}`;

  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(MEDIA_BUCKET).createSignedUploadUrl(path);
  if (error || !data) return { ok: false, error: "Não foi possível iniciar o envio. Tente novamente." };

  return { ok: true, path: data.path, token: data.token };
}

export async function commitProfileImageAction(input: { kind: string; path: string }): Promise<ImageActionResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Sua sessão expirou. Entre novamente." };

  const kindParsed = imageKindSchema.safeParse(input?.kind);
  if (!kindParsed.success || typeof input.path !== "string") return { ok: false, error: "Dados inválidos." };
  const kind = kindParsed.data;

  // Só aceita caminhos no formato que o próprio servidor gera.
  const expected = new RegExp(
    `^${user.id}/${kind}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(jpg|png|webp)$`,
  );
  if (!expected.test(input.path)) return { ok: false, error: "Arquivo inválido." };

  const supabase = await createClient();
  const storage = supabase.storage.from(MEDIA_BUCKET);
  const invalid = async () => {
    await storage.remove([input.path]);
    return { ok: false as const, error: "Arquivo inválido. Envie uma imagem JPG, PNG ou WEBP de até 5 MB." };
  };

  // 1. Existência, Content-Type e tamanho registrados pelo Storage.
  const { data: info, error: infoError } = await storage.info(input.path);
  if (infoError || !info) return { ok: false, error: "Não encontramos o arquivo enviado. Tente novamente." };

  const contentType = (info.contentType ?? info.metadata?.mimetype ?? "") as string;
  const size = Number(info.size ?? info.metadata?.size ?? 0);
  if (!(contentType in PROFILE_IMAGE_TYPES) || size <= 0 || size > PROFILE_IMAGE_MAX_BYTES) return invalid();

  // 2. Content-Type precisa corresponder à extensão do caminho.
  if (expectedMimeFromPath(input.path) !== contentType) return invalid();

  // 3. Assinatura real do arquivo (magic bytes) precisa corresponder ao tipo.
  const signature = await readFileSignature(supabase, input.path);
  if (!signature) return { ok: false, error: "Não foi possível verificar a imagem. Tente novamente." };
  if (detectImageMime(signature) !== contentType) return invalid();

  // 4. Troca transacional no banco (que revalida caminho, tipo e tamanho).
  const { data: previous, error } = await supabase.rpc("swap_profile_image", { p_kind: kind, p_path: input.path });
  if (error) {
    await storage.remove([input.path]);
    return { ok: false, error: swapErrorMessage(error.message) };
  }

  // 5. Remove a imagem anterior e eventuais órfãos da mesma pasta.
  await removePreviousImage(supabase, user.id, kind, (previous as string | null) ?? null, input.path);
  await cleanupOrphanImages(supabase, user.id, kind);

  const [{ data: signed }, { data: profile }] = await Promise.all([
    storage.createSignedUrl(input.path, 60 * 60),
    supabase.from("profiles").select("slug").eq("id", user.id).maybeSingle<Pick<EditableProfile, "slug">>(),
  ]);
  revalidateProfile(profile?.slug);
  return { ok: true, path: input.path, url: signed?.signedUrl ?? null };
}

export async function removeProfileImageAction(input: { kind: string }): Promise<ImageActionResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Sua sessão expirou. Entre novamente." };

  const kindParsed = imageKindSchema.safeParse(input?.kind);
  if (!kindParsed.success) return { ok: false, error: "Dados inválidos." };
  const kind = kindParsed.data;

  const supabase = await createClient();
  // Limpa a coluna e devolve o caminho anterior na mesma transação.
  const { data: previous, error } = await supabase.rpc("swap_profile_image", { p_kind: kind, p_path: null });
  if (error) return { ok: false, error: "Não foi possível remover a imagem. Tente novamente." };

  await removePreviousImage(supabase, user.id, kind, (previous as string | null) ?? null, null);
  await cleanupOrphanImages(supabase, user.id, kind);

  const { data: profile } = await supabase
    .from("profiles")
    .select("slug")
    .eq("id", user.id)
    .maybeSingle<Pick<EditableProfile, "slug">>();
  revalidateProfile(profile?.slug);
  return { ok: true, url: null };
}
