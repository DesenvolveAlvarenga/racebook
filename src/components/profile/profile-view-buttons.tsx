import { Eye, UserRound } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

/** Atalhos para o atleta ver o próprio perfil (como dono e como visitante). */
export function ProfileViewButtons({ slug, className }: { slug: string; className?: string }) {
  return (
    <div className={className ?? "flex flex-wrap gap-2"}>
      <ButtonLink href={`/atleta/${slug}`} variant="outline" size="sm">
        <UserRound className="size-4" aria-hidden="true" />
        Ver meu perfil
      </ButtonLink>
      <ButtonLink href={`/atleta/${slug}?visitante=1`} variant="secondary" size="sm">
        <Eye className="size-4" aria-hidden="true" />
        Ver como visitante
      </ButtonLink>
    </div>
  );
}
