import { UserRoundX } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

/**
 * Mensagem única para perfil inexistente OU privado.
 * Não diferenciar os dois casos evita revelar que um perfil privado existe.
 */
export function ProfileUnavailable() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-5 py-20 text-center">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-navy-50 text-navy-400">
        <UserRoundX className="size-8" aria-hidden="true" />
      </span>
      <h1 className="mt-6 font-display text-4xl font-extrabold uppercase italic leading-none text-navy-950">
        Perfil indisponível
      </h1>
      <p className="mt-3 text-navy-500">
        Este perfil não existe ou é privado. Confira o endereço ou peça ao atleta para tornar o perfil público.
      </p>
      <ButtonLink href="/" variant="outline" className="mt-8">
        Ir para o Racebook
      </ButtonLink>
    </div>
  );
}
