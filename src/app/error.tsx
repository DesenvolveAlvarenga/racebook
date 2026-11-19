"use client";

import { useEffect } from "react";
import { Logo } from "@/components/brand/logo";
import { Button, ButtonLink } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-5 py-12 text-center">
      <Logo />
      <h1 className="mt-12 font-display text-4xl font-extrabold uppercase italic text-navy-950">Algo deu errado</h1>
      <p className="mt-3 max-w-sm text-navy-500">
        Tivemos um problema ao carregar esta página. Tente novamente em instantes.
      </p>
      {error.digest ? <p className="mt-2 text-xs text-navy-300">Código: {error.digest}</p> : null}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button onClick={reset}>Tentar novamente</Button>
        <ButtonLink href="/" variant="outline">
          Voltar ao início
        </ButtonLink>
      </div>
    </main>
  );
}
