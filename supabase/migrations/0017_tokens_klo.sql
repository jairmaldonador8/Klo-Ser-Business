-- Cuántos tokens gastó Klo en cada respuesta (sumando todas las vueltas del bucle), para medir el costo.
alter table public.klo_mensajes
  add column tokens_entrada int not null default 0 check (tokens_entrada >= 0),
  add column tokens_salida int not null default 0 check (tokens_salida >= 0),
  add column tokens_cache_leidos int not null default 0 check (tokens_cache_leidos >= 0),
  add column tokens_cache_escritos int not null default 0 check (tokens_cache_escritos >= 0);
