import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AuthHeading } from "@/components/auth/auth-heading";
import { Alert } from "@/components/ui/alert";
import { ResetRequestForm } from "./reset-request-form";

export const metadata: Metadata = { title: "Recuperar senha" };

type Props = { searchParams: Promise<{ erro?: string }> };

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { erro } = await searchParams;

  return (
    <>
      <Link
        href="/entrar"
        className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-navy-500 hover:text-navy-900"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Voltar para o login
      </Link>

      <AuthHeading
        title="Recuperar senha"
        description="Informe o e-mail da sua conta. Enviaremos um link para você criar uma nova senha."
      />

      {erro === "link" ? (
        <Alert tone="error" className="mb-6">
          O link de recuperação é inválido ou expirou. Solicite um novo abaixo.
        </Alert>
      ) : null}

      <ResetRequestForm />
    </>
  );
}
