-- 0003 · Proyectos, tareas y notas: lo que Jair captura y palomea cada día.
-- Todo cuelga de un espacio (frente) y lo ven solo sus miembros. Nada se borra en duro: borrado_en.
-- Clientes, entregas del plan y Klo llegan en migraciones siguientes (columnas aditivas).

-- ── Proyectos ───────────────────────────────────────────────────────────
create table public.proyectos (
  id uuid primary key default gen_random_uuid(),
  espacio_id uuid not null references public.espacios (id) on delete cascade,
  nombre text not null check (char_length(trim(nombre)) between 1 and 80),
  meta text not null default '' check (char_length(meta) <= 200),
  fecha_inicio date not null default current_date,
  fecha_meta date,
  modo_avance text not null default 'tareas' check (modo_avance in ('hitos', 'tareas', 'manual')),
  cifra_actual numeric not null default 0 check (cifra_actual >= 0),
  cifra_meta numeric check (cifra_meta > 0),
  estado text not null default 'activo' check (estado in ('activo', 'pausado', 'cerrado')),
  orden int not null default 0,
  creado_por uuid not null default auth.uid() references auth.users (id),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  check (fecha_meta is null or fecha_meta >= fecha_inicio),
  check (modo_avance <> 'manual' or cifra_meta is not null)
);
create index proyectos_espacio_idx on public.proyectos (espacio_id, estado);

-- ── Tareas ──────────────────────────────────────────────────────────────
create table public.tareas (
  id uuid primary key default gen_random_uuid(),
  espacio_id uuid not null references public.espacios (id) on delete cascade,
  titulo text not null check (char_length(trim(titulo)) between 1 and 200),
  clase text not null default 'tarea' check (clase in ('tarea', 'entrega', 'junta', 'profundo')),
  fecha date,
  hora time,
  hora_fin time,
  proyecto_id uuid references public.proyectos (id) on delete set null,
  responsable_id uuid not null default auth.uid() references auth.users (id),
  completada_en timestamptz,
  origen text not null default 'manual' check (origen in ('manual', 'klo', 'armar_mes')),
  borrado_en timestamptz,
  creado_por uuid not null default auth.uid() references auth.users (id),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  check (hora is null or fecha is not null),
  check (hora_fin is null or (hora is not null and hora_fin > hora)),
  check (clase <> 'junta' or hora is not null)
);
create index tareas_pendientes_idx on public.tareas (espacio_id, fecha)
  where borrado_en is null and completada_en is null;
create index tareas_proyecto_idx on public.tareas (proyecto_id) where proyecto_id is not null;

-- ── Notas ───────────────────────────────────────────────────────────────
create table public.notas (
  id uuid primary key default gen_random_uuid(),
  espacio_id uuid not null references public.espacios (id) on delete cascade,
  texto text not null check (char_length(trim(texto)) between 1 and 4000),
  convertida_en_tarea_id uuid references public.tareas (id) on delete set null,
  borrado_en timestamptz,
  creado_por uuid not null default auth.uid() references auth.users (id),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
create index notas_espacio_idx on public.notas (espacio_id, creado_en desc) where borrado_en is null;

create trigger proyectos_actualizado before update on public.proyectos
  for each row execute function private.tocar_actualizado_en();
create trigger tareas_actualizado before update on public.tareas
  for each row execute function private.tocar_actualizado_en();
create trigger notas_actualizado before update on public.notas
  for each row execute function private.tocar_actualizado_en();

-- ── Coherencia entre espacios (el proyecto y el responsable son del mismo frente) ──
create function private.validar_tarea() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.proyecto_id is not null and not exists (
    select 1 from public.proyectos p where p.id = new.proyecto_id and p.espacio_id = new.espacio_id
  ) then
    raise exception 'proyecto_de_otro_frente' using errcode = 'P0001';
  end if;
  -- Solo si cambia quién o dónde: las cascadas (set null) no deben tropezar aquí.
  if (tg_op = 'INSERT' or new.responsable_id is distinct from old.responsable_id or new.espacio_id is distinct from old.espacio_id)
    and not exists (
    select 1 from public.miembros m where m.espacio_id = new.espacio_id and m.user_id = new.responsable_id
  ) then
    raise exception 'responsable_no_es_miembro' using errcode = 'P0001';
  end if;
  return new;
end $$;

create trigger tareas_validar before insert or update on public.tareas
  for each row execute function private.validar_tarea();

create function private.validar_nota() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.convertida_en_tarea_id is not null and not exists (
    select 1 from public.tareas t where t.id = new.convertida_en_tarea_id and t.espacio_id = new.espacio_id
  ) then
    raise exception 'tarea_de_otro_frente' using errcode = 'P0001';
  end if;
  return new;
end $$;

create trigger notas_validar before insert or update on public.notas
  for each row execute function private.validar_nota();

-- ── RLS y permisos (sin delete: se borra suave) ─────────────────────────
alter table public.proyectos enable row level security;
alter table public.tareas enable row level security;
alter table public.notas enable row level security;

revoke all on public.proyectos, public.tareas, public.notas from anon, authenticated;
grant select, insert on public.proyectos, public.tareas, public.notas to authenticated;
grant update (nombre, meta, fecha_inicio, fecha_meta, modo_avance, cifra_actual, cifra_meta, estado, orden)
  on public.proyectos to authenticated;
grant update (espacio_id, titulo, clase, fecha, hora, hora_fin, proyecto_id, responsable_id, completada_en, borrado_en)
  on public.tareas to authenticated;
grant update (espacio_id, texto, convertida_en_tarea_id, borrado_en) on public.notas to authenticated;

create policy proyectos_select on public.proyectos for select to authenticated
  using ((select private.es_miembro(espacio_id)));
create policy proyectos_insert on public.proyectos for insert to authenticated
  with check ((select private.es_miembro(espacio_id)) and creado_por = (select auth.uid()));
create policy proyectos_update on public.proyectos for update to authenticated
  using ((select private.es_miembro(espacio_id))) with check ((select private.es_miembro(espacio_id)));

create policy tareas_select on public.tareas for select to authenticated
  using ((select private.es_miembro(espacio_id)));
create policy tareas_insert on public.tareas for insert to authenticated
  with check ((select private.es_miembro(espacio_id)) and creado_por = (select auth.uid()));
create policy tareas_update on public.tareas for update to authenticated
  using ((select private.es_miembro(espacio_id))) with check ((select private.es_miembro(espacio_id)));

create policy notas_select on public.notas for select to authenticated
  using ((select private.es_miembro(espacio_id)));
create policy notas_insert on public.notas for insert to authenticated
  with check ((select private.es_miembro(espacio_id)) and creado_por = (select auth.uid()));
create policy notas_update on public.notas for update to authenticated
  using ((select private.es_miembro(espacio_id))) with check ((select private.es_miembro(espacio_id)));
