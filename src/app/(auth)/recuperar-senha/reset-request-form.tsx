"use client";

import { useActionState } from "react";
import { requestPasswordResetAction, type FormState } from "@/lib/actions/auth";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export function ResetRequestForm() {
  const [state, formAction] = useActionState<FormState, FormData>(requestPasswordResetAction, {});

  if (state.success) {
    return <Alert tone="success">{state.success}</Alert>;
  }

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}

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

      <SubmitButton className="w-full" size="lg" pendingLabel="Enviando…">
        Enviar link de recuperação
      </SubmitButton>
    </form>
  );
}
