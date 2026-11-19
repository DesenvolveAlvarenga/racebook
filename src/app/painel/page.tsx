import { AtSign, KeyRound, Link2, ShieldCheck } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { getSiteUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

type Props = { searchParams: Promise<{ senha?: string }> };

export default async function DashboardPage({ searchParams }: Props) {
  const [{ senha }, user] = await Promise.all([searchParams, requireUser("/painel")]);

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, slug, is_public")
    .eq("id", user.id)
    .maybeSingle<Pick<Profile, "display_name" | "slug" | "is_public">>();

  const firstName = profile?.display_name.split(/\s+/)[0] ?? "atleta";
  const profileUrl = profile ? `${getSiteUrl().replace(/^https?:\/\//, "")}/atleta/${profile.slug}` : null;

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
            Sua conta está ativa. Aqui você vai montar seu portfólio esportivo: provas, resultados, equipamentos,
            treinos e fotos.
          </p>
        </div>
      </section>

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
          <p className="mt-1 text-xs text-navy-400">
            {profile?.is_public ? "Perfil público" : "Perfil privado: só você pode ver."}
          </p>
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
