import type { Metadata } from "next";
import { Logo } from "@/components/brand/logo";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export const metadata: Metadata = {
  title: "Painel",
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Segunda camada de proteção (a primeira é o proxy). A terceira é a RLS no banco.
  const user = await requireUser("/painel");

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle<Pick<Profile, "display_name">>();

  const name: string = profile?.display_name ?? user.email ?? "Atleta";
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part[0]?.toUpperCase())
    .join("");

  return (
    <div className="min-h-dvh bg-navy-50/40">
      <header className="sticky top-0 z-30 border-b border-navy-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo href="/painel" />
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2.5">
              <span
                className="flex size-9 items-center justify-center rounded-full bg-navy-900 text-sm font-bold text-white"
                aria-hidden="true"
              >
                {initials || "A"}
              </span>
              <span className="hidden max-w-48 truncate text-sm font-semibold text-navy-900 sm:block">{name}</span>
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}
