import { ArrowRight, Medal, Timer, Waves } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";
import { getSessionUser } from "@/lib/auth";

// Página inicial provisória — a landing page completa será construída na Etapa 6.
export default async function HomePage() {
  const user = await getSessionUser();

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-navy-950 text-white">
      <div className="bg-speed-stripes absolute inset-0" aria-hidden="true" />
      <div className="absolute -right-40 -bottom-40 size-[640px] rounded-full bg-accent-500/20 blur-3xl" aria-hidden="true" />

      <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
        <Logo tone="light" />
        {user ? (
          <ButtonLink href="/painel" variant="light" size="sm">
            Meu painel
          </ButtonLink>
        ) : (
          <ButtonLink href="/entrar" variant="light" size="sm">
            Entrar
          </ButtonLink>
        )}
      </header>

      <main className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-5 pb-16 sm:px-8">
        <div className="max-w-3xl animate-fade-up">
          <p className="font-display text-sm font-bold uppercase tracking-[0.3em] text-accent-400">
            Portfólio esportivo para atletas
          </p>
          <h1 className="mt-5 font-display text-6xl font-extrabold uppercase italic leading-[0.9] sm:text-8xl">
            Sua trajetória
            <br />
            merece <span className="text-accent-500">palco.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-navy-100">
            Registre provas, tempos, pódios, equipamentos e fotos em um perfil profissional para compartilhar com
            quem acompanha sua jornada.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href={user ? "/painel" : "/cadastro"} size="lg">
              {user ? "Ir para o meu painel" : "Criar meu perfil"}
              <ArrowRight className="size-5" aria-hidden="true" />
            </ButtonLink>
          </div>

          <ul className="mt-14 flex flex-wrap gap-x-8 gap-y-3 text-sm text-navy-200">
            <li className="flex items-center gap-2">
              <Timer className="size-4 text-accent-400" aria-hidden="true" /> Tempos e colocações
            </li>
            <li className="flex items-center gap-2">
              <Medal className="size-4 text-accent-400" aria-hidden="true" /> Pódios e conquistas
            </li>
            <li className="flex items-center gap-2">
              <Waves className="size-4 text-accent-400" aria-hidden="true" /> Corrida, triathlon, natação e mais
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
