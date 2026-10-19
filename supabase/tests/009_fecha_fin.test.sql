begin;
select plan(4);

select pruebas.crear_usuario('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'k@prueba.mx', 'Karla');
select pruebas.autenticar_como('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
select set_config('pruebas.esp', public.crear_espacio('Uno', 'U', 'uno', 0)::text, true);

select lives_ok($$ insert into public.tareas (espacio_id, titulo, fecha, hora, fecha_fin, hora_fin)
  values (current_setting('pruebas.esp')::uuid, 'Viaje', '2026-10-19', '17:00', '2026-10-20', '16:00') $$,
  'lunes 5 pm a martes 4 pm: la hora de fin puede ser menor si termina otro día');
select throws_ok($$ insert into public.tareas (espacio_id, titulo, fecha, hora, hora_fin)
  values (current_setting('pruebas.esp')::uuid, 'Mal', '2026-10-19', '17:00', '16:00') $$,
  '23514', null, 'el mismo día, el fin va después del inicio');
select throws_ok($$ insert into public.tareas (espacio_id, titulo, fecha, fecha_fin)
  values (current_setting('pruebas.esp')::uuid, 'Mal', '2026-10-19', '2026-10-18') $$,
  '23514', null, 'la fecha de fin va después de la de inicio');
select throws_ok($$ insert into public.tareas (espacio_id, titulo, fecha, fecha_fin)
  values (current_setting('pruebas.esp')::uuid, 'Mal', '2026-10-19', '2026-10-19') $$,
  '23514', null, 'si termina el mismo día, fecha_fin va vacía');

select * from finish();
rollback;
