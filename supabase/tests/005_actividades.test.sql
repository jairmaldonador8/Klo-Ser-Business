begin;
select plan(5);

select pruebas.crear_usuario('66666666-6666-6666-6666-666666666666', 'f@prueba.mx', 'Fer');
select pruebas.autenticar_como('66666666-6666-6666-6666-666666666666');
select set_config('pruebas.esp', public.crear_espacio('Uno', 'U', 'uno', 0)::text, true);

select lives_ok($$ insert into public.tareas (espacio_id, titulo, clase) values (current_setting('pruebas.esp')::uuid, 'Pierna', 'entreno') $$,
  'entreno es una actividad válida');
select lives_ok($$ insert into public.tareas (espacio_id, titulo, clase) values (current_setting('pruebas.esp')::uuid, 'Revisión', 'Amozurrutia') $$,
  'una actividad propia entra con su nombre');
select throws_ok($$ insert into public.tareas (espacio_id, titulo, clase) values (current_setting('pruebas.esp')::uuid, 'x', '   ') $$,
  '23514', null, 'la actividad no puede ir vacía');
select lives_ok($$ update public.perfiles set actividades = array['Amozurrutia'] where user_id = '66666666-6666-6666-6666-666666666666' $$,
  'cada quien guarda sus actividades');
select is((select actividades from public.perfiles where user_id = '66666666-6666-6666-6666-666666666666'), array['Amozurrutia'],
  'las actividades quedan en el perfil');

select * from finish();
rollback;
