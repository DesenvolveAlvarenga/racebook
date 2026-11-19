"use client";

import { useActionState } from "react";
import { signUpAction, type FormState } from "@/lib/actions/auth";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { SubmitButton } from "@/components/ui/submit-button";

export function SignUpForm() {
  const [state, formAction] = useActionState<FormState, FormData>(signUpAction, {});

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}

      <Input
        label="Nome completo ou nome esportivo"
        name="fullName"
        autoComplete="name"
        autoCapitalize="words"
        placeholder="Ex.: Ana Ferreira"
        defaultValue={state.values?.fullName}
        error={state.fieldErrors?.fullName}
        hint="É o nome que aparecerá no seu perfil. Você pode alterar depois."
        maxLength={80}
        required
      />

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

      <PasswordInput
        label="Senha"
        name="password"
        autoComplete="new-password"
        placeholder="Crie uma senha"
        error={state.fieldErrors?.password}
        hint="Mínimo de 8 caracteres, com letras e números."
        maxLength={72}
        required
      />

      <SubmitButton className="w-full" size="lg" pendingLabel="Criando conta…">
        Criar meu perfil
      </SubmitButton>
    </form>
  );
}
