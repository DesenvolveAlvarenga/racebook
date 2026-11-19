"use client";

import { CircleCheck, CircleAlert, LoaderCircle, Wand2 } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { checkSlugAction, type SlugCheckResult } from "@/lib/actions/profile";
import { Field, inputClasses } from "@/components/ui/input";
import { SLUG_MAX } from "@/lib/constants/profile";
import { slugify } from "@/lib/slug";
import { cn } from "@/lib/utils";

type Props = {
  name?: string;
  /** Slug salvo atualmente (não precisa ser checado). */
  currentSlug: string;
  defaultValue: string;
  /** Domínio exibido antes do slug, ex.: "racebook.com.br". */
  host: string;
  error?: string[] | string;
  /** Retorna o texto usado para sugerir um slug (normalmente o nome). */
  getSuggestionSource?: () => string;
};

export function SlugField({ name = "slug", currentSlug, defaultValue, host, error, getSuggestionSource }: Props) {
  const [value, setValue] = useState(defaultValue);
  const [result, setResult] = useState<SlugCheckResult | null>(null);
  const [pending, startTransition] = useTransition();
  const requestId = useRef(0);

  // Checa a disponibilidade 400 ms depois que o atleta para de digitar.
  useEffect(() => {
    if (value === currentSlug) {
      setResult(null);
      return;
    }
    const id = ++requestId.current;
    const timer = setTimeout(() => {
      startTransition(async () => {
        const response = await checkSlugAction(value);
        if (id === requestId.current) setResult(response);
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [value, currentSlug]);

  const serverError = Array.isArray(error) ? error[0] : error;
  const showServerError = serverError && value === defaultValue;
  const status: "idle" | "checking" | "ok" | "bad" =
    value === currentSlug ? "idle" : pending || !result ? "checking" : result.available ? "ok" : "bad";

  return (
    <Field
      label="Endereço do seu perfil"
      name={name}
      error={showServerError ? serverError : undefined}
      hint={
        status === "idle"
          ? "Este é o seu endereço atual. Se você mudar, o link antigo deixa de funcionar."
          : status === "checking"
            ? "Verificando…"
            : (
              <span className={status === "ok" ? "font-medium text-emerald-700" : "font-medium text-red-600"}>
                {result?.message}
              </span>
            )
      }
    >
      <div
        className={cn(
          "flex items-stretch overflow-hidden rounded-xl border bg-white transition-colors focus-within:ring-4",
          status === "bad" || showServerError
            ? "border-red-400 focus-within:ring-red-500/10"
            : status === "ok"
              ? "border-emerald-400 focus-within:ring-emerald-500/10"
              : "border-navy-100 focus-within:border-navy-900 focus-within:ring-navy-900/8",
        )}
      >
        <span className="hidden max-w-[45%] items-center truncate border-r border-navy-100 bg-navy-50 px-3 text-sm text-navy-500 sm:flex">
          {host}/atleta/
        </span>
        <input
          id={name}
          name={name}
          value={value}
          onChange={(event) => setValue(event.target.value.toLowerCase().replace(/\s+/g, "-"))}
          maxLength={SLUG_MAX}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-invalid={status === "bad" || Boolean(showServerError) || undefined}
          aria-describedby={showServerError ? `${name}-error` : `${name}-hint`}
          className={cn(inputClasses, "min-w-0 flex-1 rounded-none border-0 focus:ring-0")}
          required
        />
        <span className="flex w-10 items-center justify-center" aria-hidden="true">
          {status === "checking" ? (
            <LoaderCircle className="size-4 animate-spin text-navy-400" />
          ) : status === "ok" ? (
            <CircleCheck className="size-4 text-emerald-600" />
          ) : status === "bad" ? (
            <CircleAlert className="size-4 text-red-500" />
          ) : null}
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="truncate text-xs text-navy-400 sm:hidden">
          {host}/atleta/{value || "…"}
        </p>
        {getSuggestionSource ? (
          <button
            type="button"
            onClick={() => {
              const suggestion = slugify(getSuggestionSource());
              if (suggestion) setValue(suggestion);
            }}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg text-xs font-semibold text-accent-600 hover:text-accent-700 focus-visible:outline-2 focus-visible:outline-accent-500"
          >
            <Wand2 className="size-3.5" aria-hidden="true" />
            Gerar a partir do nome
          </button>
        ) : null}
      </div>
    </Field>
  );
}
