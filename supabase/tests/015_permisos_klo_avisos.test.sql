begin;
select plan(4);

select pruebas.crear_usuario('15151515-1515-1515-1515-151515151515', 'p@prueba.mx', 'Pau');
select pruebas.autenticar_como('15151515-1515-1515-1515-151515151515');
insert into public.avisos (texto, enviar_en) values ('Llamar a Ana', now());
insert into public.klo_mensajes (sesion, rol, texto) values (gen_random_uuid(), 'klo', 'Listo');

select throws_ok($$ update public.avisos set enviado_en = now() $$, '42501', null, 'no puede marcar un aviso como enviado');
select throws_ok($$ update public.klo_mensajes set texto = 'otro' $$, '42501', null, 'no reescribe lo que dijo Klo');
select lives_ok($$ update public.klo_mensajes set deshecho_en = now() $$, 'sí puede deshacer');
set local role anon;
select throws_ok($$ select * from public.avisos $$, '42501', null, 'anon no lee avisos');

select * from finish();
rollback;
