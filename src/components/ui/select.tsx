import { ChevronDown } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { Field, inputClasses } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SelectProps = ComponentProps<"select"> & {
  label: string;
  name: string;
  error?: string[] | string;
  hint?: ReactNode;
  options: ReadonlyArray<{ value: string; label: string }>;
  placeholder?: string;
};

export function Select({ label, name, error, hint, options, placeholder, className, id, ...props }: SelectProps) {
  const fieldId = id ?? name;
  const hasError = Boolean(Array.isArray(error) ? error.length : error);
  return (
    <Field label={label} name={fieldId} error={error} hint={hint}>
      <div className="relative">
        <select
          id={fieldId}
          name={name}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
          className={cn(
            inputClasses,
            "appearance-none pr-10",
            hasError ? "border-red-400 focus:border-red-500 focus:ring-red-500/10" : "border-navy-100",
            className,
          )}
          {...props}
        >
          {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-navy-400"
          aria-hidden="true"
        />
      </div>
    </Field>
  );
}
