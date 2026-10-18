begin;
select plan(4);

select pruebas.crear_usuario('88888888-8888-8888-8888-888888888888', 'h@prueba.mx', 'Hilda');
select pruebas.crear_usuario('99999999-9999-9999-9999-999999999999', 'i@prueba.mx', 'Iván');

select pruebas.autenticar_como('88888888-8888-8888-8888-888888888888');
select public.crear_espacio('Ventas', 'V', 'ventas', 0);
insert into public.proyectos (espacio_id, nombre, modo_avance, cifra_meta)
  values ((select id from public.espacios where atajo = 'ventas'), 'Cien clientes', 'manual', 100);
-- El id se guarda antes de cambiar de usuario: luego RLS lo oculta.
select set_config('pruebas.proyecto', (select id::text from public.proyectos where nombre = 'Cien clientes'), false);

-- Dos toques seguidos suman los dos
select public.sumar_cifra(current_setting('pruebas.proyecto')::uuid, 1);
select public.sumar_cifra(current_setting('pruebas.proyecto')::uuid, 1);
select is((select cifra_actual from public.proyectos where nombre = 'Cien clientes'), 2::numeric, 'dos +1 seguidos dan 2');

-- Restar de más se queda en cero
select public.sumar_cifra(current_setting('pruebas.proyecto')::uuid, -5);
select is((select cifra_actual from public.proyectos where nombre = 'Cien clientes'), 0::numeric, 'restar de más no baja de cero');
select public.sumar_cifra(current_setting('pruebas.proyecto')::uuid, 3);

-- Otra persona no le suma a un proyecto ajeno
select pruebas.autenticar_como('99999999-9999-9999-9999-999999999999');
select lives_ok($$ select public.sumar_cifra(current_setting('pruebas.proyecto')::uuid, 50) $$, 'llamarla en ajeno no truena');
select pruebas.autenticar_como('88888888-8888-8888-8888-888888888888');
select is((select cifra_actual from public.proyectos where nombre = 'Cien clientes'), 3::numeric, 'pero no cambia nada');

select * from finish();
rollback;
