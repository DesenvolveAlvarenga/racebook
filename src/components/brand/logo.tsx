import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoProps = {
  /** "dark" para fundos claros, "light" para fundos escuros */
  tone?: "dark" | "light";
  href?: string | null;
  className?: string;
};

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={cn("size-8 shrink-0", className)}>
      <rect width="64" height="64" rx="14" className="fill-navy-900" />
      <path d="M14 44 L26 20 H34 L22 44 Z" className="fill-accent-500" />
      <path d="M28 44 L40 20 H48 L36 44 Z" fill="#fff" />
    </svg>
  );
}

export function Logo({ tone = "dark", href = "/", className }: LogoProps) {
  const content = (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span
        className={cn(
          "font-display text-2xl font-extrabold italic uppercase tracking-tight leading-none",
          tone === "dark" ? "text-navy-950" : "text-white",
        )}
      >
        Race<span className="text-accent-500">book</span>
      </span>
    </span>
  );

  if (!href) return content;
  return (
    <Link href={href} aria-label="Racebook — página inicial" className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-500">
      {content}
    </Link>
  );
}
