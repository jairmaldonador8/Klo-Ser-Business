-- Para el Undo de Klo: quien creó un proyecto lo puede borrar (sus tasks se quedan, sin proyecto).
grant delete on public.proyectos to authenticated;
create policy proyectos_delete on public.proyectos for delete to authenticated
  using ((select private.es_miembro(espacio_id)) and creado_por = (select auth.uid()));
