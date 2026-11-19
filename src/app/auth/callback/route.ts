import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/redirect";

const OTP_TYPES: EmailOtpType[] = ["signup", "email", "recovery", "invite", "magiclink", "email_change"];

/**
 * Destino dos links enviados por e-mail (confirmação de conta e recuperação de senha).
 *
 * Aceita os dois formatos do Supabase:
 *  - ?token_hash=...&type=...  (templates de e-mail recomendados; funciona em outro aparelho)
 *  - ?code=...                 (template padrão / PKCE; funciona no mesmo navegador do cadastro)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const fallback = type === "recovery" ? "/nova-senha" : "/painel";
  const next = safeNextPath(searchParams.get("next"), fallback);

  const supabase = await createClient();

  if (tokenHash && type && OTP_TYPES.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) redirect(next);
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) redirect(next);
  }

  // Link inválido, expirado ou já utilizado.
  const motivo = searchParams.get("error_code") ?? "link_invalido";
  redirect(`/auth/erro?motivo=${encodeURIComponent(motivo)}`);
}
