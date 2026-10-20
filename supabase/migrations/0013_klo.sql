-- Klo vivo: lo que Jair le cuenta (brief), lo que Klo aprende (memoria) y la conversación.
alter table public.perfiles
  add column klo_brief text check (klo_brief is null or char_length(klo_brief) <= 4000);
grant update (klo_brief) on public.perfiles to authenticated;

create table public.klo_memoria (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  texto text not null check (char_length(trim(texto)) between 1 and 300),
  creado_en timestamptz not null default now()
);
create index klo_memoria_owner_idx on public.klo_memoria (owner_id, creado_en);

create table public.klo_mensajes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  sesion uuid not null,
  rol text not null check (rol in ('usuario', 'klo')),
  texto text not null check (char_length(texto) <= 8000),
  acciones jsonb not null default '[]'::jsonb,
  pendiente jsonb,
  deshecho_en timestamptz,
  creado_en timestamptz not null default now()
);
create index klo_mensajes_sesion_idx on public.klo_mensajes (owner_id, sesion, creado_en);

alter table public.klo_memoria enable row level security;
alter table public.klo_mensajes enable row level security;
create policy klo_memoria_duenio on public.klo_memoria for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy klo_mensajes_duenio on public.klo_mensajes for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
grant select, insert, delete on public.klo_memoria to authenticated;
grant select, insert on public.klo_mensajes to authenticated;
grant update (pendiente, deshecho_en, acciones) on public.klo_mensajes to authenticated;
