"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState, type ComponentProps, type ReactNode } from "react";
import { Field, inputClasses } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PasswordInputProps = Omit<ComponentProps<"input">, "type"> & {
  label: string;
  name: string;
  error?: string[] | string;
  hint?: ReactNode;
};

/** Campo de senha com botão para mostrar/ocultar (útil no celular). */
export function PasswordInput({ label, name, error, hint, className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const hasError = Boolean(Array.isArray(error) ? error.length : error);

  return (
    <Field label={label} name={name} error={error} hint={hint}>
      <div className="relative">
        <input
          id={name}
          name={name}
          type={visible ? "text" : "password"}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? `${name}-error` : hint ? `${name}-hint` : undefined}
          className={cn(
            inputClasses,
            "pr-12",
            hasError ? "border-red-400 focus:border-red-500 focus:ring-red-500/10" : "border-navy-100",
            className,
          )}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-navy-400 hover:text-navy-900 focus-visible:outline-2 focus-visible:outline-accent-500"
        >
          {visible ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
        </button>
      </div>
    </Field>
  );
}
