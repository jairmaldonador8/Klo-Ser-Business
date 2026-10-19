begin;
select plan(2);

select pruebas.crear_usuario('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'n@prueba.mx', 'Nora');
select pruebas.autenticar_como('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee');
select set_config('pruebas.esp', public.crear_espacio('Uno', 'U', 'uno', 0)::text, true);

select lives_ok($$ insert into public.tareas (espacio_id, titulo, color) values (current_setting('pruebas.esp')::uuid, 'Pintada', 'menta') $$,
  'una task con color de la paleta');
select throws_ok($$ insert into public.tareas (espacio_id, titulo, color) values (current_setting('pruebas.esp')::uuid, 'Mal', 'verde-feo') $$,
  '23514', null, 'solo colores de la paleta');

select * from finish();
rollback;
