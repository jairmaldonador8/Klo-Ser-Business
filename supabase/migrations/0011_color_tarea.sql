-- 0011 · Color propio de una task (como Notion Calendar). null = el color de su frente.
-- La paleta vive en lib/tareas/colores.ts; aquí solo se valida que sea una de sus claves.

alter table public.tareas add column color text
  check (color is null or color in ('brasa', 'oro', 'menta', 'cielo', 'azul', 'lavanda', 'rosa', 'rojo', 'grafito'));

grant update (color) on public.tareas to authenticated;
