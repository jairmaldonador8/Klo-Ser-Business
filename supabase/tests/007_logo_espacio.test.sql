begin;
select plan(3);

select pruebas.crear_usuario('99999999-9999-9999-9999-999999999999', 'i@prueba.mx', 'Iris');
select pruebas.autenticar_como('99999999-9999-9999-9999-999999999999');
select public.crear_espacio('Uno', 'U', 'uno', 0);

select lives_ok($$ update public.espacios set logo = '/espacios/uno.svg' where atajo = 'uno' $$, 'la dueña pone una ruta de la app');
select lives_ok($$ update public.espacios set logo = 'https://cdn.example.com/logo.png' where atajo = 'uno' $$, 'o una URL https');
select throws_ok($$ update public.espacios set logo = 'javascript:alert(1)' where atajo = 'uno' $$, '23514', null, 'nada que no sea ruta o https');

select * from finish();
rollback;
