-- 0009 · Tareas de varios días: un evento puede terminar otro día (lunes 5 pm → martes 4 pm).
-- fecha_fin null = termina el mismo día (como hasta ahora). Si termina otro día, la hora de fin
-- puede ser menor que la de inicio.

alter table public.tareas add column fecha_fin date;

alter table public.tareas
  add constraint tareas_fecha_fin_check check (fecha_fin is null or (fecha is not null and fecha_fin > fecha));

-- La regla vieja (hora_fin > hora) solo aplica cuando todo pasa el mismo día.
alter table public.tareas drop constraint tareas_check1;
alter table public.tareas add constraint tareas_hora_fin_check check (
  hora_fin is null or (hora is not null and (fecha_fin is not null or hora_fin > hora))
);

grant update (fecha_fin) on public.tareas to authenticated;
