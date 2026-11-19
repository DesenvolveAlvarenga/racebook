import type { Metadata } from "next";
import Link from "next/link";
import { AuthHeading } from "@/components/auth/auth-heading";
import { Alert } from "@/components/ui/alert";
import { safeNextPath } from "@/lib/redirect";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };

type Props = { searchParams: Promise<{ next?: string; saiu?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const next = safeNextPath(params.next);

  return (
    <>
      <AuthHeading title="Entrar" description="Acesse seu painel para atualizar sua trajetória." />

      {params.saiu ? (
        <Alert tone="success" className="mb-6">
          Você saiu da sua conta.
        </Alert>
      ) : null}

      <LoginForm next={next} />

      <p className="mt-8 text-center text-[15px] text-navy-500">
        Ainda não tem perfil?{" "}
        <Link href="/cadastro" className="font-semibold text-accent-600 hover:text-accent-700 hover:underline">
          Criar meu perfil
        </Link>
      </p>
    </>
  );
}
