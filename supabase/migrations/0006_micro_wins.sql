-- 0006 · Micro wins: hábitos diarios de cada persona («Wake up early», «Train»).
-- Se palomean por día y se renuevan solos: lo hecho vive en micro_wins_hechos (una fila por día),
-- así mañana amanecen vacíos y queda la historia para rachas. Son personales (no de un frente).

create table public.micro_wins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nombre text not null check (char_length(trim(nombre)) between 1 and 40),
  orden int not null default 0,
  borrado_en timestamptz,
  creado_en timestamptz not null default now()
);
create index micro_wins_user_idx on public.micro_wins (user_id, orden) where borrado_en is null;

create table public.micro_wins_hechos (
  micro_win_id uuid not null references public.micro_wins (id) on delete cascade,
  fecha date not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  creado_en timestamptz not null default now(),
  primary key (micro_win_id, fecha)
);
create index micro_wins_hechos_user_fecha_idx on public.micro_wins_hechos (user_id, fecha);

-- ── RLS: cada quien ve y toca solo lo suyo ──────────────────────────────
alter table public.micro_wins enable row level security;
alter table public.micro_wins_hechos enable row level security;

revoke all on public.micro_wins, public.micro_wins_hechos from anon, authenticated;
grant select, insert on public.micro_wins to authenticated;
grant update (nombre, orden, borrado_en) on public.micro_wins to authenticated;
grant select, insert, delete on public.micro_wins_hechos to authenticated;

create policy micro_wins_select on public.micro_wins for select to authenticated
  using (user_id = (select auth.uid()));
create policy micro_wins_insert on public.micro_wins for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy micro_wins_update on public.micro_wins for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Lo hecho solo puede apuntar a un micro win propio.
create policy hechos_select on public.micro_wins_hechos for select to authenticated
  using (user_id = (select auth.uid()));
create policy hechos_insert on public.micro_wins_hechos for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.micro_wins m where m.id = micro_win_id and m.user_id = (select auth.uid()))
  );
create policy hechos_delete on public.micro_wins_hechos for delete to authenticated
  using (user_id = (select auth.uid()));
