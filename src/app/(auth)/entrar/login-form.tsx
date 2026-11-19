"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signInAction, type FormState } from "@/lib/actions/auth";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { SubmitButton } from "@/components/ui/submit-button";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction] = useActionState<FormState, FormData>(signInAction, {});

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <input type="hidden" name="next" value={next} />

      {state.error ? (
        <Alert tone="error">
          {state.error}
          {state.needsConfirmation ? (
            <>
              {" "}
              <Link
                href={`/cadastro/verifique-email?email=${encodeURIComponent(state.values?.email ?? "")}`}
                className="font-semibold underline"
              >
                Reenviar e-mail de confirmação
              </Link>
            </>
          ) : null}
        </Alert>
      ) : null}

      <Input
        label="E-mail"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="voce@email.com"
        defaultValue={state.values?.email}
        error={state.fieldErrors?.email}
        required
      />

      <div>
        <PasswordInput
          label="Senha"
          name="password"
          autoComplete="current-password"
          placeholder="Sua senha"
          error={state.fieldErrors?.password}
          required
        />
        <div className="mt-2 text-right">
          <Link href="/recuperar-senha" className="text-sm font-medium text-navy-500 hover:text-navy-900 hover:underline">
            Esqueci minha senha
          </Link>
        </div>
      </div>

      <SubmitButton className="w-full" size="lg" pendingLabel="Entrando…">
        Entrar
      </SubmitButton>
    </form>
  );
}
