begin;
select plan(5);

select pruebas.crear_usuario('cccccccc-cccc-cccc-cccc-cccccccccccc', 'l@prueba.mx', 'Lu');
select pruebas.crear_usuario('dddddddd-dddd-dddd-dddd-dddddddddddd', 'm@prueba.mx', 'Mau');
select pruebas.autenticar_como('cccccccc-cccc-cccc-cccc-cccccccccccc');
select set_config('pruebas.uno', public.crear_espacio('Uno', 'U', 'uno', 0)::text, true);
select set_config('pruebas.dos', public.crear_espacio('Dos', 'D', 'dos', 1)::text, true);

select lives_ok($$ insert into public.series (espacio_id, regla, inicio, generado_hasta)
  values (current_setting('pruebas.uno')::uuid, '{"freq":"semana","cada":1,"dias":[5]}', '2026-10-24', '2027-04-24') $$,
  'se crea una serie semanal');
select set_config('pruebas.serie', (select id::text from public.series limit 1), true);
select lives_ok($$ insert into public.tareas (espacio_id, titulo, fecha, serie_id)
  values (current_setting('pruebas.uno')::uuid, 'Train', '2026-10-24', current_setting('pruebas.serie')::uuid) $$,
  'una task de la serie');
select throws_ok($$ insert into public.tareas (espacio_id, titulo, fecha, serie_id)
  values (current_setting('pruebas.dos')::uuid, 'Mal', '2026-10-24', current_setting('pruebas.serie')::uuid) $$,
  'P0001', 'serie_de_otro_frente', 'no se cuelga de una serie de otro frente');
select throws_ok($$ insert into public.series (espacio_id, regla, inicio, generado_hasta)
  values (current_setting('pruebas.uno')::uuid, '{"cada":1}', '2026-10-24', '2026-10-24') $$,
  '23514', null, 'la regla necesita freq y cada');

select pruebas.autenticar_como('dddddddd-dddd-dddd-dddd-dddddddddddd');
select is((select count(*) from public.series)::int, 0, 'nadie ve series de frentes ajenos');

select * from finish();
rollback;
