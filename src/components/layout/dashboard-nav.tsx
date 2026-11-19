"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, UserRoundPen } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/painel", label: "Painel", icon: LayoutDashboard, exact: true },
  { href: "/painel/perfil", label: "Meu perfil", icon: UserRoundPen, exact: false },
];

export function DashboardNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Navegação do painel" className="flex items-center gap-1">
      {links.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500",
              active ? "bg-navy-900 text-white" : "text-navy-600 hover:bg-navy-50 hover:text-navy-950",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">{label}</span>
            <span className="sr-only sm:hidden">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
