begin;
select plan(9);

select pruebas.crear_usuario('44444444-4444-4444-4444-444444444444', 'd@prueba.mx', 'Dani');
select pruebas.crear_usuario('55555555-5555-5555-5555-555555555555', 'e@prueba.mx');

-- Color en ciclo al crear frentes
select pruebas.autenticar_como('44444444-4444-4444-4444-444444444444');
select public.crear_espacio('Uno', 'U', 'uno', 0);
select public.crear_espacio('Dos', 'D', 'dos', 1);
select public.crear_espacio('Tres', 'T', 'tres', 2);
select public.crear_espacio('Cuatro', 'C', 'cuatro', 3);
select public.crear_espacio('Cinco', 'C', 'cinco', 4);
select is((select array_agg(color order by orden) from public.espacios),
  array['azul', 'sol', 'rosa', 'violeta', 'azul'], 'cada frente nuevo toma el siguiente color en ciclo');

-- La dueña cambia el color; un valor fuera de la paleta no entra
select lives_ok($$ update public.espacios set color = 'rosa' where atajo = 'uno' $$, 'la dueña cambia el color');
select is((select color from public.espacios where atajo = 'uno'), 'rosa', 'el color quedó guardado');
select throws_ok($$ update public.espacios set color = 'verde' where atajo = 'uno' $$, '23514', null,
  'solo colores de la paleta');

-- La vista: objeto JSON, editable solo por su dueña
select is((select vista from public.perfiles where user_id = '44444444-4444-4444-4444-444444444444'), '{}'::jsonb,
  'la vista nace vacía');
select lives_ok($$ update public.perfiles set vista = '{"secciones":[{"id":"hoy","visible":true}]}'
  where user_id = '44444444-4444-4444-4444-444444444444' $$, 'cada quien guarda su vista');
select throws_ok($$ update public.perfiles set vista = '[]' where user_id = '44444444-4444-4444-4444-444444444444' $$,
  '23514', null, 'la vista siempre es un objeto');

-- Otra persona no toca ni el frente ni la vista ajena
select pruebas.autenticar_como('55555555-5555-5555-5555-555555555555');
update public.espacios set color = 'violeta' where atajo = 'dos';
update public.perfiles set vista = '{"x":1}' where user_id = '44444444-4444-4444-4444-444444444444';
select pruebas.autenticar_como('44444444-4444-4444-4444-444444444444');
select is((select color from public.espacios where atajo = 'dos'), 'sol', 'otra persona no cambia el color de un frente ajeno');
select isnt((select vista from public.perfiles where user_id = '44444444-4444-4444-4444-444444444444'), '{"x":1}'::jsonb,
  'nadie más cambia su vista');

select * from finish();
rollback;
