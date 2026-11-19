# Racebook

Plataforma de portfólio esportivo para atletas: provas, resultados, pódios, equipamentos, treinos e fotos em um perfil público.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Lucide · Supabase (Postgres, Auth, Storage) · Vercel

> Status: **Etapa 2 concluída**: banco de dados, autenticação completa e painel protegido.

---

## Sumário

1. [Requisitos](#1-requisitos)
2. [Instalar as dependências](#2-instalar-as-dependências)
3. [Configurar o Supabase](#3-configurar-o-supabase)
4. [Criar o banco e executar as migrations](#4-criar-o-banco-e-executar-as-migrations)
5. [Armazenamento de imagens](#5-armazenamento-de-imagens)
6. [Configurar a autenticação](#6-configurar-a-autenticação)
7. [Variáveis de ambiente](#7-variáveis-de-ambiente)
8. [Executar localmente](#8-executar-localmente)
9. [Deploy na Vercel](#9-deploy-na-vercel)
10. [Arquitetura e segurança](#10-arquitetura-e-segurança)

---

## 1. Requisitos

- Node.js **20.9 ou superior** (`node -v`)
- Conta gratuita no [Supabase](https://supabase.com) e na [Vercel](https://vercel.com)
- Repositório no GitHub (para o deploy automático)

## 2. Instalar as dependências

```bash
npm install
```

## 3. Configurar o Supabase

1. Acesse **supabase.com → New project**.
2. Nome: `racebook` · Região: **South America (São Paulo)** · defina e guarde a senha do banco.
3. Aguarde o projeto ficar pronto (1–2 minutos).

## 4. Criar o banco e executar as migrations

As migrations ficam em `supabase/migrations/` e devem ser executadas **em ordem**:

| Arquivo | O que faz |
|---|---|
| `20261119000001_initial_schema.sql` | Tabelas, índices, gatilhos, indicadores, RLS e bucket de imagens |
| `20261119000002_auth_adjustments.sql` | Criação de perfil mais robusta no cadastro e bloqueio de funções internas |

**Pelo painel (mais simples):**

1. Supabase → **SQL Editor → New query**.
2. Cole o conteúdo do arquivo `...000001_initial_schema.sql` → **Run**.
3. Nova query com o conteúdo de `...000002_auth_adjustments.sql` → **Run**.
4. Confira em **Table Editor**: `profiles`, `competitions`, `competition_photos`, `equipment`, `competition_equipment`, `trainings`, `training_photos`.

**Pela CLI (opcional):**

```bash
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase db push
```

## 5. Armazenamento de imagens

A migration já cria o bucket **`media`**, **privado**, com limite de 8 MB e apenas imagens (JPG, PNG, WEBP, HEIC).

- Confira em **Storage**: o bucket `media` deve aparecer como *Private*.
- As fotos ficam em `{id-do-usuário}/...`; cada atleta só envia, altera e exclui na própria pasta.
- O site exibe as imagens por **links temporários assinados**. Fotos privadas não podem ser abertas por URL, mesmo que alguém descubra o caminho.
- Nada é salvo no disco da Vercel.

## 6. Configurar a autenticação

### 6.1 URLs (obrigatório)

Supabase → **Authentication → URL Configuration**:

| Campo | Valor |
|---|---|
| **Site URL** | Em desenvolvimento: `http://localhost:3000` · Em produção: `https://seu-dominio.vercel.app` (ou domínio próprio) |
| **Redirect URLs** | `http://localhost:3000/**` · `https://seu-dominio.vercel.app/**` · `https://*-SEU-USUARIO.vercel.app/**` (previews, opcional) |

### 6.2 Provedor de e-mail

**Authentication → Sign In / Providers → Email**:

- **Enable Email provider**: ativado
- **Confirm email**: ativado (recomendado; o app também funciona com ele desativado)
- **Minimum password length**: 8

### 6.3 Templates de e-mail (recomendado)

Com estes templates, o link funciona mesmo se o atleta abrir o e-mail em **outro aparelho** (ex.: cadastrou no computador e abriu o e-mail no celular).

**Authentication → Emails → Templates**:

**Confirm signup**: assunto `Confirme seu cadastro no Racebook`

```html
<h2>Bem-vindo ao Racebook!</h2>
<p>Confirme seu e-mail para ativar seu portfólio esportivo:</p>
<p><a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email&next=/painel">Confirmar e-mail</a></p>
<p>Se você não criou esta conta, ignore esta mensagem.</p>
```

**Reset password**: assunto `Redefinir sua senha do Racebook`

```html
<h2>Redefinição de senha</h2>
<p>Recebemos um pedido para redefinir a senha da sua conta no Racebook.</p>
<p><a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery&next=/nova-senha">Criar nova senha</a></p>
<p>Se você não fez este pedido, ignore esta mensagem.</p>
```

> Sem alterar os templates, o fluxo também funciona (via `?code=`), mas o link precisa ser aberto **no mesmo navegador** em que o cadastro foi feito.

### 6.4 Limite de e-mails (importante para produção)

O servidor de e-mail embutido do Supabase envia **poucas mensagens por hora** e serve só para testes. Antes de abrir para atletas reais, configure um SMTP próprio em **Authentication → Emails → SMTP Settings** (ex.: Resend, Brevo, Amazon SES).

## 7. Variáveis de ambiente

Copie o modelo:

```bash
cp .env.example .env.local
```

| Variável | Onde encontrar | Exemplo |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → **Project Settings → API** → Project URL | `https://abcd1234.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → **Project Settings → API Keys** → *Publishable key* (em projetos antigos, a chave **anon** da aba *Legacy*) | `sb_publishable_...` |
| `NEXT_PUBLIC_SITE_URL` | Endereço do site, sem barra no final | `http://localhost:3000` |

> ⚠️ **Não use** a `service_role` / *secret key* em nenhum lugar deste projeto. Todas as operações usam a sessão do usuário e são protegidas pela RLS.

## 8. Executar localmente

```bash
npm run dev        # http://localhost:3000
npm run typecheck  # checagem de tipos
npm run build      # build de produção (o mesmo que a Vercel executa)
npm start          # roda o build localmente
```

**No GitHub Codespaces:** a porta 3000 é encaminhada para uma URL do tipo `https://NOME-3000.app.github.dev`. Use essa URL em `NEXT_PUBLIC_SITE_URL`, no **Site URL** e nas **Redirect URLs** do Supabase enquanto testar por lá.

## 9. Deploy na Vercel

1. Envie o projeto para um repositório no GitHub.
2. Vercel → **Add New → Project** → importe o repositório (o framework *Next.js* é detectado sozinho).
3. Em **Environment Variables**, cadastre as 3 variáveis da seção 7 (para *Production* e *Preview*), com `NEXT_PUBLIC_SITE_URL` = URL de produção.
4. **Deploy.**
5. Volte ao Supabase (seção 6.1) e coloque a URL de produção em **Site URL** e **Redirect URLs**.
6. A cada `git push` na branch principal, a Vercel publica automaticamente.

**Domínio próprio:** Vercel → Project → **Settings → Domains**. Depois atualize `NEXT_PUBLIC_SITE_URL` (e faça redeploy) e as URLs no Supabase.

## 10. Arquitetura e segurança

```
src/
├─ app/
│  ├─ (auth)/                 entrar, cadastro, cadastro/verifique-email, recuperar-senha, nova-senha
│  ├─ auth/callback/route.ts  destino dos links de e-mail (confirmação e recuperação)
│  ├─ auth/erro/              link inválido ou expirado
│  ├─ painel/                 área logada
│  ├─ page.tsx                página inicial
│  ├─ error.tsx, not-found.tsx
├─ components/                brand/, ui/, auth/, layout/
├─ lib/
│  ├─ supabase/               client.ts (navegador), server.ts (servidor), proxy.ts (sessão)
│  ├─ actions/auth.ts         Server Actions de autenticação
│  ├─ validations/auth.ts     validação com Zod (executada no servidor)
│  ├─ auth.ts                 getSessionUser() / requireUser()
│  └─ env.ts, redirect.ts, auth-errors.ts, utils.ts
├─ types/database.ts
└─ proxy.ts                   (Next.js 16: substitui o antigo middleware.ts)
supabase/migrations/
```

**Camadas de proteção**

1. **`src/proxy.ts`**: renova a sessão a cada requisição e redireciona visitantes que tentam abrir `/painel` ou `/nova-senha`.
2. **Servidor**: layouts, páginas e Server Actions validam o usuário com `getClaims()` (assinatura do token verificada) e validam os dados com Zod.
3. **Banco (RLS)**: mesmo que alguém chame a API do Supabase diretamente, só consegue ler o que é público e alterar o que é seu.

Outros cuidados: redirecionamentos só para caminhos internos (`?next=`), mensagens de recuperação de senha que não revelam se o e-mail existe, páginas logadas com `Cache-Control: private, no-store` e cabeçalhos de segurança em `next.config.ts`.
