import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type SwitchProps = Omit<ComponentProps<"input">, "type"> & {
  name: string;
  label: ReactNode;
  description?: ReactNode;
};

/** Interruptor liga/desliga baseado em checkbox nativo (funciona sem JavaScript). */
export function Switch({ name, id, label, description, className, ...props }: SwitchProps) {
  const fieldId = id ?? name;
  return (
    <label
      htmlFor={fieldId}
      className={cn(
        "flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-navy-100 bg-white p-4 transition-colors",
        "hover:border-navy-200 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent-500",
        className,
      )}
    >
      <span className="min-w-0">
        <span className="block font-semibold text-navy-950">{label}</span>
        {description ? <span className="mt-1 block text-sm text-navy-500">{description}</span> : null}
      </span>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input id={fieldId} name={name} type="checkbox" role="switch" className="peer sr-only" {...props} />
        <span
          aria-hidden="true"
          className="h-7 w-12 rounded-full bg-navy-200 transition-colors peer-checked:bg-accent-500"
        />
        <span
          aria-hidden="true"
          className="absolute top-1 left-1 size-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5"
        />
      </span>
    </label>
  );
}
