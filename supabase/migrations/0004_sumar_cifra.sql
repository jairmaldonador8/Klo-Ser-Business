-- 0004 · +1 atómico: varios toques rápidos en el iPhone no deben pisarse.
create function public.sumar_cifra(p_id uuid, p_delta numeric) returns void
language sql security invoker set search_path = '' as $$
  update public.proyectos set cifra_actual = greatest(0, cifra_actual + p_delta) where id = p_id;
$$;
revoke execute on function public.sumar_cifra(uuid, numeric) from public, anon;
grant execute on function public.sumar_cifra(uuid, numeric) to authenticated;
