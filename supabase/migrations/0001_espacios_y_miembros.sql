-- 0001 · Espacios y miembros: la tenencia de Klo-Ser Business.
-- Un frente ES un espacio. Todo dato de negocio colgará de un espacio y solo lo ven sus miembros.

create schema if not exists private;
grant usage on schema private to authenticated;

-- ── Tablas ──────────────────────────────────────────────────────────────
create table public.perfiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null default '' check (char_length(nombre) <= 80),
  zona_horaria text not null default 'America/Monterrey',
  espacio_predeterminado_id uuid,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table public.espacios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (char_length(trim(nombre)) between 1 and 40),
  inicial text not null check (char_length(inicial) = 1),
  atajo text not null check (atajo ~ '^[a-z0-9]{1,12}$'),
  orden int not null default 0,
  creado_por uuid not null default auth.uid() references auth.users (id),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table public.miembros (
  espacio_id uuid not null references public.espacios (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  rol text not null default 'miembro' check (rol in ('dueno', 'miembro')),
  creado_en timestamptz not null default now(),
  primary key (espacio_id, user_id)
);
create index miembros_user_espacio_idx on public.miembros (user_id, espacio_id);

alter table public.perfiles
  add constraint perfiles_espacio_predeterminado_fk
  foreign key (espacio_predeterminado_id) references public.espacios (id) on delete set null;

-- ── Ayudantes de RLS ────────────────────────────────────────────────────
create function private.es_miembro(p_espacio uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.miembros m
    where m.espacio_id = p_espacio and m.user_id = (select auth.uid())
  );
$$;

create function private.es_dueno(p_espacio uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.miembros m
    where m.espacio_id = p_espacio and m.user_id = (select auth.uid()) and m.rol = 'dueno'
  );
$$;

revoke execute on function private.es_miembro(uuid), private.es_dueno(uuid) from public, anon;
grant execute on function private.es_miembro(uuid), private.es_dueno(uuid) to authenticated;

-- ── Disparadores ────────────────────────────────────────────────────────
create function private.tocar_actualizado_en() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.actualizado_en := now();
  return new;
end $$;

create trigger perfiles_tocar before update on public.perfiles
  for each row execute function private.tocar_actualizado_en();
create trigger espacios_tocar before update on public.espacios
  for each row execute function private.tocar_actualizado_en();

-- Cada usuario nuevo nace con perfil (nombre de Google si lo trae).
create function private.crear_perfil() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.perfiles (user_id, nombre)
  values (new.id, coalesce(left(new.raw_user_meta_data ->> 'full_name', 80), ''));
  return new;
end $$;

create trigger auth_usuario_crea_perfil after insert on auth.users
  for each row execute function private.crear_perfil();

-- El espacio predeterminado tiene que ser uno donde el usuario es miembro.
create function private.validar_perfil() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.espacio_predeterminado_id is not null and not exists (
    select 1 from public.miembros m
    where m.espacio_id = new.espacio_predeterminado_id and m.user_id = new.user_id
  ) then
    raise exception 'espacio_ajeno' using errcode = '42501';
  end if;
  return new;
end $$;

create trigger perfiles_validar before insert or update on public.perfiles
  for each row execute function private.validar_perfil();

-- ── RLS y permisos ──────────────────────────────────────────────────────
alter table public.perfiles enable row level security;
alter table public.espacios enable row level security;
alter table public.miembros enable row level security;

revoke all on public.perfiles, public.espacios, public.miembros from anon, authenticated;
grant select on public.perfiles, public.espacios, public.miembros to authenticated;
grant update (nombre, zona_horaria, espacio_predeterminado_id) on public.perfiles to authenticated;
grant update (nombre, inicial, atajo, orden) on public.espacios to authenticated;
grant delete on public.espacios to authenticated;
grant insert, delete on public.miembros to authenticated;

create policy perfiles_select on public.perfiles for select to authenticated
  using (user_id = (select auth.uid()));
create policy perfiles_update on public.perfiles for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy espacios_select on public.espacios for select to authenticated
  using ((select private.es_miembro(id)));
create policy espacios_update on public.espacios for update to authenticated
  using ((select private.es_dueno(id))) with check ((select private.es_dueno(id)));
create policy espacios_delete on public.espacios for delete to authenticated
  using ((select private.es_dueno(id)));

create policy miembros_select on public.miembros for select to authenticated
  using ((select private.es_miembro(espacio_id)));
create policy miembros_insert on public.miembros for insert to authenticated
  with check ((select private.es_dueno(espacio_id)));
create policy miembros_delete on public.miembros for delete to authenticated
  using ((select private.es_dueno(espacio_id)));

-- ── RPC: crear espacio (espacio + dueño en un solo paso) ────────────────
create function public.crear_espacio(p_nombre text, p_inicial text, p_atajo text, p_orden int default 0)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'sin_sesion' using errcode = '42501';
  end if;
  if exists (
    select 1 from public.espacios e join public.miembros m on m.espacio_id = e.id
    where m.user_id = v_uid and e.atajo = p_atajo
  ) then
    raise exception 'atajo_repetido' using errcode = '23505';
  end if;
  insert into public.espacios (nombre, inicial, atajo, orden, creado_por)
  values (trim(p_nombre), p_inicial, p_atajo, p_orden, v_uid)
  returning id into v_id;
  insert into public.miembros (espacio_id, user_id, rol) values (v_id, v_uid, 'dueno');
  return v_id;
end $$;

revoke execute on function public.crear_espacio(text, text, text, int) from public, anon;
grant execute on function public.crear_espacio(text, text, text, int) to authenticated;

-- ── RPC: bienvenida (todos los frentes + perfil, todo o nada) ──────────
create function public.completar_bienvenida(p_nombre text, p_frentes jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_frente jsonb;
  v_id uuid;
  v_primero uuid;
  v_orden int := 0;
begin
  if v_uid is null then
    raise exception 'sin_sesion' using errcode = '42501';
  end if;
  if jsonb_typeof(p_frentes) <> 'array' or jsonb_array_length(p_frentes) = 0 then
    raise exception 'sin_frentes' using errcode = '22023';
  end if;
  for v_frente in select * from jsonb_array_elements(p_frentes) loop
    v_id := public.crear_espacio(v_frente ->> 'nombre', v_frente ->> 'inicial', v_frente ->> 'atajo', v_orden);
    v_primero := coalesce(v_primero, v_id);
    v_orden := v_orden + 1;
  end loop;
  update public.perfiles
  set nombre = left(trim(coalesce(p_nombre, '')), 80), espacio_predeterminado_id = v_primero
  where user_id = v_uid;
end $$;

revoke execute on function public.completar_bienvenida(text, jsonb) from public, anon;
grant execute on function public.completar_bienvenida(text, jsonb) to authenticated;

-- ── Lista permitida (registro cerrado) ──────────────────────────────────
create table private.correos_permitidos (
  correo text primary key check (correo = lower(correo)),
  creado_en timestamptz not null default now()
);
alter table private.correos_permitidos enable row level security;

-- Hook «Before User Created» de Supabase Auth: corre ANTES de crear el usuario.
create function public.hook_lista_permitida(event jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  if exists (
    select 1 from private.correos_permitidos
    where correo = lower(event -> 'user' ->> 'email')
  ) then
    return '{}'::jsonb;
  end if;
  return jsonb_build_object('error', jsonb_build_object(
    'message', 'Todavía no hay lugar, pronto abrimos.',
    'http_code', 403
  ));
end $$;

revoke execute on function public.hook_lista_permitida(jsonb) from public, anon, authenticated;
grant execute on function public.hook_lista_permitida(jsonb) to supabase_auth_admin;

-- Agregar un correo a la lista (solo con la llave secreta del servidor).
create function public.permitir_correo(p_correo text) returns void
language sql security definer set search_path = '' as $$
  insert into private.correos_permitidos (correo) values (lower(trim(p_correo)))
  on conflict do nothing;
$$;

revoke execute on function public.permitir_correo(text) from public, anon, authenticated;
grant execute on function public.permitir_correo(text) to service_role;
