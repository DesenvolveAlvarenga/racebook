"use client";

import { useActionState } from "react";
import { updatePasswordAction, type FormState } from "@/lib/actions/auth";
import { Alert } from "@/components/ui/alert";
import { PasswordInput } from "@/components/ui/password-input";
import { SubmitButton } from "@/components/ui/submit-button";

export function NewPasswordForm() {
  const [state, formAction] = useActionState<FormState, FormData>(updatePasswordAction, {});

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}

      <PasswordInput
        label="Nova senha"
        name="password"
        autoComplete="new-password"
        error={state.fieldErrors?.password}
        hint="Mínimo de 8 caracteres, com letras e números."
        maxLength={72}
        required
      />
      <PasswordInput
        label="Confirmar nova senha"
        name="confirmPassword"
        autoComplete="new-password"
        error={state.fieldErrors?.confirmPassword}
        maxLength={72}
        required
      />

      <SubmitButton className="w-full" size="lg" pendingLabel="Salvando…">
        Salvar nova senha
      </SubmitButton>
    </form>
  );
}
