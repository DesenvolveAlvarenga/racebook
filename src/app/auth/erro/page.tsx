import type { Metadata } from "next";
import { Link2 } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Link inválido" };

type Props = { searchParams: Promise<{ motivo?: string }> };

export default async function AuthErrorPage({ searchParams }: Props) {
  const { motivo } = await searchParams;
  const expired = motivo === "otp_expired";

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-navy-50/50 px-5 py-12">
      <div className="mb-10">
        <Logo />
      </div>
      <div className="w-full max-w-md rounded-3xl border border-navy-100 bg-white p-8 text-center shadow-sm animate-fade-up">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-accent-50 text-accent-600">
          <Link2 className="size-7" aria-hidden="true" />
        </div>
        <h1 className="mt-6 font-display text-3xl font-extrabold uppercase italic text-navy-950">
          {expired ? "Link expirado" : "Link inválido"}
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-navy-500">
          {expired
            ? "Este link já passou da validade. Por segurança, os links enviados por e-mail valem por tempo limitado."
            : "Este link não é válido ou já foi utilizado. Se você já confirmou sua conta, basta entrar."}
        </p>
        <div className="mt-8 grid gap-3">
          <ButtonLink href="/entrar" size="lg">
            Entrar
          </ButtonLink>
          <ButtonLink href="/recuperar-senha" variant="outline">
            Recuperar senha
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
