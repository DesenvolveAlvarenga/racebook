// Funções puras de validação de imagens (sem dependências de servidor/navegador).
import type { ProfileImageMime } from "@/lib/constants/profile";

export const MIME_BY_EXTENSION: Record<string, ProfileImageMime> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/** Bytes necessários para identificar JPG, PNG e WEBP. */
export const SIGNATURE_BYTES = 12;

/**
 * Identifica o tipo REAL do arquivo pela assinatura (magic bytes),
 * independentemente da extensão ou do Content-Type informado.
 */
export function detectImageMime(bytes: Uint8Array): ProfileImageMime | null {
  const b = bytes;
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (
    b.length >= 8 &&
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
    b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    b.length >= 12 &&
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && // "RIFF"
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50 // "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

/** Extensão do caminho → MIME esperado (ou null se não suportada). */
export function expectedMimeFromPath(path: string): ProfileImageMime | null {
  const ext = /\.([a-z0-9]+)$/.exec(path)?.[1];
  return ext ? (MIME_BY_EXTENSION[ext] ?? null) : null;
}

export type StoredFile = { name: string; id?: string | null; created_at?: string | null };

/** Período em que um arquivo recém-enviado é preservado (upload em andamento em outra aba). */
export const ORPHAN_GRACE_MS = 60 * 60 * 1000;

/**
 * Escolhe quais arquivos de UMA pasta ({id}/{tipo}) podem ser apagados:
 * não estão em uso e foram criados há mais de `graceMs`.
 * Itens sem id (subpastas) ou sem data são sempre preservados.
 */
export function selectOrphanFiles(
  folder: string,
  files: StoredFile[],
  keep: Array<string | null | undefined>,
  now: number,
  graceMs = ORPHAN_GRACE_MS,
): string[] {
  const keepSet = new Set(keep.filter(Boolean));
  return files
    .filter((file) => {
      if (!file.id || !file.created_at || file.name.includes("/")) return false;
      const fullPath = `${folder}/${file.name}`;
      if (keepSet.has(fullPath)) return false;
      const created = Date.parse(file.created_at);
      return Number.isFinite(created) && now - created > graceMs;
    })
    .map((file) => `${folder}/${file.name}`);
}
