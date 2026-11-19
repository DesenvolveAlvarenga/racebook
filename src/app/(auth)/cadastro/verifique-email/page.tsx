import type { Metadata } from "next";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { AuthHeading } from "@/components/auth/auth-heading";
import { ResendForm } from "./resend-form";

export const metadata: Metadata = { title: "Confirme seu e-mail" };

type Props = { searchParams: Promise<{ email?: string }> };

export default async function VerifyEmailPage({ searchParams }: Props) {
  const { email = "" } = await searchParams;

  return (
    <>
      <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-accent-50 text-accent-600">
        <MailCheck className="size-7" aria-hidden="true" />
      </div>

      <AuthHeading
        title="Confirme seu e-mail"
        description={
          <>
            Enviamos um link de confirmação para{" "}
            {email ? <strong className="font-semibold text-navy-900">{email}</strong> : "o seu e-mail"}. Abra a
            mensagem e toque em <strong className="font-semibold text-navy-900">Confirmar e-mail</strong> para
            ativar sua conta.
          </>
        }
      />

      <div className="rounded-2xl border border-navy-100 bg-navy-50/60 p-5">
        <p className="text-sm font-semibold text-navy-900">Não recebeu?</p>
        <p className="mt-1 text-sm text-navy-500">
          Confira a caixa de spam ou promoções. Se precisar, envie o link novamente:
        </p>
        <div className="mt-4">
          <ResendForm email={email} />
        </div>
      </div>

      <p className="mt-8 text-center text-[15px] text-navy-500">
        Já confirmou?{" "}
        <Link href="/entrar" className="font-semibold text-accent-600 hover:text-accent-700 hover:underline">
          Entrar
        </Link>
      </p>
    </>
  );
}
