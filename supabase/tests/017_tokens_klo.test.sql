begin;
select plan(3);

select pruebas.crear_usuario('17171717-1717-1717-1717-171717171717', 'k17@prueba.mx', 'Kai');
select pruebas.autenticar_como('17171717-1717-1717-1717-171717171717');

select lives_ok($$ insert into public.klo_mensajes (sesion, rol, texto, tokens_entrada, tokens_salida, tokens_cache_leidos, tokens_cache_escritos)
  values (gen_random_uuid(), 'klo', 'ok', 900, 40, 3000, 0) $$, 'guarda los tokens de la respuesta');
select is((select tokens_entrada + tokens_salida from public.klo_mensajes), 940, 'se leen de vuelta');
select throws_ok($$ update public.klo_mensajes set tokens_salida = 1 $$, '42501', null, 'no se pueden editar después');

select * from finish();
rollback;
