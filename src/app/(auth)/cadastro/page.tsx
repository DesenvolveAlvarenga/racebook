import type { Metadata } from "next";
import Link from "next/link";
import { AuthHeading } from "@/components/auth/auth-heading";
import { SignUpForm } from "./signup-form";

export const metadata: Metadata = { title: "Criar meu perfil" };

export default function SignUpPage() {
  return (
    <>
      <AuthHeading
        title="Criar meu perfil"
        description="Monte seu portfólio esportivo em poucos minutos. É gratuito."
      />

      <SignUpForm />

      <p className="mt-8 text-center text-[15px] text-navy-500">
        Já tem uma conta?{" "}
        <Link href="/entrar" className="font-semibold text-accent-600 hover:text-accent-700 hover:underline">
          Entrar
        </Link>
      </p>
    </>
  );
}
