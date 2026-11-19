import { redirect } from "next/navigation";
import { AtSign, CircleCheck, Circle, KeyRound, Link2, Lock, Globe, ShieldCheck, UserRoundPen } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { ProfileViewButtons } from "@/components/profile/profile-view-buttons";
import { requireUser } from "@/lib/auth";
import { getSiteUrl } from "@/lib/env";
import { getOwnProfile } from "@/lib/profile";
import { cn } from "@/lib/utils";

type Props = { searchParams: Promise<{ senha?: string }> };

export default async function DashboardPage({ searchParams }: Props) {
  const [{ senha }, user] = await Promise.all([searchParams, requireUser("/painel")]);
  const profile = await getOwnProfile(user.id);

  // Primeiro acesso após o cadastro: tela de boas-vindas.
  if (profile && !profile.onboarding_done) redirect("/painel/boas-vindas");

  const firstName = profile?.display_name.split(/\s+/)[0] ?? "atleta";
  const profileUrl = profile ? `${getSiteUrl().replace(/^https?:\/\//, "")}/atleta/${profile.slug}` : null;

  // Itens reais do perfil, usados para o indicador de preenchimento.
  const checklist = profile
    ? [
        { label: "Foto de perfil", done: Boolean(profile.avatar_path) },
        { label: "Imagem de capa", done: Boolean(profile.cover_path) },
        { label: "Biografia", done: Boolean(profile.bio) },
        { label: "Cidade e estado", done: Boolean(profile.city && profile.state) },
        { label: "Modalidades", done: profile.sports.length > 0 },
        { label: "Perfil público", done: profile.is_public },
      ]
    : [];
  const completed = checklist.filter((item) => item.done).length;
  const percent = checklist.length ? Math.round((completed / checklist.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {senha === "atualizada" ? <Alert tone="success">Sua senha foi atualizada com sucesso.</Alert> : null}

      {/* Boas-vindas */}
      <section className="relative overflow-hidden rounded-3xl bg-navy-950 px-6 py-10 text-white sm:px-10 sm:py-12">
        <div className="bg-speed-stripes absolute inset-0" aria-hidden="true" />
        <div className="absolute -top-24 -right-24 size-72 rounded-full bg-accent-500/25 blur-3xl" aria-hidden="true" />
        <div className="relative">
          <p className="font-display text-sm font-bold uppercase tracking-[0.25em] text-accent-400">Painel do atleta</p>
          <h1 className="mt-3 font-display text-4xl font-extrabold uppercase italic leading-none sm:text-6xl">
            Bem-vindo, {firstName}!
          </h1>
          <p className="mt-4 max-w-xl text-navy-100">
            Aqui você monta seu portfólio esportivo: perfil, provas, resultados, equipamentos, treinos e fotos.
          </p>
        </div>
      </section>

      {/* Perfil */}
      {profile ? (
        <section className="rounded-2xl border border-navy-100 bg-white p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="font-display text-2xl font-extrabold uppercase italic leading-none text-navy-950">
                Seu perfil está {percent}% completo
              </h2>
              <p className="mt-1.5 text-sm text-navy-500">
                Perfis completos transmitem mais credibilidade para patrocinadores, assessorias e amigos.
              </p>
            </div>
            <ButtonLink href="/painel/perfil" size="sm" className="shrink-0">
              <UserRoundPen className="size-4" aria-hidden="true" />
              Editar perfil
            </ButtonLink>
          </div>
          <div
            className="mt-5 h-2 overflow-hidden rounded-full bg-navy-50"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Preenchimento do perfil"
          >
            <div className="h-full rounded-full bg-accent-500 transition-all" style={{ width: `${percent}%` }} />
          </div>
          <ul className="mt-5 grid gap-2 text-sm min-[420px]:grid-cols-2 md:grid-cols-3">
            {checklist.map((item) => (
              <li key={item.label} className={cn("flex items-center gap-2", item.done ? "text-navy-900" : "text-navy-400")}>
                {item.done ? (
                  <CircleCheck className="size-4 text-emerald-600" aria-hidden="true" />
                ) : (
                  <Circle className="size-4" aria-hidden="true" />
                )}
                {item.label}
                <span className="sr-only">{item.done ? "(concluído)" : "(pendente)"}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Conta */}
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-navy-100 bg-white p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-navy-500">
            <AtSign className="size-4" aria-hidden="true" /> E-mail da conta
          </div>
          <p className="mt-2 truncate font-semibold text-navy-950">{user.email}</p>
        </div>

        <div className="rounded-2xl border border-navy-100 bg-white p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-navy-500">
            <Link2 className="size-4" aria-hidden="true" /> Endereço do seu perfil
          </div>
          <p className="mt-2 truncate font-semibold text-navy-950">{profileUrl ?? "—"}</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-navy-400">
            {profile?.is_public ? (
              <>
                <Globe className="size-3.5" aria-hidden="true" /> Perfil público
              </>
            ) : (
              <>
                <Lock className="size-3.5" aria-hidden="true" /> Perfil privado: só você pode ver.
              </>
            )}
          </p>
          {profile ? <ProfileViewButtons slug={profile.slug} className="mt-3 flex flex-wrap gap-2" /> : null}
        </div>

        <div className="rounded-2xl border border-navy-100 bg-white p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-navy-500">
            <ShieldCheck className="size-4" aria-hidden="true" /> Segurança
          </div>
          <ButtonLink href="/nova-senha" variant="outline" size="sm" className="mt-3">
            <KeyRound className="size-4" aria-hidden="true" />
            Alterar senha
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
