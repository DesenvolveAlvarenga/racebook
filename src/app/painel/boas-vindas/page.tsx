import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ArrowRight, Camera, Globe, Link2 } from "lucide-react";
import { completeOnboardingAction } from "@/lib/actions/profile";
import { requireUser } from "@/lib/auth";
import { getOwnProfile } from "@/lib/profile";
import { SubmitButton } from "@/components/ui/submit-button";

export const metadata: Metadata = { title: "Boas-vindas" };

const steps = [
  {
    icon: Camera,
    title: "Monte seu perfil",
    text: "Foto, capa, biografia, cidade e as modalidades que você pratica.",
  },
  {
    icon: Link2,
    title: "Escolha seu endereço",
    text: "Um link curto e só seu para compartilhar no Instagram, Strava ou WhatsApp.",
  },
  {
    icon: Globe,
    title: "Decida quem vê",
    text: "Seu perfil começa privado. Torne-o público quando estiver pronto.",
  },
];

export default async function WelcomePage() {
  const user = await requireUser("/painel/boas-vindas");
  const profile = await getOwnProfile(user.id);
  // A tela aparece só no primeiro acesso.
  if (!profile || profile.onboarding_done) redirect("/painel");

  const firstName = profile.display_name.split(/\s+/)[0];

  return (
    <div className="mx-auto max-w-3xl animate-fade-up">
      <section className="relative overflow-hidden rounded-3xl bg-navy-950 px-6 py-10 text-white sm:px-10 sm:py-14">
        <div className="bg-speed-stripes absolute inset-0" aria-hidden="true" />
        <div className="absolute -top-24 -right-24 size-72 rounded-full bg-accent-500/25 blur-3xl" aria-hidden="true" />
        <div className="relative">
          <p className="font-display text-sm font-bold uppercase tracking-[0.25em] text-accent-400">Largada dada</p>
          <h1 className="mt-3 font-display text-5xl font-extrabold uppercase italic leading-[0.9] sm:text-7xl">
            Bem-vindo ao
            <br />
            Racebook, <span className="text-accent-500">{firstName}!</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-navy-100">
            Sua conta está pronta. Em poucos minutos você terá um portfólio esportivo profissional para mostrar sua
            trajetória.
          </p>
        </div>
      </section>

      <ol className="mt-6 grid gap-4 sm:grid-cols-3">
        {steps.map(({ icon: Icon, title, text }, index) => (
          <li key={title} className="rounded-2xl border border-navy-100 bg-white p-5">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <span className="font-display text-3xl font-extrabold italic text-navy-200">0{index + 1}</span>
            </div>
            <h2 className="mt-4 font-semibold text-navy-950">{title}</h2>
            <p className="mt-1 text-sm text-navy-500">{text}</p>
          </li>
        ))}
      </ol>

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <form action={completeOnboardingAction}>
          <input type="hidden" name="next" value="painel" />
          <SubmitButton variant="ghost" size="lg" className="w-full sm:w-auto" pendingLabel="Abrindo…">
            Fazer isso depois
          </SubmitButton>
        </form>
        <form action={completeOnboardingAction}>
          <input type="hidden" name="next" value="perfil" />
          <SubmitButton size="lg" className="w-full sm:w-auto" pendingLabel="Abrindo…">
            Completar meu perfil
            <ArrowRight className="size-5" aria-hidden="true" />
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}
