import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";

/** Rotas que exigem login. */
const PROTECTED_PREFIXES = ["/painel", "/nova-senha"];
/** Rotas que só fazem sentido para quem NÃO está logado. */
const GUEST_ONLY_PREFIXES = ["/entrar", "/cadastro", "/recuperar-senha"];

function matches(pathname: string, prefixes: string[]) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Renova a sessão do Supabase a cada requisição e aplica o primeiro nível
 * de proteção de rotas. A segurança real dos dados continua na RLS
 * e nas verificações feitas no servidor (layouts e Server Actions).
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(env.supabaseUrl(), env.supabaseKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // IMPORTANTE: não colocar código entre createServerClient e getClaims().
  // getClaims() valida a assinatura do token e renova a sessão quando necessário.
  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = Boolean(data?.claims?.sub);
  const { pathname, search } = request.nextUrl;

  const redirectTo = (path: string, params?: Record<string, string>) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = "";
    Object.entries(params ?? {}).forEach(([k, v]) => url.searchParams.set(k, v));
    const redirect = NextResponse.redirect(url);
    // Preserva os cookies de sessão renovados.
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  };

  if (!isLoggedIn && matches(pathname, PROTECTED_PREFIXES)) {
    if (pathname.startsWith("/nova-senha")) {
      return redirectTo("/recuperar-senha", { erro: "link" });
    }
    return redirectTo("/entrar", { next: `${pathname}${search}` });
  }

  if (isLoggedIn && matches(pathname, GUEST_ONLY_PREFIXES)) {
    return redirectTo("/painel");
  }

  // Páginas com dados do usuário não devem ser guardadas em cache compartilhado.
  if (isLoggedIn) {
    response.headers.set("Cache-Control", "private, no-store");
  }

  return response;
}
