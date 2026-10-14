begin;
select plan(23);

select pruebas.crear_usuario('11111111-1111-1111-1111-111111111111', 'a@prueba.mx', 'Ana');
select pruebas.crear_usuario('22222222-2222-2222-2222-222222222222', 'b@prueba.mx');
select pruebas.crear_usuario('33333333-3333-3333-3333-333333333333', 'c@prueba.mx');

-- Perfil automático
select is((select nombre from public.perfiles where user_id = '11111111-1111-1111-1111-111111111111'), 'Ana',
  'cada usuario nuevo tiene perfil con su nombre de Google');

-- A crea su espacio
select pruebas.autenticar_como('11111111-1111-1111-1111-111111111111');
select lives_ok($$ select public.crear_espacio('Frente A', 'A', 'fa', 0) $$, 'A crea su espacio por RPC');
select set_config('pruebas.espacio_a', (select id::text from public.espacios limit 1), true);
select is((select count(*)::int from public.espacios), 1, 'A ve su espacio');
select is((select rol from public.miembros where user_id = '11111111-1111-1111-1111-111111111111'), 'dueno', 'A queda como dueña');
select throws_ok($$ select public.crear_espacio('Otro', 'O', 'fa', 1) $$, '23505', null, 'no repite atajo entre sus espacios');
select throws_ok($$ insert into public.espacios (nombre, inicial, atajo) values ('x', 'X', 'x') $$, '42501', null,
  'no se insertan espacios directo, solo por RPC');
select lives_ok($$ update public.perfiles set espacio_predeterminado_id = current_setting('pruebas.espacio_a')::uuid
  where user_id = '11111111-1111-1111-1111-111111111111' $$, 'A usa su espacio como predeterminado');

-- B no ve nada de A
select pruebas.autenticar_como('22222222-2222-2222-2222-222222222222');
select is((select count(*)::int from public.espacios), 0, 'B no ve espacios de A');
select is((select count(*)::int from public.miembros), 0, 'B no ve miembros de A');
select is((select count(*)::int from public.perfiles), 1, 'B solo ve su propio perfil');
select throws_ok($$ insert into public.miembros (espacio_id, user_id) values (current_setting('pruebas.espacio_a')::uuid,
  '22222222-2222-2222-2222-222222222222') $$, '42501', null, 'B no se mete al espacio de A');
update public.espacios set nombre = 'hackeado' where id = current_setting('pruebas.espacio_a')::uuid;
select throws_ok($$ update public.perfiles set espacio_predeterminado_id = current_setting('pruebas.espacio_a')::uuid
  where user_id = '22222222-2222-2222-2222-222222222222' $$, '42501', null, 'B no puede usar el espacio de A como predeterminado');

-- Bienvenida atómica
select lives_ok($$ select public.completar_bienvenida('Beto',
  '[{"nombre":"Uno","inicial":"U","atajo":"uno"},{"nombre":"Dos","inicial":"D","atajo":"dos"}]'::jsonb) $$,
  'la bienvenida crea los frentes de B');
select is((select count(*)::int from public.espacios), 2, 'B ve sus dos frentes');
select is((select e.atajo from public.perfiles p join public.espacios e on e.id = p.espacio_predeterminado_id
  where p.user_id = '22222222-2222-2222-2222-222222222222'), 'uno', 'el primer frente queda como predeterminado');

-- Compartir: A invita a B
select pruebas.autenticar_como('11111111-1111-1111-1111-111111111111');
select lives_ok($$ insert into public.miembros (espacio_id, user_id) values (current_setting('pruebas.espacio_a')::uuid,
  '22222222-2222-2222-2222-222222222222') $$, 'la dueña invita a B a su espacio');
select pruebas.autenticar_como('22222222-2222-2222-2222-222222222222');
select is((select count(*)::int from public.espacios), 3, 'B ya ve el espacio compartido');
select throws_ok($$ insert into public.miembros (espacio_id, user_id) values (current_setting('pruebas.espacio_a')::uuid,
  '33333333-3333-3333-3333-333333333333') $$, '42501', null, 'un miembro que no es dueño no da de alta miembros');
delete from public.espacios where id = current_setting('pruebas.espacio_a')::uuid;
delete from public.miembros where user_id = '11111111-1111-1111-1111-111111111111';

-- anon no hace nada
reset role;
select set_config('request.jwt.claims', '', true);
set local role anon;
select throws_ok($$ select public.crear_espacio('x', 'X', 'x', 0) $$, '42501', null, 'anon no crea espacios');
reset role;

-- B no pudo renombrar el espacio de A (se revisa como postgres)
select is((select nombre from public.espacios where id = current_setting('pruebas.espacio_a')::uuid), 'Frente A',
  'B no pudo renombrar ni borrar el espacio de A');
select is((select count(*)::int from public.miembros where espacio_id = current_setting('pruebas.espacio_a')::uuid
  and user_id = '11111111-1111-1111-1111-111111111111'), 1, 'B no pudo sacar a la dueña de su espacio');

-- Lista permitida
insert into private.correos_permitidos (correo) values ('si@prueba.mx');
select is(public.hook_lista_permitida('{"user":{"email":"SI@prueba.mx"}}'::jsonb), '{}'::jsonb,
  'el hook deja pasar un correo permitido (sin importar mayúsculas)');
select is(public.hook_lista_permitida('{"user":{"email":"nadie@prueba.mx"}}'::jsonb) -> 'error' ->> 'http_code', '403',
  'el hook rechaza un correo que no está en la lista');

select * from finish();
rollback;
