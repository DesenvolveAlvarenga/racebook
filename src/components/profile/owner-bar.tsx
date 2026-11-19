import Link from "next/link";
import { Eye, EyeOff, Globe, Lock, UserRoundPen } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  slug: string;
  isPublic: boolean;
  /** true quando o dono está vendo o perfil como visitante. */
  visitorMode: boolean;
};

/** Barra visível somente para o dono do perfil. */
export function OwnerBar({ slug, isPublic, visitorMode }: Props) {
  return (
    <div
      className={cn(
        "sticky top-0 z-30 border-b text-sm",
        visitorMode ? "border-accent-600 bg-accent-500 text-white" : "border-navy-800 bg-navy-900 text-white",
      )}
      style={{ top: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="flex items-center gap-2 font-medium">
          {visitorMode ? (
            <>
              <Eye className="size-4 shrink-0" aria-hidden="true" />
              Modo visitante: é exatamente assim que outras pessoas veem seu perfil.
            </>
          ) : isPublic ? (
            <>
              <Globe className="size-4 shrink-0 text-accent-400" aria-hidden="true" />
              Este é o seu perfil. Ele está público.
            </>
          ) : (
            <>
              <Lock className="size-4 shrink-0 text-accent-400" aria-hidden="true" />
              Este é o seu perfil. Ele está privado: só você consegue vê-lo.
            </>
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          {visitorMode ? (
            <ButtonLink href={`/atleta/${slug}`} variant="light" size="sm">
              <EyeOff className="size-4" aria-hidden="true" />
              Sair do modo visitante
            </ButtonLink>
          ) : (
            <>
              <ButtonLink href="/painel/perfil" variant="light" size="sm">
                <UserRoundPen className="size-4" aria-hidden="true" />
                Editar perfil
              </ButtonLink>
              <Link
                href={`/atleta/${slug}?visitante=1`}
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3.5 font-semibold text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
              >
                <Eye className="size-4" aria-hidden="true" />
                Ver como visitante
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
