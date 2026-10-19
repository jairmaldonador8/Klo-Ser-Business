-- 0007 · Logo de cada frente: la marca (blanca, cuadrada) que sale en el riel, la barra y la apertura.
-- Hoy es una ruta pública de la app o una URL https; luego Ajustes podrá subirlo a Storage.

alter table public.espacios
  add column logo text check (logo is null or logo ~ '^(/[a-z0-9/._-]+|https://\S+)$');

-- La policy de update ya es solo dueños (0001); se abre la columna.
grant update (logo) on public.espacios to authenticated;
