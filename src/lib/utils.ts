/** Junta classes CSS ignorando valores vazios. */
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/** Iniciais para avatares sem foto: "Ana Ferreira" -> "AF". */
export function initials(name: string | null | undefined): string {
  return (name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
