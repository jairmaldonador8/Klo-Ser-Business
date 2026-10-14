create extension if not exists pgtap with schema extensions;

create schema if not exists pruebas;
grant usage on schema pruebas to authenticated, anon;

create or replace function pruebas.crear_usuario(p_id uuid, p_correo text, p_nombre text default '')
returns uuid language plpgsql security definer set search_path = '' as $$
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values (p_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', p_correo,
          '{"provider":"google"}', jsonb_build_object('full_name', p_nombre), now(), now());
  return p_id;
end $$;

create or replace function pruebas.autenticar_como(p_id uuid)
returns void language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', p_id, 'role', 'authenticated')::text, true);
end $$;

grant execute on all functions in schema pruebas to authenticated, anon;

select plan(1);
select has_function('pruebas', 'autenticar_como', array['uuid'], 'ayudantes listos');
select * from finish();
