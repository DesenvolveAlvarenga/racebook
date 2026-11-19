// Leitura centralizada das variáveis de ambiente públicas.
// Falha cedo e com mensagem clara se algo estiver faltando.

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Variável de ambiente ${name} não configurada. Veja o arquivo .env.example e o README.`,
    );
  }
  return value;
}

export const env = {
  // Acesso direto (process.env.NOME) para o Next.js embutir os valores no bundle do navegador.
  supabaseUrl: () => required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabaseKey: () =>
    required("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
};

/**
 * URL pública do site, usada nos links enviados por e-mail.
 * Ordem: NEXT_PUBLIC_SITE_URL → domínio de produção da Vercel → URL do deploy → localhost.
 */
export function getSiteUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");
  return url.replace(/\/+$/, "");
}
