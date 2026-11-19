"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { getSiteUrl } from "@/lib/env";
import { safeNextPath } from "@/lib/redirect";
import { authErrorMessage } from "@/lib/auth-errors";
import {
  emailOnlySchema,
  signInSchema,
  signUpSchema,
  updatePasswordSchema,
} from "@/lib/validations/auth";

export type FormState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: Record<string, string>;
  /** Sinaliza que o login falhou porque o e-mail ainda não foi confirmado. */
  needsConfirmation?: boolean;
};

const text = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
};

const fieldErrors = (error: z.ZodError) =>
  z.flattenError(error).fieldErrors as Record<string, string[] | undefined>;

// -----------------------------------------------------------------------------
// Cadastro
// -----------------------------------------------------------------------------
export async function signUpAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = {
    fullName: text(formData, "fullName"),
    email: text(formData, "email"),
    password: text(formData, "password"),
  };
  const values = { fullName: raw.fullName, email: raw.email };

  const parsed = signUpSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      // O gatilho handle_new_user usa este nome para criar o perfil.
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${getSiteUrl()}/auth/callback?next=/painel`,
    },
  });

  if (error) return { error: authErrorMessage(error), values };

  // Confirmação de e-mail desativada no Supabase: a sessão já vem pronta.
  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/painel");
  }

  redirect(`/cadastro/verifique-email?email=${encodeURIComponent(parsed.data.email)}`);
}

// -----------------------------------------------------------------------------
// Login
// -----------------------------------------------------------------------------
export async function signInAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = { email: text(formData, "email"), password: text(formData, "password") };
  const values = { email: raw.email };
  const next = safeNextPath(text(formData, "next"));

  const parsed = signInSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return {
      error: authErrorMessage(error),
      values,
      needsConfirmation: error.code === "email_not_confirmed",
    };
  }

  revalidatePath("/", "layout");
  redirect(next);
}

// -----------------------------------------------------------------------------
// Logout
// -----------------------------------------------------------------------------
export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/entrar?saiu=1");
}

// -----------------------------------------------------------------------------
// Reenviar e-mail de confirmação
// -----------------------------------------------------------------------------
export async function resendConfirmationAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = emailOnlySchema.safeParse({ email: text(formData, "email") });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data.email,
    options: { emailRedirectTo: `${getSiteUrl()}/auth/callback?next=/painel` },
  });

  if (error) return { error: authErrorMessage(error) };
  return { success: "Enviamos um novo link de confirmação. Confira também a caixa de spam." };
}

// -----------------------------------------------------------------------------
// Recuperação de senha (envia o link por e-mail)
// -----------------------------------------------------------------------------
export async function requestPasswordResetAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const raw = { email: text(formData, "email") };
  const parsed = emailOnlySchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values: raw };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${getSiteUrl()}/auth/callback?next=/nova-senha`,
  });

  // Só mostramos erro de limite de envio. Para qualquer outro caso a resposta é a
  // mesma, para não revelar quais e-mails têm conta.
  if (error && (error.status === 429 || error.code?.startsWith("over_"))) {
    return { error: authErrorMessage(error), values: raw };
  }

  return {
    success:
      "Se existir uma conta com este e-mail, você receberá um link para criar uma nova senha em alguns minutos.",
  };
}

// -----------------------------------------------------------------------------
// Definir nova senha (usuário logado ou vindo do link de recuperação)
// -----------------------------------------------------------------------------
export async function updatePasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getSessionUser();
  if (!user) redirect("/recuperar-senha?erro=link");

  const parsed = updatePasswordSchema.safeParse({
    password: text(formData, "password"),
    confirmPassword: text(formData, "confirmPassword"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: authErrorMessage(error) };

  revalidatePath("/", "layout");
  redirect("/painel?senha=atualizada");
}
