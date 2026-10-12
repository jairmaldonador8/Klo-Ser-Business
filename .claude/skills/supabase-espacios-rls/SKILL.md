---
name: supabase-espacios-rls
description: Use when writing Supabase migrations, RLS policies, auth/session code, or RLS tests for Klo-Ser Business's espacios/miembros multi-tenancy
---

# Supabase: espacios, RLS y sesión

## Overview
Todo dato de negocio cuelga de un `espacio`; solo lo ven sus `miembros`. La base lo garantiza
(RLS + grants), no el código de la app. Complementa `supabase:supabase` (oficial).

## When to Use
- Nueva migración `supabase/migrations/000N_….sql`
- Clientes de Supabase en servidor/navegador, `proxy.ts`, callback de auth
- Pruebas pgTAP

## Core Patterns

**Cada tabla de negocio:**
```sql
create table public.notas (
  id uuid primary key default gen_random_uuid(),
  espacio_id uuid not null references public.espacios (id) on delete cascade,
  texto text not null,
  creado_en timestamptz not null default now(),
  borrado_en timestamptz
);
create index notas_espacio_idx on public.notas (espacio_id);
alter table public.notas enable row level security;
grant select, insert, update, delete on public.notas to authenticated;  -- obligatorio desde 2026-10
create policy notas_select on public.notas for select to authenticated
  using ((select private.es_miembro(espacio_id)));
create policy notas_insert on public.notas for insert to authenticated
  with check ((select private.es_miembro(espacio_id)));
create policy notas_update on public.notas for update to authenticated
  using ((select private.es_miembro(espacio_id))) with check ((select private.es_miembro(espacio_id)));
create policy notas_delete on public.notas for delete to authenticated
  using ((select private.es_miembro(espacio_id)));
```

**Helper:** `private.es_miembro(uuid)` → `language sql stable security definer set search_path = ''`,
usa `(select auth.uid())`; `revoke execute … from public, anon`; `grant execute … to authenticated`;
`grant usage on schema private to authenticated`. Índice `miembros(user_id, espacio_id)`.

**Crear espacio:** RPC `public.crear_espacio(...)` `security definer`, revisa `auth.uid()`,
inserta espacio + miembro `dueno`, devuelve el id. Nunca `insert().select()` desde el cliente
(42501 por la policy de lectura).

**Secretos:** tablas en esquema `private` sin grants (tokens de Google, `correos_permitidos`);
solo el servidor con `sb_secret_…` o funciones `security definer`.

**Lista permitida:** hook *Before User Created* como función Postgres (`grant execute … to
supabase_auth_admin`), habilitado en `supabase/config.toml` `[auth.hook.before_user_created]`.

**Sesión (Next 16):** `@supabase/ssr` `createServerClient` con `cookies.getAll/setAll` por
petición; refrescar **solo** en `proxy.ts` con `getClaims()` y devolver ese mismo response.
Autorizar con `getClaims()`; nunca con `getSession()` en el servidor. Llaves
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`.

**Pruebas:** pgTAP en `supabase/tests/*.sql` con `basejump-supabase_test_helpers`
(`tests.create_supabase_user`, `tests.authenticate_as`), `supabase test db`. Por tabla: usuario B
no lee/inserta/actualiza/borra lo de A.

## Common Mistakes
- Olvidar el `grant` → errores de permiso aunque la policy esté bien.
- UPDATE sin policy de SELECT → actualiza 0 filas en silencio.
- `auth.uid()` sin `(select …)` → se evalúa por fila.
- Migraciones que editan otras ya aplicadas: siempre aditivas y numeradas.
- Nombres reales (Jair, clientes) en seeds versionados.
