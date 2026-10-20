-- Avisos push: antes de cada task, resumen de la mañana y avisos que programa Klo.
alter table public.tareas
  add column aviso_min int default 10 check (aviso_min is null or aviso_min between 0 and 1440),
  add column avisado_en timestamptz;
grant update (aviso_min) on public.tareas to authenticated;

-- Si la task cambia de fecha, hora o aviso, se vuelve a avisar. avisado_en solo lo escribe el envío.
create function private.limpiar_avisado() returns trigger language plpgsql set search_path = '' as $$
begin
  if new.fecha is distinct from old.fecha or new.hora is distinct from old.hora
     or new.aviso_min is distinct from old.aviso_min then
    new.avisado_en := null;
  end if;
  return new;
end $$;
create trigger tareas_limpiar_avisado before update on public.tareas
  for each row execute function private.limpiar_avisado();

alter table public.perfiles
  add column resumen_hora time default '08:00',
  add column resumen_enviado date;
grant update (resumen_hora) on public.perfiles to authenticated;

create table public.push_suscripciones (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  endpoint text not null unique check (endpoint ~ '^https://'),
  p256dh text not null,
  auth text not null,
  agente text,
  creado_en timestamptz not null default now()
);

create table public.avisos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  texto text not null check (char_length(trim(texto)) between 1 and 200),
  url text check (url is null or url ~ '^/'),
  tarea_id uuid references public.tareas (id) on delete cascade,
  enviar_en timestamptz not null,
  enviado_en timestamptz,
  creado_en timestamptz not null default now()
);
create index avisos_pendientes_idx on public.avisos (enviar_en) where enviado_en is null;
create index tareas_aviso_idx on public.tareas (fecha)
  where avisado_en is null and hora is not null and aviso_min is not null
    and borrado_en is null and completada_en is null;

alter table public.push_suscripciones enable row level security;
alter table public.avisos enable row level security;
create policy push_duenio on public.push_suscripciones for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy avisos_duenio on public.avisos for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
grant select, insert, delete on public.push_suscripciones to authenticated;
grant update (p256dh, auth, agente) on public.push_suscripciones to authenticated;
grant select, insert, delete on public.avisos to authenticated;
