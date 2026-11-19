import { Logo } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-5 py-12 text-center">
      <Logo />
      <p className="mt-12 font-display text-8xl font-extrabold italic text-accent-500">404</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold uppercase italic text-navy-950">
        Fora do percurso
      </h1>
      <p className="mt-3 max-w-sm text-navy-500">A página que você procura não existe ou não está disponível.</p>
      <ButtonLink href="/" className="mt-8">
        Voltar ao início
      </ButtonLink>
    </main>
  );
}
