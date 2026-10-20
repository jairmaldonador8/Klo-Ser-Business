-- 0013 y 0014 dieron permisos sin quitar antes los que Supabase pone por defecto en tablas nuevas:
-- se revoca todo y se vuelve a dar solo lo necesario (enviado_en, owner_id, texto… no se tocan).
revoke all on public.klo_memoria, public.klo_mensajes, public.push_suscripciones, public.avisos from anon, authenticated;

grant select, insert, delete on public.klo_memoria to authenticated;
grant select, insert on public.klo_mensajes to authenticated;
grant update (pendiente, deshecho_en, acciones) on public.klo_mensajes to authenticated;
grant select, insert, delete on public.push_suscripciones to authenticated;
grant update (p256dh, auth, agente) on public.push_suscripciones to authenticated;
grant select, insert, delete on public.avisos to authenticated;
