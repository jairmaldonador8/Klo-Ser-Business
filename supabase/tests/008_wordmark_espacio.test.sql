begin;
select plan(2);

select pruebas.crear_usuario('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'j@prueba.mx', 'Juli');
select pruebas.autenticar_como('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
select public.crear_espacio('Uno', 'U', 'uno', 0);

select lives_ok($$ update public.espacios set logo_ancho = '/espacios/uno-wordmark.png' where atajo = 'uno' $$, 'la dueña pone su wordmark');
select throws_ok($$ update public.espacios set logo_ancho = 'data:image/png;base64,AAAA' where atajo = 'uno' $$, '23514', null, 'nada que no sea ruta o https');

select * from finish();
rollback;
