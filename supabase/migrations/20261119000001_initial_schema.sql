-- =============================================================================
-- RACEBOOK — Migration inicial
-- Tabelas, relacionamentos, índices, gatilhos, RLS e políticas de Storage.
-- Executar no SQL Editor do Supabase (ou via `supabase db push`).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. Extensões
-- -----------------------------------------------------------------------------
create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm  with schema extensions;

-- -----------------------------------------------------------------------------
-- 1. Domínios de valores (modalidades e categorias)
--    Mantidos como CHECK em texto: simples de evoluir com uma nova migration.
-- -----------------------------------------------------------------------------
create or replace function public.valid_sports()
returns text[] language sql immutable as $$
  select array[
    'triathlon','corrida','maratona','maratona_aquatica','natacao',
    'ciclismo','trail_running','mountain_bike','duathlon','outros'
  ]::text[]
$$;

create or replace function public.valid_training_sports()
returns text[] language sql immutable as $$
  select array['corrida','ciclismo','natacao','musculacao','funcional','outros']::text[]
$$;

-- -----------------------------------------------------------------------------
-- 2. Funções utilitárias
-- -----------------------------------------------------------------------------

-- Atualiza updated_at automaticamente
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Gera slug a partir de um texto: "João da Silva" -> "joao-da-silva"
create or replace function public.slugify(value text)
returns text language sql immutable as $$
  select trim(both '-' from
    regexp_replace(lower(extensions.unaccent(coalesce(value, ''))), '[^a-z0-9]+', '-', 'g')
  )
$$;

-- -----------------------------------------------------------------------------
-- 3. PROFILES — um perfil por usuário do Supabase Auth
-- -----------------------------------------------------------------------------
create table public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  slug             text not null,
  display_name     text not null,                 -- nome completo ou nome esportivo
  avatar_path      text,                          -- caminho no bucket "media"
  cover_path       text,
  city             text,
  state            char(2),                       -- UF
  bio              text,
  birth_date       date,
  sports           text[] not null default '{}',
  practicing_since smallint,                      -- ano em que começou (tempo de experiência)
  instagram_url    text,
  strava_url       text,
  website_url      text,
  other_links      jsonb not null default '[]',   -- [{ "label": "...", "url": "..." }]
  is_public        boolean not null default false,
  onboarding_done  boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint profiles_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 40),
  constraint profiles_display_name_len check (char_length(display_name) between 2 and 80),
  constraint profiles_bio_len check (bio is null or char_length(bio) <= 1000),
  constraint profiles_state_format check (state is null or state ~ '^[A-Z]{2}$'),
  constraint profiles_sports_valid check (sports <@ public.valid_sports()),
  constraint profiles_practicing_since check (practicing_since is null or practicing_since between 1900 and 2100),
  constraint profiles_other_links_array check (jsonb_typeof(other_links) = 'array')
);

create unique index profiles_slug_key on public.profiles (slug);
create index profiles_public_idx on public.profiles (is_public) where is_public;
create index profiles_sports_idx on public.profiles using gin (sports);
create index profiles_name_trgm_idx on public.profiles using gin (display_name extensions.gin_trgm_ops);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Cria o perfil automaticamente quando um usuário se cadastra.
-- O nome vem de raw_user_meta_data.full_name (enviado no signUp).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_name text := coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), split_part(new.email, '@', 1));
  v_base text := left(public.slugify(v_name), 32);
  v_slug text;
begin
  if char_length(v_base) < 3 then
    v_base := 'atleta';
  end if;
  v_slug := v_base;
  while exists (select 1 from public.profiles where slug = v_slug) loop
    v_slug := v_base || '-' || substr(md5(random()::text), 1, 4);
  end loop;

  insert into public.profiles (id, slug, display_name)
  values (new.id, v_slug, left(v_name, 80));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Usada nas políticas: "o dono do registro tem perfil público?"
-- SECURITY DEFINER evita recursão de RLS; só devolve um booleano.
create or replace function public.is_profile_public(p_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select is_public from public.profiles where id = p_id), false)
$$;

-- -----------------------------------------------------------------------------
-- 4. EQUIPMENT
-- -----------------------------------------------------------------------------
create table public.equipment (
  id           uuid primary key default gen_random_uuid(),
  athlete_id   uuid not null references public.profiles(id) on delete cascade,
  name         text not null,
  category     text not null,
  brand        text,
  model        text,
  photo_path   text,
  description  text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint equipment_name_len check (char_length(name) between 1 and 100),
  constraint equipment_category_valid check (category in (
    'bicicleta','tenis','relogio','oculos_natacao','capacete','roupa_borracha',
    'vestuario','acessorio','outros'
  )),
  constraint equipment_description_len check (description is null or char_length(description) <= 1000)
);

create index equipment_athlete_idx on public.equipment (athlete_id, category);
create trigger equipment_updated_at before update on public.equipment
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 5. COMPETITIONS
-- -----------------------------------------------------------------------------
create table public.competitions (
  id                  uuid primary key default gen_random_uuid(),
  athlete_id          uuid not null references public.profiles(id) on delete cascade,
  name                text not null,
  sport               text not null,
  event_date          date not null,
  city                text,
  state               char(2),
  organizer           text,
  -- Distância livre: texto exibido + segmentos opcionais (multiesporte)
  distance_label      text,                         -- ex.: "Sprint", "21 km", "3 km"
  distance_km         numeric(8,3),                 -- total em km, quando fizer sentido
  segments            jsonb not null default '[]',  -- [{ "discipline": "natacao", "distance_m": 750 }, ...]
  finish_time_seconds integer,
  overall_position    integer,
  overall_total       integer,
  category_name       text,                         -- ex.: "M 35-39"
  category_position   integer,
  category_total      integer,
  award               text,                         -- premiação recebida
  notes               text,
  is_public           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint competitions_name_len check (char_length(name) between 2 and 150),
  constraint competitions_sport_valid check (sport = any (public.valid_sports())),
  constraint competitions_state_format check (state is null or state ~ '^[A-Z]{2}$'),
  constraint competitions_distance_pos check (distance_km is null or distance_km > 0),
  constraint competitions_segments_array check (jsonb_typeof(segments) = 'array'),
  constraint competitions_time_pos check (finish_time_seconds is null or finish_time_seconds > 0),
  constraint competitions_overall_pos check (overall_position is null or overall_position > 0),
  constraint competitions_category_pos check (category_position is null or category_position > 0),
  constraint competitions_overall_total check (overall_total is null or overall_position is null or overall_total >= overall_position),
  constraint competitions_category_total check (category_total is null or category_position is null or category_total >= category_position),
  constraint competitions_notes_len check (notes is null or char_length(notes) <= 3000)
);

create index competitions_athlete_date_idx on public.competitions (athlete_id, event_date desc);
create index competitions_sport_idx on public.competitions (sport);
create trigger competitions_updated_at before update on public.competitions
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 6. COMPETITION_EQUIPMENT (N:N)
-- -----------------------------------------------------------------------------
create table public.competition_equipment (
  competition_id uuid not null references public.competitions(id) on delete cascade,
  equipment_id   uuid not null references public.equipment(id) on delete cascade,
  created_at     timestamptz not null default now(),
  primary key (competition_id, equipment_id)
);

create index competition_equipment_equipment_idx on public.competition_equipment (equipment_id);

-- -----------------------------------------------------------------------------
-- 7. COMPETITION_PHOTOS — também alimenta a Galeria de Conquistas.
--    competition_id é opcional: medalhas/certificados podem não ter prova vinculada.
-- -----------------------------------------------------------------------------
create table public.competition_photos (
  id             uuid primary key default gen_random_uuid(),
  athlete_id     uuid not null references public.profiles(id) on delete cascade,
  competition_id uuid references public.competitions(id) on delete cascade,
  storage_path   text not null unique,
  kind           text not null default 'foto',
  caption        text,
  is_public      boolean not null default true,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint competition_photos_kind_valid check (kind in ('foto','medalha','trofeu','certificado','podio','momento')),
  constraint competition_photos_caption_len check (caption is null or char_length(caption) <= 300)
);

create index competition_photos_athlete_idx on public.competition_photos (athlete_id, created_at desc);
create index competition_photos_competition_idx on public.competition_photos (competition_id);
create trigger competition_photos_updated_at before update on public.competition_photos
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 8. TRAININGS — privados por padrão
-- -----------------------------------------------------------------------------
create table public.trainings (
  id               uuid primary key default gen_random_uuid(),
  athlete_id       uuid not null references public.profiles(id) on delete cascade,
  sport            text not null,
  training_date    date not null,
  distance_km      numeric(8,3),
  duration_seconds integer,
  notes            text,
  is_public        boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint trainings_sport_valid check (sport = any (public.valid_training_sports())),
  constraint trainings_distance_pos check (distance_km is null or distance_km > 0),
  constraint trainings_duration_pos check (duration_seconds is null or duration_seconds > 0),
  constraint trainings_notes_len check (notes is null or char_length(notes) <= 3000)
);

create index trainings_athlete_date_idx on public.trainings (athlete_id, training_date desc);
create trigger trainings_updated_at before update on public.trainings
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 9. TRAINING_PHOTOS
-- -----------------------------------------------------------------------------
create table public.training_photos (
  id           uuid primary key default gen_random_uuid(),
  athlete_id   uuid not null references public.profiles(id) on delete cascade,
  training_id  uuid not null references public.trainings(id) on delete cascade,
  storage_path text not null unique,
  caption      text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint training_photos_caption_len check (caption is null or char_length(caption) <= 300)
);

create index training_photos_training_idx on public.training_photos (training_id);
create index training_photos_athlete_idx on public.training_photos (athlete_id);
create trigger training_photos_updated_at before update on public.training_photos
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 10. Integridade entre donos: impede vincular foto/equipamento de outro atleta
-- -----------------------------------------------------------------------------
create or replace function public.check_competition_equipment_owner()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (select athlete_id from public.competitions where id = new.competition_id)
     is distinct from (select athlete_id from public.equipment where id = new.equipment_id) then
    raise exception 'Prova e equipamento pertencem a atletas diferentes';
  end if;
  return new;
end;
$$;
create trigger competition_equipment_owner before insert or update on public.competition_equipment
  for each row execute function public.check_competition_equipment_owner();

create or replace function public.check_competition_photo_owner()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.competition_id is not null and
     (select athlete_id from public.competitions where id = new.competition_id) is distinct from new.athlete_id then
    raise exception 'A prova não pertence a este atleta';
  end if;
  return new;
end;
$$;
create trigger competition_photos_owner before insert or update on public.competition_photos
  for each row execute function public.check_competition_photo_owner();

create or replace function public.check_training_photo_owner()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (select athlete_id from public.trainings where id = new.training_id) is distinct from new.athlete_id then
    raise exception 'O treino não pertence a este atleta';
  end if;
  return new;
end;
$$;
create trigger training_photos_owner before insert or update on public.training_photos
  for each row execute function public.check_training_photo_owner();

-- -----------------------------------------------------------------------------
-- 11. Indicadores automáticos (calculados a partir dos registros reais)
--     security_invoker: respeita a RLS de quem consulta. O dono vê o total
--     completo; visitantes veem números baseados apenas nas provas públicas.
--     Pódio  = top 3 na geral OU na categoria.
--     1º lugar = 1º na geral OU na categoria.
-- -----------------------------------------------------------------------------
create view public.profile_stats with (security_invoker = true) as
select
  p.id as athlete_id,
  count(c.id)                                                                   as competitions_count,
  count(c.id) filter (where c.overall_position <= 3 or c.category_position <= 3) as podiums_count,
  count(c.id) filter (where c.overall_position = 1 or c.category_position = 1)   as wins_count,
  (select count(distinct s) from (
      select unnest(p.sports) as s
      union
      select c2.sport from public.competitions c2 where c2.athlete_id = p.id
  ) x)                                                                          as sports_count
from public.profiles p
left join public.competitions c on c.athlete_id = p.id
group by p.id;

-- -----------------------------------------------------------------------------
-- 12. ROW LEVEL SECURITY
-- -----------------------------------------------------------------------------
alter table public.profiles              enable row level security;
alter table public.equipment             enable row level security;
alter table public.competitions          enable row level security;
alter table public.competition_equipment enable row level security;
alter table public.competition_photos    enable row level security;
alter table public.trainings             enable row level security;
alter table public.training_photos       enable row level security;

-- PROFILES -------------------------------------------------------------------
create policy "profiles: leitura pública ou própria" on public.profiles
  for select using (is_public or id = auth.uid());
create policy "profiles: dono atualiza" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
-- INSERT é feito pelo gatilho handle_new_user; DELETE acontece ao excluir a conta.

-- EQUIPMENT ------------------------------------------------------------------
create policy "equipment: leitura" on public.equipment
  for select using (athlete_id = auth.uid() or public.is_profile_public(athlete_id));
create policy "equipment: dono insere" on public.equipment
  for insert with check (athlete_id = auth.uid());
create policy "equipment: dono atualiza" on public.equipment
  for update using (athlete_id = auth.uid()) with check (athlete_id = auth.uid());
create policy "equipment: dono exclui" on public.equipment
  for delete using (athlete_id = auth.uid());

-- COMPETITIONS ---------------------------------------------------------------
create policy "competitions: leitura" on public.competitions
  for select using (athlete_id = auth.uid() or (is_public and public.is_profile_public(athlete_id)));
create policy "competitions: dono insere" on public.competitions
  for insert with check (athlete_id = auth.uid());
create policy "competitions: dono atualiza" on public.competitions
  for update using (athlete_id = auth.uid()) with check (athlete_id = auth.uid());
create policy "competitions: dono exclui" on public.competitions
  for delete using (athlete_id = auth.uid());

-- COMPETITION_EQUIPMENT ------------------------------------------------------
-- Visível quando a prova é visível (a RLS de competitions é aplicada no EXISTS).
create policy "competition_equipment: leitura" on public.competition_equipment
  for select using (exists (select 1 from public.competitions c where c.id = competition_id));
create policy "competition_equipment: dono insere" on public.competition_equipment
  for insert with check (
    exists (select 1 from public.competitions c where c.id = competition_id and c.athlete_id = auth.uid())
    and exists (select 1 from public.equipment e where e.id = equipment_id and e.athlete_id = auth.uid())
  );
create policy "competition_equipment: dono exclui" on public.competition_equipment
  for delete using (
    exists (select 1 from public.competitions c where c.id = competition_id and c.athlete_id = auth.uid())
  );

-- COMPETITION_PHOTOS ---------------------------------------------------------
create policy "competition_photos: leitura" on public.competition_photos
  for select using (
    athlete_id = auth.uid()
    or (
      is_public
      and public.is_profile_public(athlete_id)
      and (competition_id is null
           or exists (select 1 from public.competitions c where c.id = competition_id and c.is_public))
    )
  );
create policy "competition_photos: dono insere" on public.competition_photos
  for insert with check (athlete_id = auth.uid());
create policy "competition_photos: dono atualiza" on public.competition_photos
  for update using (athlete_id = auth.uid()) with check (athlete_id = auth.uid());
create policy "competition_photos: dono exclui" on public.competition_photos
  for delete using (athlete_id = auth.uid());

-- TRAININGS ------------------------------------------------------------------
create policy "trainings: leitura" on public.trainings
  for select using (athlete_id = auth.uid() or (is_public and public.is_profile_public(athlete_id)));
create policy "trainings: dono insere" on public.trainings
  for insert with check (athlete_id = auth.uid());
create policy "trainings: dono atualiza" on public.trainings
  for update using (athlete_id = auth.uid()) with check (athlete_id = auth.uid());
create policy "trainings: dono exclui" on public.trainings
  for delete using (athlete_id = auth.uid());

-- TRAINING_PHOTOS ------------------------------------------------------------
create policy "training_photos: leitura" on public.training_photos
  for select using (
    athlete_id = auth.uid()
    or exists (select 1 from public.trainings t where t.id = training_id and t.is_public
               and public.is_profile_public(t.athlete_id))
  );
create policy "training_photos: dono insere" on public.training_photos
  for insert with check (athlete_id = auth.uid());
create policy "training_photos: dono atualiza" on public.training_photos
  for update using (athlete_id = auth.uid()) with check (athlete_id = auth.uid());
create policy "training_photos: dono exclui" on public.training_photos
  for delete using (athlete_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 13. STORAGE — bucket privado "media"
--     Caminho obrigatório: {user_id}/{tipo}/{uuid}.{ext}
--     Arquivos NUNCA ficam públicos por URL fixa. O app gera signed URLs;
--     o Storage só assina se o arquivo pertencer ao usuário OU estiver
--     vinculado a um registro público de um perfil público.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', false, 8388608, array['image/jpeg','image/png','image/webp','image/heic','image/heif'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.is_media_public(p_path text)
returns boolean language sql stable security definer set search_path = '' as $$
  select
    exists (select 1 from public.profiles p
            where p.is_public and (p.avatar_path = p_path or p.cover_path = p_path))
    or exists (select 1 from public.competition_photos cp
               join public.profiles p on p.id = cp.athlete_id
               left join public.competitions c on c.id = cp.competition_id
               where cp.storage_path = p_path and cp.is_public and p.is_public
                 and (cp.competition_id is null or c.is_public))
    or exists (select 1 from public.training_photos tp
               join public.trainings t on t.id = tp.training_id
               join public.profiles p on p.id = tp.athlete_id
               where tp.storage_path = p_path and t.is_public and p.is_public)
    or exists (select 1 from public.equipment e
               join public.profiles p on p.id = e.athlete_id
               where e.photo_path = p_path and p.is_public)
$$;

create policy "media: leitura do dono ou pública" on storage.objects
  for select using (
    bucket_id = 'media'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_media_public(name))
  );
create policy "media: dono envia" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "media: dono atualiza" on storage.objects
  for update to authenticated using (
    bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "media: dono exclui" on storage.objects
  for delete to authenticated using (
    bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text
  );

-- -----------------------------------------------------------------------------
-- 14. Permissões
-- -----------------------------------------------------------------------------
grant select on public.profile_stats to anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
