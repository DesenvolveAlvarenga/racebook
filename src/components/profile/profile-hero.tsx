import { CalendarDays, MapPin } from "lucide-react";
import type { ReactNode } from "react";
import { AthleteAvatar } from "@/components/profile/athlete-avatar";
import { SportTags } from "@/components/profile/sport-tags";
import type { PublicProfile } from "@/types/database";

type Props = {
  profile: PublicProfile;
  avatarUrl: string | null;
  coverUrl: string | null;
  /** Botões exibidos ao lado do nome (ex.: compartilhar). */
  actions?: ReactNode;
};

const memberSince = (iso: string) =>
  new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "America/Sao_Paulo" }).format(
    new Date(iso),
  );

/** Cabeçalho do perfil: capa, foto, nome, local e modalidades. */
export function ProfileHero({ profile, avatarUrl, coverUrl, actions }: Props) {
  const location = [profile.city, profile.state].filter(Boolean).join(" · ");

  return (
    <section>
      <div className="relative h-44 overflow-hidden bg-navy-950 sm:h-64 lg:h-80">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt={`Capa do perfil de ${profile.display_name}`} className="size-full object-cover" />
        ) : (
          <>
            <div className="bg-speed-stripes absolute inset-0" aria-hidden="true" />
            <div className="absolute -right-24 -bottom-32 size-96 rounded-full bg-accent-500/25 blur-3xl" aria-hidden="true" />
          </>
        )}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-navy-950/50 to-transparent" aria-hidden="true" />
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="-mt-16 flex flex-col gap-4 sm:-mt-20 sm:flex-row sm:items-end sm:gap-6">
          <AthleteAvatar name={profile.display_name} src={avatarUrl} size="xl" className="ring-4 ring-white shadow-lg" />
          <div className="min-w-0 flex-1 sm:pb-2">
            <h1 className="font-display text-4xl font-extrabold uppercase italic leading-[0.95] text-navy-950 sm:text-5xl lg:text-6xl">
              {profile.display_name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-navy-500">
              {location ? (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-4 text-accent-500" aria-hidden="true" />
                  {location}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-4 text-accent-500" aria-hidden="true" />
                No Racebook desde {memberSince(profile.created_at)}
              </span>
            </div>
          </div>
          {actions ? <div className="flex flex-wrap gap-2 sm:pb-3">{actions}</div> : null}
        </div>
        <SportTags sports={profile.sports} className="mt-5" />
      </div>
    </section>
  );
}
