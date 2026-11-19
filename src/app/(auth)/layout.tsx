import { Medal, Mountain, Timer } from "lucide-react";
import { Logo } from "@/components/brand/logo";

const highlights = [
  { icon: Timer, text: "Registre provas, tempos e colocações" },
  { icon: Medal, text: "Mostre pódios, medalhas e conquistas" },
  { icon: Mountain, text: "Da corrida de rua ao triathlon e às águas abertas" },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* Lado esportivo (somente desktop) */}
      <aside className="relative hidden overflow-hidden bg-navy-950 lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <div className="bg-speed-stripes absolute inset-0" aria-hidden="true" />
        <div
          className="absolute -right-32 -bottom-32 size-[520px] rounded-full bg-accent-500/20 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative">
          <Logo tone="light" />
        </div>

        <div className="relative max-w-lg">
          <p className="font-display text-sm font-bold uppercase tracking-[0.25em] text-accent-400">
            Portfólio esportivo
          </p>
          <h2 className="mt-4 font-display text-6xl font-extrabold italic uppercase leading-[0.92] text-white xl:text-7xl">
            Cada prova
            <br />
            conta a sua
            <br />
            <span className="text-accent-500">história.</span>
          </h2>
          <ul className="mt-10 space-y-4">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-navy-100">
                <span className="flex size-9 items-center justify-center rounded-lg bg-white/8 text-accent-400">
                  <Icon className="size-[18px]" aria-hidden="true" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-navy-300">© {new Date().getFullYear()} Racebook</p>
      </aside>

      {/* Formulário */}
      <main className="flex flex-col px-5 py-8 sm:px-10 lg:justify-center lg:px-16">
        <div className="mb-10 lg:hidden">
          <Logo />
        </div>
        <div className="mx-auto w-full max-w-md animate-fade-up">{children}</div>
      </main>
    </div>
  );
}
