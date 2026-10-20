begin;
select plan(3);

select pruebas.crear_usuario('18181818-1818-1818-1818-181818181818', 'a18@prueba.mx', 'Ana');
select pruebas.crear_usuario('18181818-1818-1818-1818-181818181819', 'b18@prueba.mx', 'Beto');
select pruebas.autenticar_como('18181818-1818-1818-1818-181818181818');
select public.crear_espacio('Uno', 'U', 'uno18', 0);
select set_config('pruebas.e', (select id::text from public.espacios where atajo = 'uno18'), false);
insert into public.proyectos (espacio_id, nombre, modo_avance) values (current_setting('pruebas.e')::uuid, 'Lanzar', 'tareas');
insert into public.tareas (espacio_id, titulo, fecha, proyecto_id)
  values (current_setting('pruebas.e')::uuid, 'Propuesta', current_date, (select id from public.proyectos where nombre = 'Lanzar'));

select pruebas.autenticar_como('18181818-1818-1818-1818-181818181819');
delete from public.proyectos;
select pruebas.autenticar_como('18181818-1818-1818-1818-181818181818');
select is((select count(*) from public.proyectos)::int, 1, 'alguien de fuera no puede borrarlo');

delete from public.proyectos where nombre = 'Lanzar';
select is((select count(*) from public.proyectos)::int, 0, 'quien lo creó sí');
select is((select proyecto_id from public.tareas where titulo = 'Propuesta'), null, 'sus tasks se quedan, sin proyecto');

select * from finish();
rollback;
