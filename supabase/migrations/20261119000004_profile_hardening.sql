-- =============================================================================
-- RACEBOOK — Reforço de segurança do perfil (Etapa 3, revisão técnica)
--
-- P2. Usuários só podem alterar as colunas editáveis do perfil
--     (id, created_at e updated_at deixam de ser alteráveis pela API).
-- P3. Slugs reservados passam a ser bloqueados também no banco.
-- P1/P3/P8. Geração automática de slug evita reservados e trata conflitos
--     simultâneos de cadastro (tenta outro sufixo em vez de falhar).
-- P4/P5. Troca/remoção de foto e capa por função transacional, com caminhos
--     restritos às pastas {id}/avatar/ e {id}/cover/.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Slugs reservados (manter igual a RESERVED_SLUGS em src/lib/constants/profile.ts)
-- -----------------------------------------------------------------------------
create or replace function public.reserved_slugs()
returns text[] language sql immutable set search_path = '' as $$
  select array[
    'admin','administrador','api','app','atleta','atletas','auth','cadastro','config',
    'configuracoes','contato','editar','entrar','equipe','explorar','help','ajuda','login',
    'logout','novo','nova-senha','painel','perfil','privacidade','racebook','recuperar-senha',
    'sair','signup','suporte','termos','www'
  ]::text[]
$$;

create or replace function public.is_reserved_slug(p_slug text)
returns boolean language sql immutable set search_path = '' as $$
  select coalesce(p_slug = any (public.reserved_slugs()), false)
$$;

-- Bloqueia slug reservado ao criar o perfil ou ao TROCAR o slug.
-- Perfis antigos que já têm um slug reservado continuam funcionando
-- e podem ser salvos normalmente enquanto não trocarem o endereço.
-- INSERT e UPDATE são tratados em ramos separados: OLD só é lido no UPDATE.
create or replace function public.check_reserved_slug()
returns trigger language plpgsql set search_path = '' as $$
declare
  v_check boolean := false;
begin
  if tg_op = 'INSERT' then
    v_check := true;
  elsif tg_op = 'UPDATE' then
    if new.slug is distinct from old.slug then
      v_check := true;
    end if;
  end if;

  if v_check and public.is_reserved_slug(new.slug) then
    raise exception 'reserved_slug'
      using errcode = '23514', detail = 'O endereço "' || new.slug || '" é reservado.';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_reserved_slug on public.profiles;
create trigger profiles_reserved_slug
  before insert or update of slug on public.profiles
  for each row execute function public.check_reserved_slug();

-- -----------------------------------------------------------------------------
-- 2. Disponibilidade de slug: reservados contam como indisponíveis
--    (exceto o slug atual do próprio usuário).
-- -----------------------------------------------------------------------------
create or replace function public.is_slug_available(p_slug text)
returns boolean language sql stable security definer set search_path = '' as $$
  select p_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
     and char_length(p_slug) between 3 and 40
     and not exists (
       select 1 from public.profiles
       where slug = p_slug and id is distinct from auth.uid()
     )
     and (
       not public.is_reserved_slug(p_slug)
       or exists (select 1 from public.profiles where id = auth.uid() and slug = p_slug)
     )
$$;

revoke execute on function public.is_slug_available(text) from public, anon;
grant  execute on function public.is_slug_available(text) to authenticated;

-- -----------------------------------------------------------------------------
-- 3. Criação do perfil no cadastro
--    - nome curto ou slug reservado → "atleta-xxxxx"
--    - conflito simultâneo (dois cadastros com o mesmo nome ao mesmo tempo):
--      captura a violação do índice único e tenta outro sufixo.
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_name text := left(trim(coalesce(
                   nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
                   split_part(coalesce(new.email, ''), '@', 1)
                 )), 80);
  v_base       text;
  v_slug       text;
  v_attempt    int := 0;
  v_constraint text;
begin
  if v_name is null or char_length(v_name) < 2 then
    v_name := 'Atleta';
  end if;

  v_base := trim(both '-' from left(public.slugify(v_name), 32));

  if char_length(v_base) < 3 or public.is_reserved_slug(v_base) then
    v_base := case when char_length(v_base) < 3 then 'atleta' else v_base end;
    v_slug := v_base || '-' || substr(md5(random()::text || clock_timestamp()::text), 1, 5);
  else
    v_slug := v_base;
  end if;

  loop
    -- Checagem rápida (evita exceções no caso comum).
    while exists (select 1 from public.profiles where slug = v_slug) loop
      v_slug := v_base || '-' || substr(md5(random()::text || clock_timestamp()::text), 1, 5);
    end loop;

    begin
      insert into public.profiles (id, slug, display_name)
      values (new.id, v_slug, v_name);
      return new;
    exception when unique_violation then
      get stacked diagnostics v_constraint = constraint_name;
      -- Só repete para conflito de slug; qualquer outro erro sobe normalmente.
      if v_constraint is distinct from 'profiles_slug_key' then
        raise;
      end if;
      v_attempt := v_attempt + 1;
      if v_attempt >= 10 then
        raise;
      end if;
      v_slug := v_base || '-' || substr(md5(random()::text || clock_timestamp()::text), 1, 5);
    end;
  end loop;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 4. Permissões de coluna em profiles
--    A RLS decide QUAIS LINHAS; os GRANTs decidem QUAIS COLUNAS.
--    Ficam de fora: id, created_at, updated_at (gatilho) e birth_date
--    (deverá ir para uma tabela privada quando for usado).
-- -----------------------------------------------------------------------------
revoke update on public.profiles from anon, authenticated;
grant update (
  slug, display_name, avatar_path, cover_path, city, state, bio, sports,
  practicing_since, instagram_url, strava_url, website_url, other_links,
  is_public, onboarding_done
) on public.profiles to authenticated;

-- -----------------------------------------------------------------------------
-- 5. Foto e capa só nas pastas próprias de cada tipo
--    (substitui as restrições genéricas da migration 000003).
-- -----------------------------------------------------------------------------
alter table public.profiles
  drop constraint if exists profiles_avatar_path_owner,
  drop constraint if exists profiles_cover_path_owner;

alter table public.profiles
  add constraint profiles_avatar_path_owner
    check (avatar_path is null or starts_with(avatar_path, id::text || '/avatar/')),
  add constraint profiles_cover_path_owner
    check (cover_path is null or starts_with(cover_path, id::text || '/cover/'));

-- -----------------------------------------------------------------------------
-- 6. Troca / remoção transacional de foto e capa
--    SECURITY INVOKER: roda com as permissões do usuário (RLS + GRANTs).
--    p_path = null remove a imagem. Devolve o caminho anterior, para o app
--    apagar o arquivo antigo do Storage.
-- -----------------------------------------------------------------------------
create or replace function public.swap_profile_image(p_kind text, p_path text)
returns text language plpgsql security invoker set search_path = '' as $$
declare
  v_uid  uuid := auth.uid();
  v_prev text;
  v_ext  text;
  v_mime text;
  v_size bigint;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if p_kind is null or p_kind not in ('avatar', 'cover') then
    raise exception 'invalid_kind' using errcode = '22023';
  end if;

  if p_path is not null then
    -- Caminho exatamente no formato gerado pelo servidor, na pasta do usuário.
    if p_path !~ ('^' || v_uid::text || '/' || p_kind ||
                  '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$') then
      raise exception 'invalid_path' using errcode = '22023';
    end if;

    -- O arquivo precisa existir no bucket, com tipo compatível com a extensão
    -- e no máximo 5 MB (metadados gravados pelo próprio Storage).
    select o.metadata->>'mimetype', nullif(o.metadata->>'size', '')::bigint
      into v_mime, v_size
      from storage.objects o
     where o.bucket_id = 'media' and o.name = p_path;

    if not found then
      raise exception 'file_not_found' using errcode = 'P0002';
    end if;

    v_ext := substring(p_path from '\.([a-z]+)$');
    if v_mime is distinct from (case v_ext
                                  when 'jpg'  then 'image/jpeg'
                                  when 'png'  then 'image/png'
                                  when 'webp' then 'image/webp'
                                end) then
      raise exception 'invalid_file_type' using errcode = '22023';
    end if;

    if v_size is null or v_size <= 0 or v_size > 5 * 1024 * 1024 then
      raise exception 'invalid_file_size' using errcode = '22023';
    end if;
  end if;

  -- Bloqueia a linha: trocas simultâneas (duas abas) ficam em fila
  -- e cada uma recebe o caminho anterior correto.
  select case p_kind when 'avatar' then avatar_path else cover_path end
    into v_prev
    from public.profiles
   where id = v_uid
   for update;

  if not found then
    raise exception 'profile_not_found' using errcode = 'P0002';
  end if;

  if p_kind = 'avatar' then
    update public.profiles set avatar_path = p_path where id = v_uid;
  else
    update public.profiles set cover_path = p_path where id = v_uid;
  end if;

  return v_prev;
end;
$$;

revoke execute on function public.swap_profile_image(text, text) from public, anon;
grant  execute on function public.swap_profile_image(text, text) to authenticated;

revoke execute on function public.check_reserved_slug() from public, anon, authenticated;
