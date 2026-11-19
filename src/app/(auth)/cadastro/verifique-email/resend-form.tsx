"use client";

import { useActionState } from "react";
import { resendConfirmationAction, type FormState } from "@/lib/actions/auth";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export function ResendForm({ email }: { email: string }) {
  const [state, formAction] = useActionState<FormState, FormData>(resendConfirmationAction, {});

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}

      <Input
        label="E-mail"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        defaultValue={email}
        error={state.fieldErrors?.email}
        required
      />
      <SubmitButton variant="secondary" className="w-full" pendingLabel="Enviando…">
        Reenviar link de confirmação
      </SubmitButton>
    </form>
  );
}
