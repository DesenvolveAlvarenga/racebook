import { Flag, Medal, Trophy, Activity } from "lucide-react";
import type { ProfileStats } from "@/types/database";

/** Indicadores calculados pelo banco (view profile_stats, respeitando a RLS). */
export function ProfileStatsGrid({ stats }: { stats: ProfileStats | null }) {
  const items = [
    { label: "Provas", value: stats?.competitions_count ?? 0, icon: Flag },
    { label: "Pódios", value: stats?.podiums_count ?? 0, icon: Medal },
    { label: "Vitórias", value: stats?.wins_count ?? 0, icon: Trophy },
    { label: "Modalidades", value: stats?.sports_count ?? 0, icon: Activity },
  ];

  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map(({ label, value, icon: Icon }) => (
        <div key={label} className="rounded-2xl border border-navy-100 bg-white p-4 sm:p-5">
          <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-navy-400">
            <Icon className="size-4 text-accent-500" aria-hidden="true" />
            {label}
          </dt>
          <dd className="mt-2 font-display text-4xl font-extrabold italic leading-none tabular-nums text-navy-950">
            {Number(value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}
