-- =============================================================================
-- RACEBOOK — Edição de perfil e página pública (Etapa 3)
--
-- 1. Caminhos de arquivo só podem apontar para a PRÓPRIA pasta do atleta.
--    Corrige uma brecha: sem isso, alguém poderia gravar em avatar_path o
--    caminho de uma foto privada de outro atleta e, como is_media_public()
--    libera arquivos referenciados por perfis públicos, torná-la visível.
-- 2. Limites de tamanho para cidade e número de modalidades.
-- 3. Função is_slug_available(): permite checar se um endereço está livre
--    sem expor perfis privados (devolve apenas true/false).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Arquivos sempre dentro de "{id_do_atleta}/..."
-- -----------------------------------------------------------------------------
alter table public.profiles
  add constraint profiles_avatar_path_owner
    check (avatar_path is null or starts_with(avatar_path, id::text || '/')),
  add constraint profiles_cover_path_owner
    check (cover_path is null or starts_with(cover_path, id::text || '/'));

alter table public.equipment
  add constraint equipment_photo_path_owner
    check (photo_path is null or starts_with(photo_path, athlete_id::text || '/'));

alter table public.competition_photos
  add constraint competition_photos_path_owner
    check (starts_with(storage_path, athlete_id::text || '/'));

alter table public.training_photos
  add constraint training_photos_path_owner
    check (starts_with(storage_path, athlete_id::text || '/'));

-- -----------------------------------------------------------------------------
-- 2. Limites adicionais do perfil
-- -----------------------------------------------------------------------------
alter table public.profiles
  add constraint profiles_city_len
    check (city is null or char_length(city) between 2 and 80),
  add constraint profiles_sports_count
    check (cardinality(sports) <= 10);

-- -----------------------------------------------------------------------------
-- 3. Disponibilidade de slug
--    SECURITY DEFINER para enxergar também perfis privados, mas só devolve um
--    booleano. O próprio slug do usuário conta como disponível para ele.
-- -----------------------------------------------------------------------------
create or replace function public.is_slug_available(p_slug text)
returns boolean language sql stable security definer set search_path = '' as $$
  select p_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
     and char_length(p_slug) between 3 and 40
     and not exists (
       select 1 from public.profiles
       where slug = p_slug and id is distinct from auth.uid()
     )
$$;

revoke execute on function public.is_slug_available(text) from public, anon;
grant  execute on function public.is_slug_available(text) to authenticated;
