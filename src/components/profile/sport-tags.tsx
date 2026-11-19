import { sportLabel } from "@/lib/constants/profile";
import { cn } from "@/lib/utils";

type Props = {
  sports: string[];
  tone?: "light" | "dark";
  className?: string;
};

/** Lista de modalidades em formato de etiquetas. */
export function SportTags({ sports, tone = "light", className }: Props) {
  if (sports.length === 0) return null;
  return (
    <ul className={cn("flex flex-wrap gap-2", className)} aria-label="Modalidades">
      {sports.map((sport) => (
        <li
          key={sport}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider",
            tone === "light" ? "bg-navy-50 text-navy-800" : "bg-white/10 text-white",
          )}
        >
          {sportLabel(sport)}
        </li>
      ))}
    </ul>
  );
}
