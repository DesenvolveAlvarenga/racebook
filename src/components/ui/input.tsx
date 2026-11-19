import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export const inputClasses =
  "block w-full h-12 rounded-xl border bg-white px-4 text-navy-950 placeholder:text-navy-300 " +
  "transition-colors outline-none focus:border-navy-900 focus:ring-4 focus:ring-navy-900/8 " +
  "disabled:bg-navy-50 disabled:text-navy-400";

type FieldProps = {
  label: string;
  name: string;
  error?: string[] | string;
  hint?: ReactNode;
  children?: ReactNode;
};

/** Rótulo + mensagem de erro/dica, padronizados para qualquer campo. */
export function Field({ label, name, error, hint, children }: FieldProps) {
  const message = Array.isArray(error) ? error[0] : error;
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="block text-sm font-semibold text-navy-900">
        {label}
      </label>
      {children}
      {message ? (
        <p id={`${name}-error`} role="alert" className="text-sm font-medium text-red-600">
          {message}
        </p>
      ) : hint ? (
        <p id={`${name}-hint`} className="text-sm text-navy-400">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type InputProps = ComponentProps<"input"> & {
  label: string;
  name: string;
  error?: string[] | string;
  hint?: ReactNode;
};

export function Input({ label, name, error, hint, className, id, ...props }: InputProps) {
  const hasError = Boolean(Array.isArray(error) ? error.length : error);
  return (
    <Field label={label} name={id ?? name} error={error} hint={hint}>
      <input
        id={id ?? name}
        name={name}
        aria-invalid={hasError || undefined}
        aria-describedby={hasError ? `${id ?? name}-error` : hint ? `${id ?? name}-hint` : undefined}
        className={cn(
          inputClasses,
          hasError ? "border-red-400 focus:border-red-500 focus:ring-red-500/10" : "border-navy-100",
          className,
        )}
        {...props}
      />
    </Field>
  );
}
