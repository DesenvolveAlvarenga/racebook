import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { KeyRound } from "lucide-react";
import { AuthHeading } from "@/components/auth/auth-heading";
import { getSessionUser } from "@/lib/auth";
import { NewPasswordForm } from "./new-password-form";

export const metadata: Metadata = { title: "Nova senha" };

export default async function NewPasswordPage() {
  // Chega aqui pelo link de recuperação (que já cria a sessão) ou pelo painel.
  const user = await getSessionUser();
  if (!user) redirect("/recuperar-senha?erro=link");

  return (
    <>
      <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-accent-50 text-accent-600">
        <KeyRound className="size-7" aria-hidden="true" />
      </div>
      <AuthHeading
        title="Nova senha"
        description={
          <>
            Defina a nova senha da conta{" "}
            {user.email ? <strong className="font-semibold text-navy-900">{user.email}</strong> : null}.
          </>
        }
      />
      <NewPasswordForm />
    </>
  );
}
