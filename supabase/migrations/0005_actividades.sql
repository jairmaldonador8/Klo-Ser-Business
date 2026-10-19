-- 0005 · Actividades: la «clase» de una tarea deja de ser una lista fija.
-- Las de siempre conservan su clave (tarea, junta, entrega, profundo) y se suma «entreno»;
-- además cada persona guarda las suyas («Amozurrutia») en su perfil, y la tarea lleva el nombre tal cual.
-- Así la ven todos los miembros del frente sin tablas ni joins extra.

alter table public.tareas drop constraint tareas_clase_check;
alter table public.tareas add constraint tareas_clase_check
  check (char_length(trim(clase)) between 1 and 30);

alter table public.perfiles
  add column actividades text[] not null default '{}'
  check (cardinality(actividades) <= 20);

grant update (actividades) on public.perfiles to authenticated;
