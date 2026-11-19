import type { Metadata } from "next";
import Link from "next/link";
import { Logo, LogoMark } from "@/components/brand/logo";
import { DashboardNav } from "@/components/layout/dashboard-nav";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { AthleteAvatar } from "@/components/profile/athlete-avatar";
import { requireUser } from "@/lib/auth";
import { getOwnProfileWithImages } from "@/lib/profile";

export const metadata: Metadata = {
  title: "Painel",
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Segunda camada de proteção (a primeira é o proxy). A terceira é a RLS no banco.
  const user = await requireUser("/painel");
  const data = await getOwnProfileWithImages(user.id);

  const name: string = data?.profile.display_name ?? user.email ?? "Atleta";

  return (
    <div className="min-h-dvh bg-navy-50/40">
      <header className="sticky top-0 z-30 border-b border-navy-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-3 sm:gap-6">
            <span className="sm:hidden">
              <Link href="/painel" aria-label="Racebook — painel" className="rounded-lg">
                <LogoMark />
              </Link>
            </span>
            <span className="hidden sm:block">
              <Logo href="/painel" />
            </span>
            <DashboardNav />
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href={data ? `/atleta/${data.profile.slug}` : "/painel/perfil"}
              className="flex items-center gap-2.5 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
              title="Ver meu perfil"
            >
              <AthleteAvatar name={name} src={data?.avatarUrl} size="sm" />
              <span className="hidden max-w-48 truncate text-sm font-semibold text-navy-900 md:block">{name}</span>
            </Link>
            <SignOutButton compact />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}
