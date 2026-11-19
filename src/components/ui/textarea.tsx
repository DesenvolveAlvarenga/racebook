"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import { Field } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type TextareaProps = ComponentProps<"textarea"> & {
  label: string;
  name: string;
  error?: string[] | string;
  hint?: ReactNode;
  /** Mostra o contador "x / max" quando maxLength é informado. */
  showCount?: boolean;
};

export function Textarea({
  label,
  name,
  error,
  hint,
  className,
  id,
  maxLength,
  showCount = true,
  defaultValue,
  onChange,
  ...props
}: TextareaProps) {
  const fieldId = id ?? name;
  const hasError = Boolean(Array.isArray(error) ? error.length : error);
  const [length, setLength] = useState(String(defaultValue ?? "").length);

  return (
    <Field label={label} name={fieldId} error={error} hint={hint}>
      <div className="relative">
        <textarea
          id={fieldId}
          name={name}
          maxLength={maxLength}
          defaultValue={defaultValue}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
          onChange={(event) => {
            setLength(event.target.value.length);
            onChange?.(event);
          }}
          className={cn(
            "block min-h-32 w-full resize-y rounded-xl border bg-white px-4 py-3 leading-relaxed text-navy-950",
            "placeholder:text-navy-300 outline-none transition-colors focus:border-navy-900 focus:ring-4 focus:ring-navy-900/8",
            hasError ? "border-red-400 focus:border-red-500 focus:ring-red-500/10" : "border-navy-100",
            showCount && maxLength ? "pb-7" : "",
            className,
          )}
          {...props}
        />
        {showCount && maxLength ? (
          <span
            className={cn(
              "pointer-events-none absolute right-3 bottom-2 text-xs tabular-nums",
              length > maxLength * 0.9 ? "text-accent-600" : "text-navy-300",
            )}
            aria-hidden="true"
          >
            {length}/{maxLength}
          </span>
        ) : null}
      </div>
    </Field>
  );
}
