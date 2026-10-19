-- 0008 · Wordmark de cada frente: su logo completo (ancho), que acompaña al lockup de Klo-Ser Business en Today.
-- Misma regla que el logo cuadrado (0007): ruta de la app o URL https.

alter table public.espacios
  add column logo_ancho text check (logo_ancho is null or logo_ancho ~ '^(/[a-z0-9/._-]+|https://\S+)$');

grant update (logo_ancho) on public.espacios to authenticated;
