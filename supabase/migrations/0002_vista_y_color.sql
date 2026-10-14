-- 0002 · Personalización nivel 1: el color de cada frente y la vista de cada persona.
-- El color es identidad del frente, no estado (DISENO.md §9).

-- ── Color del frente ────────────────────────────────────────────────────
alter table public.espacios
  add column color text check (color in ('azul', 'violeta', 'rosa', 'sol'));

-- Los frentes que ya existen toman su color en ciclo, por orden de su creador.
with numerados as (
  select id, row_number() over (partition by creado_por order by orden, creado_en) - 1 as n
  from public.espacios
)
update public.espacios e
set color = (array['azul', 'sol', 'rosa', 'violeta'])[(numerados.n % 4)::int + 1]
from numerados
where numerados.id = e.id;

alter table public.espacios alter column color set not null;

-- Al crear un frente sin color, toma el siguiente del ciclo según cuántos tiene ya su creador.
create function private.asignar_color() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.color is null then
    select (array['azul', 'sol', 'rosa', 'violeta'])[(count(*) % 4)::int + 1]
    into new.color
    from public.espacios e
    where e.creado_por = new.creado_por;
  end if;
  return new;
end $$;

create trigger espacios_asignar_color before insert on public.espacios
  for each row execute function private.asignar_color();

-- La policy de update ya es solo dueños (0001); se abre la columna.
grant update (color) on public.espacios to authenticated;

-- ── Vista de cada persona (secciones y mosaicos; forma en lib/vista) ────
alter table public.perfiles
  add column vista jsonb not null default '{}'::jsonb check (jsonb_typeof(vista) = 'object');

grant update (vista) on public.perfiles to authenticated;
