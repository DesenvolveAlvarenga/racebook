/**
 * Aceita apenas caminhos internos (ex.: "/painel").
 * Bloqueia redirecionamentos abertos como "//site-malicioso.com" ou "https://...".
 */
export function safeNextPath(value: unknown, fallback = "/painel"): string {
  if (typeof value !== "string" || value.length === 0 || value.length > 512) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}
