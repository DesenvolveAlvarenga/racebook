import { Check } from "lucide-react";
import { SPORTS } from "@/lib/constants/profile";
import { cn } from "@/lib/utils";

type Props = {
  name?: string;
  defaultValue?: string[];
  error?: string[] | string;
};

/** Seleção múltipla de modalidades com checkboxes nativos (enviados como "sports"). */
export function SportPicker({ name = "sports", defaultValue = [], error }: Props) {
  const message = Array.isArray(error) ? error[0] : error;
  const selected = new Set(defaultValue);

  return (
    <fieldset aria-describedby={message ? `${name}-error` : `${name}-hint`}>
      <legend className="text-sm font-semibold text-navy-900">Modalidades que você pratica</legend>
      <p id={`${name}-hint`} className="mt-1 text-sm text-navy-400">
        Selecione quantas quiser. Elas aparecem em destaque no seu perfil.
      </p>
      <div className="mt-3 grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 lg:grid-cols-3">
        {SPORTS.map((sport) => (
          <label
            key={sport.value}
            className={cn(
              "group flex cursor-pointer items-center gap-3 rounded-xl border border-navy-100 bg-white px-3.5 py-3 text-sm font-semibold text-navy-800 transition-colors",
              "hover:border-navy-200 has-[:checked]:border-accent-500 has-[:checked]:bg-accent-50 has-[:checked]:text-navy-950",
              "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent-500",
            )}
          >
            <input
              type="checkbox"
              name={name}
              value={sport.value}
              defaultChecked={selected.has(sport.value)}
              className="peer sr-only"
            />
            <span
              aria-hidden="true"
              className="flex size-5 shrink-0 items-center justify-center rounded-md border border-navy-200 bg-white text-transparent transition-colors peer-checked:border-accent-500 peer-checked:bg-accent-500 peer-checked:text-white"
            >
              <Check className="size-3.5" strokeWidth={3} />
            </span>
            {sport.label}
          </label>
        ))}
      </div>
      {message ? (
        <p id={`${name}-error`} role="alert" className="mt-2 text-sm font-medium text-red-600">
          {message}
        </p>
      ) : null}
    </fieldset>
  );
}
