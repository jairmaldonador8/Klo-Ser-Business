begin;
select plan(3);

select pruebas.crear_usuario('19191919-1919-1919-1919-191919191919', 'a19@prueba.mx', 'Ana');
select pruebas.crear_usuario('19191919-1919-1919-1919-191919191918', 'b19@prueba.mx', 'Beto');
select pruebas.autenticar_como('19191919-1919-1919-1919-191919191919');
select public.crear_espacio('Uno', 'U', 'uno19', 0);
insert into public.notas (espacio_id, texto) values ((select id from public.espacios where atajo = 'uno19'), 'Idea: podcast');

select is((select posible_tarea from public.notas), false, 'una nota nace sin marca');
select lives_ok($$ update public.notas set posible_tarea = true $$, 'la marco como posible task');

select pruebas.autenticar_como('19191919-1919-1919-1919-191919191918');
update public.notas set posible_tarea = false;
select pruebas.autenticar_como('19191919-1919-1919-1919-191919191919');
select is((select posible_tarea from public.notas), true, 'alguien de fuera no la cambia');

select * from finish();
rollback;
