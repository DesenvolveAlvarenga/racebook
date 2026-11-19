-- =============================================================================
-- RACEBOOK — Ajustes para a autenticação (Etapa 2)
--
-- 1. handle_new_user mais robusto: o perfil nunca falha ao ser criado
--    (nome vazio, nome com 1 letra ou nome longo demais não derrubam o cadastro).
-- 2. Funções internas deixam de ser chamáveis pela API pública (RPC).
-- =============================================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_name text := left(trim(coalesce(
                   nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
                   split_part(coalesce(new.email, ''), '@', 1)
                 )), 80);
  v_base text;
  v_slug text;
begin
  if v_name is null or char_length(v_name) < 2 then
    v_name := 'Atleta';
  end if;

  v_base := trim(both '-' from left(public.slugify(v_name), 32));
  if char_length(v_base) < 3 then
    v_base := 'atleta';
  end if;

  v_slug := v_base;
  while exists (select 1 from public.profiles where slug = v_slug) loop
    v_slug := v_base || '-' || substr(md5(random()::text || clock_timestamp()::text), 1, 5);
  end loop;

  insert into public.profiles (id, slug, display_name)
  values (new.id, v_slug, v_name);
  return new;
end;
$$;

-- Funções de gatilho e utilitárias não precisam ser expostas via /rest/v1/rpc
revoke execute on function public.handle_new_user()                    from public, anon, authenticated;
revoke execute on function public.check_competition_equipment_owner() from public, anon, authenticated;
revoke execute on function public.check_competition_photo_owner()     from public, anon, authenticated;
revoke execute on function public.check_training_photo_owner()        from public, anon, authenticated;
