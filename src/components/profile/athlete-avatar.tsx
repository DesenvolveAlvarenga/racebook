import { cn, initials } from "@/lib/utils";

type Size = "sm" | "md" | "lg" | "xl";

const sizes: Record<Size, string> = {
  sm: "size-9 text-sm",
  md: "size-14 text-lg",
  lg: "size-24 text-3xl",
  xl: "size-32 text-4xl sm:size-40 sm:text-5xl",
};

type Props = {
  name: string;
  /** Link assinado da foto (ou null para mostrar as iniciais). */
  src?: string | null;
  size?: Size;
  className?: string;
};

/**
 * Foto do atleta com iniciais como alternativa.
 * Usa <img> comum: os links assinados mudam a cada acesso e passariam pelo
 * otimizador de imagens da Vercel como imagens sempre novas.
 */
export function AthleteAvatar({ name, src, size = "md", className }: Props) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-navy-900 font-display font-extrabold italic text-white",
        sizes[size],
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={`Foto de ${name}`} className="size-full object-cover" decoding="async" />
      ) : (
        <span aria-hidden="true">{initials(name) || "A"}</span>
      )}
    </span>
  );
}
