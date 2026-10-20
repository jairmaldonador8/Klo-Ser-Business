begin;
select plan(8);

select pruebas.crear_usuario('14141414-1414-1414-1414-141414141414', 'a@prueba.mx', 'Ari');
select pruebas.crear_usuario('14141414-1414-1414-1414-141414141415', 'z@prueba.mx', 'Zoe');
select pruebas.autenticar_como('14141414-1414-1414-1414-141414141414');
select set_config('pruebas.esp', public.crear_espacio('Uno', 'U', 'uno', 0)::text, true);
with x as (
  insert into public.tareas (espacio_id, titulo, fecha, hora) values (current_setting('pruebas.esp')::uuid, 'Junta', '2026-10-20', '16:00') returning id
) select set_config('pruebas.t', id::text, true) from x;

select is((select aviso_min from public.tareas where id = current_setting('pruebas.t')::uuid), 10, 'avisa 10 min antes por defecto');
select lives_ok($$ update public.tareas set aviso_min = 30 where id = current_setting('pruebas.t')::uuid $$, 'cambia su aviso');
select throws_ok($$ update public.tareas set avisado_en = now() where id = current_setting('pruebas.t')::uuid $$,
  '42501', null, 'no puede marcar avisado_en');
select throws_ok($$ update public.tareas set aviso_min = 2000 where id = current_setting('pruebas.t')::uuid $$,
  '23514', null, 'aviso con tope de un día');

reset role;
update public.tareas set avisado_en = now() where id = current_setting('pruebas.t')::uuid;
select pruebas.autenticar_como('14141414-1414-1414-1414-141414141414');
update public.tareas set hora = '17:00' where id = current_setting('pruebas.t')::uuid;
select is((select avisado_en from public.tareas where id = current_setting('pruebas.t')::uuid), null, 'mover la hora vuelve a avisar');

select lives_ok($$ insert into public.push_suscripciones (endpoint, p256dh, auth) values ('https://web.push.apple.com/x', 'p', 'a') $$, 'guarda su dispositivo');
select lives_ok($$ insert into public.avisos (texto, enviar_en) values ('Llamar a Ana', now()) $$, 'programa un aviso');

select pruebas.autenticar_como('14141414-1414-1414-1414-141414141415');
select is((select count(*) from public.avisos)::int + (select count(*) from public.push_suscripciones)::int, 0, 'otra persona no ve tus avisos ni dispositivos');

select * from finish();
rollback;
