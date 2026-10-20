begin;
select plan(6);

select pruebas.crear_usuario('13131313-1313-1313-1313-131313131313', 'k@prueba.mx', 'Kai');
select pruebas.crear_usuario('13131313-1313-1313-1313-131313131314', 'b@prueba.mx', 'Bea');
select pruebas.autenticar_como('13131313-1313-1313-1313-131313131313');

select lives_ok($$ update public.perfiles set klo_brief = 'Founder de Klo-Ser' where user_id = '13131313-1313-1313-1313-131313131313' $$,
  'escribe su brief');
select throws_ok($$ update public.perfiles set klo_brief = repeat('x', 4001) where user_id = '13131313-1313-1313-1313-131313131313' $$,
  '23514', null, 'el brief tiene tope de 4000');
select lives_ok($$ insert into public.klo_memoria (texto) values ('Ana es clienta de Top Digital') $$, 'guarda memoria');
select lives_ok($$ insert into public.klo_mensajes (sesion, rol, texto) values (gen_random_uuid(), 'usuario', 'hola') $$,
  'guarda un mensaje');

select pruebas.autenticar_como('13131313-1313-1313-1313-131313131314');
select is((select count(*) from public.klo_memoria)::int, 0, 'otra persona no ve tu memoria');
select throws_ok($$ insert into public.klo_memoria (owner_id, texto) values ('13131313-1313-1313-1313-131313131313', 'colada') $$,
  '42501', null, 'ni puede escribir en ella');

select * from finish();
rollback;
