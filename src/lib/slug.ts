import { RESERVED_SLUGS, SLUG_MAX, SLUG_MIN, SLUG_PATTERN } from "@/lib/constants/profile";

/** "João da Silva" -> "joao-da-silva" (mesma regra da função public.slugify do banco). */
export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX)
    .replace(/-+$/g, "");
}

export const isReservedSlug = (slug: string) => RESERVED_SLUGS.has(slug);

/**
 * Erro de FORMATO do slug, ou null quando o formato é válido.
 * Não verifica palavras reservadas: um slug reservado gerado no cadastro
 * (ex.: "atleta") continua válido enquanto o atleta não trocar de endereço.
 */
export function slugFormatError(slug: string): string | null {
  if (slug.length < SLUG_MIN) return `Use pelo menos ${SLUG_MIN} caracteres.`;
  if (slug.length > SLUG_MAX) return `Use no máximo ${SLUG_MAX} caracteres.`;
  if (!SLUG_PATTERN.test(slug)) {
    return "Use apenas letras minúsculas, números e hífens (sem hífen no início, no fim ou repetido).";
  }
  return null;
}

export const RESERVED_SLUG_MESSAGE = "Este endereço é reservado. Escolha outro.";

/** Erro para um NOVO slug (formato + reservados), ou null quando pode ser usado. */
export function newSlugError(slug: string): string | null {
  return slugFormatError(slug) ?? (isReservedSlug(slug) ? RESERVED_SLUG_MESSAGE : null);
}
