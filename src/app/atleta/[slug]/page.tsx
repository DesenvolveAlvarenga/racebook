import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Lock, PenLine } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";
import { OwnerBar } from "@/components/profile/owner-bar";
import { ProfileHero } from "@/components/profile/profile-hero";
import { ProfileStatsGrid } from "@/components/profile/profile-stats";
import { ProfileUnavailable } from "@/components/profile/profile-unavailable";
import { ShareProfileButton } from "@/components/profile/share-profile-button";
import { getSessionUser } from "@/lib/auth";
import { getSiteUrl } from "@/lib/env";
import { getAthletePage, getOwnSlug } from "@/lib/profile";
import { sportLabel } from "@/lib/constants/profile";
import { SLUG_MAX, SLUG_MIN, SLUG_PATTERN } from "@/lib/constants/profile";

/** Só o formato (palavras reservadas bloqueiam a edição, não a visualização). */
const isValidSlugPath = (slug: string) =>
  slug.length >= SLUG_MIN && slug.length <= SLUG_MAX && SLUG_PATTERN.test(slug);

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ visitante?: string }>;
};

/** Metadados SEMPRE a partir da visão pública: nada privado vai para buscadores/redes sociais. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const normalized = slug.toLowerCase();
  const data = isValidSlugPath(normalized) ? await getAthletePage(normalized, false) : null;

  if (!data) {
    return { title: "Perfil indisponível", robots: { index: false, follow: false } };
  }

  const { profile } = data;
  const location = [profile.city, profile.state].filter(Boolean).join(", ");
  const sports = profile.sports.map(sportLabel).join(", ");
  const description =
    profile.bio?.slice(0, 160) ||
    [sports && `Atleta de ${sports}`, location].filter(Boolean).join(" · ") ||
    `Portfólio esportivo de ${profile.display_name} no Racebook.`;

  return {
    title: profile.display_name,
    description,
    alternates: { canonical: `/atleta/${profile.slug}` },
    openGraph: {
      type: "profile",
      title: `${profile.display_name} · Racebook`,
      description,
      url: `/atleta/${profile.slug}`,
    },
    twitter: { card: "summary", title: `${profile.display_name} · Racebook`, description },
  };
}

export default async function AthletePage({ params, searchParams }: Props) {
  const [{ slug: rawSlug }, { visitante }] = await Promise.all([params, searchParams]);
  const slug = rawSlug.toLowerCase();

  if (!isValidSlugPath(slug)) notFound();
  if (slug !== rawSlug) permanentRedirect(`/atleta/${slug}`);

  const user = await getSessionUser();
  const isOwner = Boolean(user && (await getOwnSlug(user.id)) === slug);
  const visitorMode = isOwner && visitante === "1";

  // Dono: sessão dele (vê tudo). Qualquer outra pessoa — ou o dono no modo
  // visitante — usa o papel anônimo, então a RLS decide o que aparece.
  const data = await getAthletePage(slug, isOwner && !visitorMode);

  if (!data) {
    if (!visitorMode) notFound();
    // O dono pediu para ver como visitante, mas o perfil está privado.
    return (
      <div className="min-h-dvh bg-navy-50/40">
        <OwnerBar slug={slug} isPublic={false} visitorMode />
        <PublicHeader loggedIn={false} />
        <ProfileUnavailable />
        <div className="mx-auto -mt-10 max-w-md px-5 pb-16">
          <div className="rounded-2xl border border-accent-200 bg-accent-50 p-5 text-sm text-navy-800">
            <p className="flex items-center gap-2 font-semibold text-navy-950">
              <Lock className="size-4 text-accent-600" aria-hidden="true" /> Seu perfil está privado
            </p>
            <p className="mt-1">
              Visitantes veem a mensagem acima. Para que todos vejam seu perfil, ative a opção “Perfil público”.
            </p>
            <ButtonLink href="/painel/perfil" size="sm" className="mt-4">
              Alterar privacidade
            </ButtonLink>
          </div>
        </div>
      </div>
    );
  }

  const { profile, stats, avatarUrl, coverUrl } = data;
  const shareUrl = `${getSiteUrl()}/atleta/${profile.slug}`;
  const showOwnerTools = isOwner && !visitorMode;
  // No modo visitante, topo e rodapé são os de uma pessoa não logada.
  const showLoggedInChrome = Boolean(user) && !visitorMode;

  return (
    <div className="min-h-dvh bg-navy-50/40">
      {isOwner ? <OwnerBar slug={profile.slug} isPublic={profile.is_public} visitorMode={visitorMode} /> : null}
      <PublicHeader loggedIn={showLoggedInChrome} />

      <main className="pb-16">
        <ProfileHero
          profile={profile}
          avatarUrl={avatarUrl}
          coverUrl={coverUrl}
          actions={profile.is_public ? <ShareProfileButton url={shareUrl} title={profile.display_name} /> : null}
        />

        <div className="mx-auto mt-8 max-w-5xl space-y-6 px-4 sm:px-6">
          <ProfileStatsGrid stats={stats} />

          {profile.bio ? (
            <section className="rounded-2xl border border-navy-100 bg-white p-5 sm:p-7">
              <h2 className="font-display text-2xl font-extrabold uppercase italic leading-none text-navy-950">Sobre</h2>
              <p className="mt-4 whitespace-pre-line leading-relaxed text-navy-700">{profile.bio}</p>
            </section>
          ) : showOwnerTools ? (
            <section className="rounded-2xl border border-dashed border-navy-200 bg-white p-5 text-center sm:p-7">
              <p className="text-navy-500">Você ainda não escreveu sua biografia. Visitantes não veem esta seção.</p>
              <ButtonLink href="/painel/perfil" variant="outline" size="sm" className="mt-4">
                <PenLine className="size-4" aria-hidden="true" />
                Escrever biografia
              </ButtonLink>
            </section>
          ) : null}
        </div>
      </main>

      <footer className="border-t border-navy-100 bg-white py-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-4 text-sm text-navy-400 sm:flex-row sm:px-6">
          <span>Portfólio esportivo criado no Racebook</span>
          {!showLoggedInChrome ? (
            <Link href="/cadastro" className="font-semibold text-accent-600 hover:text-accent-700 hover:underline">
              Crie o seu gratuitamente
            </Link>
          ) : null}
        </div>
      </footer>
    </div>
  );
}

function PublicHeader({ loggedIn }: { loggedIn: boolean }) {
  return (
    <header className="border-b border-navy-100 bg-white">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Logo />
        {loggedIn ? (
          <ButtonLink href="/painel" variant="ghost" size="sm">
            Meu painel
          </ButtonLink>
        ) : (
          <ButtonLink href="/cadastro" size="sm">
            Criar meu perfil
          </ButtonLink>
        )}
      </div>
    </header>
  );
}
