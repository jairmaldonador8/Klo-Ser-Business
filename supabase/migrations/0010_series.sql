-- 0010 · Tasks que se repiten (Every day, Every week on Sat, Every month on the 4th Sat…).
-- Cada repetición es una task real ligada a su serie: se palomea, se mueve y se borra sola, y Today,
-- Week y el calendario funcionan sin saber de reglas. La serie guarda la regla y hasta dónde se generó;
-- la app la va extendiendo hacia adelante. La plantilla de las nuevas es la última task de la serie.

create table public.series (
  id uuid primary key default gen_random_uuid(),
  espacio_id uuid not null references public.espacios (id) on delete cascade,
  -- { freq: 'dia'|'semana'|'mes'|'anio', cada: n, dias?: [0..6 lunes=0], mes?: 'dia'|'posicion' } (forma en lib/repetir).
  regla jsonb not null check (jsonb_typeof(regla) = 'object' and regla ? 'freq' and regla ? 'cada'),
  inicio date not null,
  -- Termina: en una fecha, o tras N repeticiones, o nunca (ambas null).
  hasta date check (hasta is null or hasta >= inicio),
  conteo int check (conteo is null or conteo between 1 and 1000),
  generado_hasta date not null,
  borrado_en timestamptz,
  creado_por uuid not null default auth.uid() references auth.users (id),
  creado_en timestamptz not null default now()
);
create index series_espacio_idx on public.series (espacio_id) where borrado_en is null;

alter table public.tareas add column serie_id uuid references public.series (id) on delete set null;
create index tareas_serie_idx on public.tareas (serie_id, fecha) where serie_id is not null;

-- Una task solo puede ser de una serie de su mismo frente.
create or replace function private.validar_tarea() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.proyecto_id is not null and not exists (
    select 1 from public.proyectos p where p.id = new.proyecto_id and p.espacio_id = new.espacio_id
  ) then
    raise exception 'proyecto_de_otro_frente' using errcode = 'P0001';
  end if;
  if new.serie_id is not null and (tg_op = 'INSERT' or new.serie_id is distinct from old.serie_id or new.espacio_id is distinct from old.espacio_id)
    and not exists (select 1 from public.series s where s.id = new.serie_id and s.espacio_id = new.espacio_id) then
    raise exception 'serie_de_otro_frente' using errcode = 'P0001';
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

-- ── RLS: como las tareas, la serie la ven y la tocan los miembros de su frente ──
alter table public.series enable row level security;
revoke all on public.series from anon, authenticated;
grant select, insert on public.series to authenticated;
grant update (espacio_id, regla, hasta, conteo, generado_hasta, borrado_en) on public.series to authenticated;
grant update (serie_id) on public.tareas to authenticated;

create policy series_select on public.series for select to authenticated
  using ((select private.es_miembro(espacio_id)));
create policy series_insert on public.series for insert to authenticated
  with check ((select private.es_miembro(espacio_id)) and creado_por = (select auth.uid()));
create policy series_update on public.series for update to authenticated
  using ((select private.es_miembro(espacio_id))) with check ((select private.es_miembro(espacio_id)));
