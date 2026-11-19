import { LogOut } from "lucide-react";
import { signOutAction } from "@/lib/actions/auth";
import { SubmitButton } from "@/components/ui/submit-button";

/** Logout via Server Action (funciona mesmo sem JavaScript). */
export function SignOutButton({ compact = false }: { compact?: boolean }) {
  return (
    <form action={signOutAction}>
      <SubmitButton variant="ghost" size="sm" pendingLabel={compact ? "" : "Saindo…"} aria-label="Sair da conta">
        <LogOut className="size-4" aria-hidden="true" />
        {compact ? <span className="sr-only">Sair</span> : "Sair"}
      </SubmitButton>
    </form>
  );
}
