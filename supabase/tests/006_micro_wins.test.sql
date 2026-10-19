begin;
select plan(7);

select pruebas.crear_usuario('77777777-7777-7777-7777-777777777777', 'g@prueba.mx', 'Gabi');
select pruebas.crear_usuario('88888888-8888-8888-8888-888888888888', 'h@prueba.mx', 'Hugo');

select pruebas.autenticar_como('77777777-7777-7777-7777-777777777777');
select lives_ok($$ insert into public.micro_wins (nombre) values ('Wake up early') $$, 'cada quien crea sus micro wins');
select set_config('pruebas.mw', (select id::text from public.micro_wins where nombre = 'Wake up early'), true);
select lives_ok($$ insert into public.micro_wins_hechos (micro_win_id, fecha) values (current_setting('pruebas.mw')::uuid, current_date) $$,
  'se palomea hoy');
select throws_ok($$ insert into public.micro_wins_hechos (micro_win_id, fecha) values (current_setting('pruebas.mw')::uuid, current_date) $$,
  '23505', null, 'una vez por día');
select throws_ok($$ insert into public.micro_wins (nombre) values ('  ') $$, '23514', null, 'el nombre no va vacío');

-- Hugo no ve ni palomea lo de Gabi
select pruebas.autenticar_como('88888888-8888-8888-8888-888888888888');
select is((select count(*) from public.micro_wins)::int, 0, 'no ve micro wins ajenos');
select is((select count(*) from public.micro_wins_hechos)::int, 0, 'no ve lo hecho ajeno');
select throws_ok($$ insert into public.micro_wins_hechos (micro_win_id, fecha) values (current_setting('pruebas.mw')::uuid, current_date - 1) $$,
  '42501', null, 'no palomea micro wins ajenos');

select * from finish();
rollback;
