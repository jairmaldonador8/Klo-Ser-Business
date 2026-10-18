begin;
select plan(16);

select pruebas.crear_usuario('66666666-6666-6666-6666-666666666666', 'f@prueba.mx', 'Fer');
select pruebas.crear_usuario('77777777-7777-7777-7777-777777777777', 'g@prueba.mx', 'Gabo');

select pruebas.autenticar_como('66666666-6666-6666-6666-666666666666');
select public.crear_espacio('Uno', 'U', 'uno', 0);
select public.crear_espacio('Dos', 'D', 'dos', 1);
-- Los ids se guardan antes de cambiar de usuario: luego RLS los oculta.
select set_config('pruebas.uno', (select id::text from public.espacios where atajo = 'uno'), false);
select set_config('pruebas.dos', (select id::text from public.espacios where atajo = 'dos'), false);

-- Proyecto y tarea en el espacio propio
select lives_ok($$ insert into public.proyectos (espacio_id, nombre, modo_avance)
  values (current_setting('pruebas.uno')::uuid, 'Lanzar', 'tareas') $$, 'creo un proyecto en mi frente');
select lives_ok($$ insert into public.tareas (espacio_id, titulo, fecha, proyecto_id)
  values (current_setting('pruebas.uno')::uuid, 'Mandar propuesta', current_date, (select id from public.proyectos where nombre = 'Lanzar')) $$,
  'creo una tarea ligada al proyecto');
select is((select responsable_id from public.tareas where titulo = 'Mandar propuesta'),
  '66666666-6666-6666-6666-666666666666'::uuid, 'el responsable por defecto es quien la crea');
select is((select origen from public.tareas where titulo = 'Mandar propuesta'), 'manual', 'origen manual por defecto');

-- Reglas de la tarea
select throws_ok($$ insert into public.tareas (espacio_id, titulo, hora)
  values (current_setting('pruebas.uno')::uuid, 'Sin fecha', '10:00') $$, '23514', null, 'la hora exige fecha');
select throws_ok($$ insert into public.tareas (espacio_id, titulo, fecha, hora, hora_fin)
  values (current_setting('pruebas.uno')::uuid, 'Al revés', current_date, '10:00', '09:00') $$, '23514', null,
  'la hora fin va después de la hora');
select throws_ok($$ insert into public.tareas (espacio_id, titulo, clase, fecha)
  values (current_setting('pruebas.uno')::uuid, 'Junta sin hora', 'junta', current_date) $$, '23514', null,
  'una junta exige hora');
select throws_ok($$ insert into public.tareas (espacio_id, titulo, proyecto_id)
  values (current_setting('pruebas.dos')::uuid, 'Cruzada', (select id from public.proyectos where nombre = 'Lanzar')) $$,
  'P0001', null, 'el proyecto debe ser del mismo frente');
select throws_ok($$ insert into public.tareas (espacio_id, titulo)
  values (current_setting('pruebas.uno')::uuid, '   ') $$, '23514', null, 'el título no va vacío');

-- Nota y borrado suave
select lives_ok($$ insert into public.notas (espacio_id, texto) values (current_setting('pruebas.uno')::uuid, 'Idea suelta') $$,
  'creo una nota');
select lives_ok($$ update public.tareas set borrado_en = now() where titulo = 'Mandar propuesta' $$, 'borro suave una tarea');
select throws_ok($$ delete from public.tareas $$, '42501', null, 'nadie borra en duro');

-- Otra persona no ve ni toca nada
select pruebas.autenticar_como('77777777-7777-7777-7777-777777777777');
select is((select count(*)::int from public.tareas) + (select count(*)::int from public.proyectos) + (select count(*)::int from public.notas),
  0, 'otra persona no lee tareas, proyectos ni notas ajenas');
-- Con un responsable que sí es miembro, para que el trigger pase y lo frene RLS.
select throws_ok($$ insert into public.tareas (espacio_id, titulo, responsable_id)
  values (current_setting('pruebas.uno')::uuid, 'Intrusa', '66666666-6666-6666-6666-666666666666') $$,
  '42501', null, 'ni inserta en un frente ajeno');
update public.notas set texto = 'hackeada';
select pruebas.autenticar_como('66666666-6666-6666-6666-666666666666');
select is((select texto from public.notas limit 1), 'Idea suelta', 'ni actualiza notas ajenas');
select is((select count(*)::int from public.tareas), 1, 'la tarea borrada sigue en la base');

select * from finish();
rollback;
