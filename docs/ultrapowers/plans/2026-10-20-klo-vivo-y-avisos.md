# Klo vivo + avisos — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use ultrapowers:subagent-driven-development (recommended) or ultrapowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Klo responde y actúa con Claude (Haiku 5.5) sobre el panorama de Jair, y la app manda push al iPhone (antes de cada task, resumen 8:00, avisos de Klo).

**Architecture:** `POST /api/klo` corre un bucle manual de herramientas con `@anthropic-ai/sdk`; las herramientas son funciones de `lib/klo/acciones.ts` que reciben el cliente Supabase de la sesión (RLS). Los avisos: service worker + `web-push`; `GET /api/avisos/enviar` (secreto) lo llama `pg_cron` cada minuto y usa el cliente de servicio; qué enviar lo deciden funciones puras en `lib/avisos/calcular.ts`.

**Tech Stack:** Next 16 (App Router), Supabase (RLS, pg_cron, pg_net, Vault), `@anthropic-ai/sdk`, `web-push` 3.6.x, zod 4, Vitest, Playwright.

**Skills de apoyo:** @claude-api (bucle manual, caching), @supabase (migraciones, cron), @nextjs, @testing-tdd, @typescript-best-practices. Spec: `docs/ultrapowers/specs/2026-10-20-klo-vivo-y-avisos-design.md`. Investigación: `docs/ultrapowers/research/2026-10-20-klo-vivo-y-avisos-brief.md`.

**Commits:** auto-commit y auto-push encendidos (`.claude/ultrapowers-preferences.json`): commit al cerrar cada task, push al cerrar cada parte.

---

## Mapa de archivos

| Archivo | Responsabilidad |
| --- | --- |
| `supabase/migrations/0013_klo.sql` + `supabase/tests/013_klo.test.sql` | brief, memoria, mensajes; RLS y grants |
| `supabase/migrations/0014_avisos.sql` + `supabase/tests/014_avisos.test.sql` | aviso_min/avisado_en, resumen, suscripciones, avisos |
| `supabase/migrations/0015_cron_avisos.sql` | job pg_cron (lee URL y secreto de Vault) |
| `src/lib/fechas.ts` (+test) | `instanteEn(fecha, hora, zona)` |
| `src/lib/klo/panorama.ts` (+test) | arma el texto del panorama en vivo (puro) |
| `src/lib/klo/herramientas.ts` (+test) | definiciones de tools (zod → JSON schema), regla de conteo/confirmación |
| `src/lib/klo/acciones.ts` | ejecuta cada tool con el cliente Supabase y devuelve `{resultado, deshacer}` |
| `src/lib/klo/deshacer.ts` (+test) | arma y aplica el deshacer |
| `src/lib/klo/sistema.ts` | instrucciones fijas de Klo |
| `src/lib/klo/conversar.ts` | bucle con Claude (inyectable para pruebas) |
| `src/app/api/klo/route.ts` | POST: sesión, contexto, bucle, guardar mensajes; caída a nota |
| `src/app/api/klo/confirmar/route.ts`, `deshacer/route.ts` | confirmar pendientes / deshacer un mensaje |
| `src/components/klo/panel-klo.tsx`, `campo-klo.tsx` | panel de conversación y campo de la barra (⌘K) |
| `src/app/(app)/ajustes/klo-brief.tsx`, `notificaciones.tsx` | brief + memoria; push |
| `src/lib/avisos/calcular.ts` (+test) | qué tasks/resúmenes/avisos tocan (puro) |
| `src/lib/avisos/enviar.ts` | web-push + limpieza de suscripciones muertas |
| `src/lib/supabase/servicio.ts` | cliente con la secret key (solo servidor) |
| `src/app/api/avisos/enviar/route.ts` | endpoint del cron |
| `src/app/api/avisos/suscribir/route.ts` | guarda/quita suscripción |
| `public/sw.js`, `src/components/avisos/registrar-sw.tsx` | service worker y registro |
| `src/components/hoja/hoja-tarea.tsx` | campo «Alert» |

---

## Parte 0 — Estabilidad

### Task 0: Arreglar lo que reporte la auditoría

- [ ] Auditoría (agente en paralelo): logs de runtime de Vercel 48 h (API REST, `VERCEL_TOKEN`),
  `npm run build`, e2e por proyecto (uno a la vez), paso manual en 390 px y escritorio.
- [ ] Por cada falla: reproducir, escribir prueba si aplica (@systematic-debugging), arreglar.
- [ ] `npm test && npm run lint && npx tsc --noEmit` en verde. Commit `fix: …` por falla.

## Parte 1 — Datos

### Task 1: Migración 0013_klo

**Files:** Create `supabase/migrations/0013_klo.sql`, `supabase/tests/013_klo.test.sql`

- [ ] **Test primero** (`013_klo.test.sql`, mismo formato que `011_color_tarea.test.sql`, `plan(6)`):
  usuario A escribe `klo_brief` en su perfil (lives_ok); inserta en `klo_memoria` y `klo_mensajes`
  (lives_ok); brief > 4000 → `23514`; usuario B no ve la memoria de A (`is(count, 0)`); B no puede
  insertar memoria con `owner_id` de A (`42501`).
- [ ] **Migración:**

```sql
-- Klo vivo: lo que Jair le cuenta (brief), lo que Klo aprende (memoria) y la conversación.
alter table public.perfiles
  add column klo_brief text check (klo_brief is null or char_length(klo_brief) <= 4000);
grant update (klo_brief) on public.perfiles to authenticated;

create table public.klo_memoria (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  texto text not null check (char_length(trim(texto)) between 1 and 300),
  creado_en timestamptz not null default now()
);
create index klo_memoria_owner_idx on public.klo_memoria (owner_id, creado_en);

create table public.klo_mensajes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  sesion uuid not null,
  rol text not null check (rol in ('usuario', 'klo')),
  texto text not null check (char_length(texto) <= 8000),
  acciones jsonb not null default '[]'::jsonb,
  pendiente jsonb,
  deshecho_en timestamptz,
  creado_en timestamptz not null default now()
);
create index klo_mensajes_sesion_idx on public.klo_mensajes (owner_id, sesion, creado_en);

alter table public.klo_memoria enable row level security;
alter table public.klo_mensajes enable row level security;
create policy klo_memoria_duenio on public.klo_memoria for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy klo_mensajes_duenio on public.klo_mensajes for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
grant select, insert, delete on public.klo_memoria to authenticated;
grant select, insert on public.klo_mensajes to authenticated;
grant update (pendiente, deshecho_en, acciones) on public.klo_mensajes to authenticated;
```

- [ ] Aplicar: `npx supabase db push` (proyecto enlazado) → `npm run test:db` (todo ok) → `npm run db:tipos`.
- [ ] Commit `feat(db): 0013 — brief, memoria y mensajes de Klo`.

### Task 2: Migración 0014_avisos

**Files:** Create `supabase/migrations/0014_avisos.sql`, `supabase/tests/014_avisos.test.sql`

- [ ] **Test primero** (`plan(7)`): task nueva tiene `aviso_min = 10`; usuario puede cambiar
  `aviso_min` (lives_ok) pero no `avisado_en` (`42501`); con `avisado_en` puesto (como postgres),
  cambiar `hora` lo deja en null; `aviso_min` 2000 → `23514`; suscripción y aviso propios entran;
  B no ve los de A.
- [ ] **Migración:**

```sql
-- Avisos push: antes de cada task, resumen de la mañana y avisos que programa Klo.
alter table public.tareas
  add column aviso_min int default 10 check (aviso_min is null or aviso_min between 0 and 1440),
  add column avisado_en timestamptz;
grant update (aviso_min) on public.tareas to authenticated;

create function private.limpiar_avisado() returns trigger language plpgsql as $$
begin
  if new.fecha is distinct from old.fecha or new.hora is distinct from old.hora
     or new.aviso_min is distinct from old.aviso_min then
    new.avisado_en := null;
  end if;
  return new;
end $$;
create trigger tareas_limpiar_avisado before update on public.tareas
  for each row execute function private.limpiar_avisado();

alter table public.perfiles
  add column resumen_hora time default '08:00',
  add column resumen_enviado date;
grant update (resumen_hora) on public.perfiles to authenticated;

create table public.push_suscripciones (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  endpoint text not null unique check (endpoint ~ '^https://'),
  p256dh text not null,
  auth text not null,
  agente text,
  creado_en timestamptz not null default now()
);
create table public.avisos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  texto text not null check (char_length(trim(texto)) between 1 and 200),
  url text check (url is null or url ~ '^/'),
  tarea_id uuid references public.tareas (id) on delete cascade,
  enviar_en timestamptz not null,
  enviado_en timestamptz,
  creado_en timestamptz not null default now()
);
create index avisos_pendientes_idx on public.avisos (enviar_en) where enviado_en is null;
create index tareas_aviso_idx on public.tareas (fecha)
  where avisado_en is null and hora is not null and aviso_min is not null
    and borrado_en is null and completada_en is null;

alter table public.push_suscripciones enable row level security;
alter table public.avisos enable row level security;
create policy push_duenio on public.push_suscripciones for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy avisos_duenio on public.avisos for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
grant select, insert, delete on public.push_suscripciones to authenticated;
grant select, insert, delete on public.avisos to authenticated;
```

  Nota: `private.limpiar_avisado` corre como trigger (no necesita grant). Si el schema `private`
  da problema de permisos al disparar, declararla `security definer set search_path = ''`.
- [ ] `npx supabase db push` → `npm run test:db` → `npm run db:tipos`. Commit `feat(db): 0014 — avisos push`.

### Task 2b: 0015 — revocar permisos por defecto (hecho)

0013/0014 olvidaron `revoke all … from anon, authenticated` (patrón de 0003/0010). `0015_permisos_klo_avisos.sql`
revoca y vuelve a dar solo lo necesario; prueba `015_permisos_klo_avisos.test.sql`. El cron pasa a **0016**.

### Task 2c: `aviso_min` en esquema y columnas (antes de Klo)

- [ ] `esquemaTarea` acepta `aviso_min` (`null | 0..1440`, opcional); `COLUMNAS` de `src/lib/datos.ts`
  y el tipo `Tarea` lo incluyen. Tests de esquema. (La UI del campo sigue en Task 14.)

## Parte 2 — Klo

### Task 3: `instanteEn` (fecha+hora en zona → Date)

**Files:** Modify `src/lib/fechas.ts`; Test `src/lib/fechas.test.ts`

- [ ] Tests: `instanteEn('2026-10-20','16:00','America/Monterrey').toISOString() === '2026-10-20T22:00:00.000Z'`
  (CST −6); `'2026-07-01','09:30','America/New_York'` → `13:30Z`; acepta `HH:MM:SS`.
- [ ] Implementación: tomar la fecha como si fuera UTC, calcular el desfase de la zona en ese
  instante con `Intl.DateTimeFormat(..., {timeZone, hourCycle:'h23', year..second})`, restar; repetir
  una vez para cruzar cambios de horario.
- [ ] `npx vitest run src/lib/fechas.test.ts` PASS. Commit.

### Task 4: Panorama en vivo

**Files:** Create `src/lib/klo/panorama.ts`, `src/lib/klo/panorama.test.ts`

Interfaz:

```ts
export type DatosPanorama = {
  ahora: Date; zona: string; nombre: string | null
  espacios: { id: string; nombre: string; atajo: string }[]
  predeterminado: string | null
  proyectos: { id: string; nombre: string; espacio_id: string; fecha_meta: string | null }[]
  actividades: string[]
  tareas: Tarea[] // de leerMisTareas
}
export function armarPanorama(d: DatosPanorama): string
```

- [ ] Tests: incluye «Now: Tue Oct 20 2026, 09:40 (America/Monterrey)»; lista spaces con id;
  tasks vencidas marcadas «overdue»; solo tasks no hechas con fecha ≤ hoy+14 o sin fecha (tope 80,
  ordenadas por fecha/hora, sin fecha al final); proyectos con meta; ids completos.
- [ ] Implementar como texto compacto por líneas (`- [id] title · space · date time–end · class`). PASS. Commit.

### Task 5: Herramientas y regla de confirmación

**Files:** Create `src/lib/klo/herramientas.ts`, `src/lib/klo/herramientas.test.ts`

- [ ] Esquemas zod por tool (`buscar`, `crear_task`, `cambiar_task`, `completar_task`, `borrar_task`,
  `crear_nota`, `programar_aviso`, `recordar`) y `HERRAMIENTAS: Anthropic.Tool[]` con
  `input_schema` de `z.toJSONSchema(esquema)` (sin `$schema`), `strict: true`.
- [ ] `export function decidir(nombre, escriturasHechas): 'ejecutar' | 'retener'` — `buscar` siempre
  ejecuta; `borrar_task` siempre retiene; otras escrituras ejecutan si `escriturasHechas < 3`.
- [ ] Tests de `decidir` (3 ejecutan, la 4.ª retiene, borrar retiene, buscar no cuenta) y de los
  esquemas (fecha mal → error, hora `16:00` ok). PASS. Commit.

### Task 6: Acciones y deshacer

**Files:** Create `src/lib/klo/acciones.ts`, `src/lib/klo/deshacer.ts`, `src/lib/klo/deshacer.test.ts`

- [ ] `ejecutar(supabase, ctx, nombre, input) → { texto: string; deshacer?: Deshacer; resumen?: string }`.
  `ctx = { userId, espacios: Set<string>, predeterminado, zona, hoy }`.
  - `crear_task`: completa espacio (predeterminado si falta o no es suyo), valida con
    `esquemaTarea`, inserta con `origen: 'klo'`; deshacer = `{tipo:'borrar_tarea', id}`.
  - `cambiar_task`: lee la fila (si no existe → texto «unknown id»), guarda los campos anteriores,
    valida el resultado combinado con `esquemaTarea`, actualiza (series: solo esa fila);
    deshacer = `{tipo:'restaurar_tarea', id, campos}`.
  - `completar_task`, `borrar_task` (suave), `crear_nota`, `programar_aviso` (convierte
    fecha+hora con `instanteEn`), `recordar`, `buscar` (ilike en título + rango).
  - `resumen` = chip corto en inglés («Moved · Ana call → Thu 4:00 PM»).
- [ ] `deshacer.ts`: `aplicarDeshacer(supabase, lista)` en orden inverso. Test con un cliente falso
  que registra llamadas (orden inverso, cada tipo genera el update correcto). PASS. Commit.

### Task 7: Bucle con Claude

**Files:** Create `src/lib/klo/sistema.ts`, `src/lib/klo/conversar.ts`, `src/lib/klo/conversar.test.ts`; `npm i @anthropic-ai/sdk`

- [ ] `conversar({ cliente, sistemaFijo, panorama, historia, texto, ejecutarTool })` →
  `{ respuesta, acciones: {nombre, input, resumen, deshacer}[], pendientes: {nombre, input}[] }`.
  - `system: [{type:'text', text: sistemaFijo, cache_control:{type:'ephemeral'}}, {type:'text', text: panorama}]`
  - `model: 'claude-haiku-5-5'`, `max_tokens: 2000`, `output_config: { effort: 'low' }`, `tools: HERRAMIENTAS`.
  - Bucle ≤ 6 vueltas: por cada `tool_use`, `decidir(...)`; ejecuta o retiene («held for
    confirmation — ask Jair to confirm»); todos los `tool_result` en un solo mensaje `user`;
    `is_error: true` si falla. Termina en `end_turn`. Revisa `stop_reason === 'refusal'`.
  - Tope 20 s con `AbortSignal.timeout(20_000)` pasado como opción de la petición.
- [ ] Test con cliente falso (`messages.create` devuelve guion): 1 tool + respuesta → 1 acción;
  5 `crear_task` → 3 acciones + 2 pendientes; error en tool → `is_error` y sigue. PASS. Commit.

### Task 8: Rutas de Klo

**Files:** Create `src/app/api/klo/route.ts`, `src/app/api/klo/confirmar/route.ts`, `src/app/api/klo/deshacer/route.ts`

- [ ] El brief y la memoria van en el bloque `system` fijo con `cache_control` (después de las
  instrucciones); el panorama va en un segundo bloque sin caché.
- [ ] `POST /api/klo` `{texto, sesion}`: sesión (401 si no), lee perfil (brief, zona,
  predeterminado, nombre, actividades), espacios, proyectos activos, `leerMisTareas()`, memoria,
  últimos 20 mensajes de la sesión; guarda mensaje del usuario; llama `conversar`; guarda mensaje
  de Klo con `acciones` (sin `input` grande) y `pendiente`; responde
  `{id, respuesta, acciones:[{resumen}], pendientes:[{resumen}]}`. `export const maxDuration = 30`.
  Sin `ANTHROPIC_API_KEY` o error sin acciones → crea nota en el predeterminado y responde
  «I didn’t quite get that — saved it in Notes.» (`caida: true`). Sin llave: «Klo is offline — saved
  it in Notes.». Si falla **después** de ejecutar acciones: responde las acciones hechas + «Something
  went wrong after that — check the rest.» (sin nota).
- [ ] `POST /api/klo/confirmar` `{id, aceptar}`: ejecuta `pendiente` con `ejecutar` (sin contar),
  agrega a `acciones`, limpia `pendiente`.
- [ ] `POST /api/klo/deshacer` `{id}`: `aplicarDeshacer`, marca `deshecho_en`.
- [ ] `npx tsc --noEmit` limpio. Commit.

### Task 9: Panel y campo en la barra

**Files:** Create `src/components/klo/panel-klo.tsx`, `src/components/klo/campo-klo.tsx`; Modify `src/components/vidrio/barra-arriba.tsx`, `src/app/vidrio.css` (estilos `v-klo-*`), mosaico Klo de Today (abre el panel)

- [ ] `CampoKlo` reemplaza el `<label className="v-klo-campo">` deshabilitado: al tocar o ⌘K/Ctrl+K
  abre `PanelKlo`. Contexto ligero `KloProvider` (abrir desde el mosaico).
- [ ] `PanelKlo`: lista de mensajes, chips con `resumen`, botón Undo por mensaje, tarjeta
  Confirm/Cancel si hay pendientes, «Klo is thinking…», input con Enter; borrador en localStorage
  (try/catch); `router.refresh()` tras acciones. Escritorio: flota bajo la barra; ≤ 640 px: hoja
  desde abajo. Respeta DISENO (negro vanta + brasa, Klo azul).
- [ ] e2e `e2e/klo.spec.ts`: `page.route('/api/klo', …)` simula respuesta con una acción; ver chip y Undo.
- [ ] Commit. Push (cierra Parte 2 de código).

### Task 10: Ajustes — Klo's brief y memoria

**Files:** Create `src/app/(app)/ajustes/klo-brief.tsx`; Modify `src/app/(app)/ajustes/page.tsx`, `src/app/(app)/ajustes/acciones.ts`

- [ ] Textarea (≤ 4000, contador) con placeholder guía; guardar con server action
  `guardarBrief`. Lista de memoria con borrar (`borrarMemoria`). Commit.

## Parte 3 — Avisos

### Task 11: Calcular avisos (puro)

**Files:** Create `src/lib/avisos/calcular.ts`, `src/lib/avisos/calcular.test.ts`

```ts
export type TareaAviso = { id: string; titulo: string; fecha: string; hora: string; aviso_min: number; zona: string }
export function tocaAviso(t: TareaAviso, ahora: Date): boolean // inicio-aviso_min <= ahora && ahora < inicio+5min
export function textoAviso(t: TareaAviso): string // «Ana call · in 10 min (4:00 PM)» / «Ana call · now»
export function tocaResumen(p: { resumen_hora: string | null; resumen_enviado: string | null; zona: string }, ahora: Date): string | null // devuelve la fecha local si toca
export function textoResumen(tareasHoy: { titulo: string; hora: string | null }[]): string
```

- [ ] Tests: a las 15:49 no, 15:50 sí, 16:04 sí, 16:06 no (task 16:00, 10 min); `aviso_min 0` = al
  inicio; resumen 08:00: 07:59 null, 08:00 → fecha, ya enviado hoy → null, `resumen_hora null` → null;
  textos. PASS. Commit.

### Task 12: Envío y endpoint del cron

**Files:** Create `src/lib/supabase/servicio.ts`, `src/lib/avisos/enviar.ts`, `src/app/api/avisos/enviar/route.ts`; `npm i web-push && npm i -D @types/web-push`

- [ ] `servicio.ts`: `createClient<Database>(URL, SUPABASE_SECRET_KEY, {auth:{persistSession:false}})`; `import 'server-only'`.
- [ ] `enviar.ts`: `enviarA(servicio, ownerId, {titulo, cuerpo, url, tag})` → todas sus
  suscripciones; `webpush.sendNotification(sub, JSON.stringify(payload), {TTL: 900, urgency:'high', topic: tag.slice(0,32)})`;
  404/410 → borrar fila. Payload = formato declarativo
  `{web_push: 8030, notification: {title, body, navigate: url, tag}}` (el SW clásico también lo lee).
- [ ] Route `GET`: `Authorization: Bearer ${CRON_SECRET}` o 401. Pasos:
  0. **Antes que nada:** agregar `/api/avisos/enviar` a `PUBLICAS` en `src/lib/rutas.ts` (si no, el
     proxy redirige a `/entrar`) con su prueba en `rutas.test.ts`; el endpoint se protege con su secreto.
  1. Tasks candidatas: `fecha between hoy-1 y hoy+1` (UTC), `avisado_en is null`, `hora not null`,
     `aviso_min not null`, sin borrar/completar; la zona sale de una **segunda consulta** a
     `perfiles .in('user_id', responsables)` (`responsable_id` apunta a `auth.users`, no hay embed).
     Filtrar con `tocaAviso`; **reclamar** con `update tareas set avisado_en=now() where id in (...)
     and avisado_en is null returning id` y enviar solo las reclamadas.
  2. Avisos de Klo: `update avisos set enviado_en=now() where enviado_en is null and enviar_en<=now() returning *` → enviar.
  3. Resúmenes: perfiles con `resumen_hora`; `tocaResumen`; reclamar con
     `update perfiles set resumen_enviado=<fecha> where user_id=… and resumen_enviado is distinct from <fecha> returning`;
     leer tasks de hoy del usuario; enviar.
  Responde `{tareas, avisos, resumenes}`. `export const maxDuration = 60`.
- [ ] Probar local: `curl -H "Authorization: Bearer $CRON_SECRET" localhost:3200/api/avisos/enviar` → 200 JSON; sin header → 401. Commit.

### Task 13: Service worker, suscripción y Ajustes

**Files:** Create `public/sw.js`, `src/components/avisos/registrar-sw.tsx`, `src/app/api/avisos/suscribir/route.ts`, `src/app/(app)/ajustes/notificaciones.tsx`; Modify `src/app/(app)/layout.tsx`, `next.config.ts` (headers no-cache para `/sw.js`), `src/proxy.ts` (dejar pasar `/sw.js`)

- [ ] `sw.js`: `push` → lee JSON (declarativo o `{title, body, url}`) y **siempre** `showNotification`;
  `notificationclick` → enfoca/abre `navigate`/`url` (por defecto `/hoy`).
- [ ] `RegistrarSW`: registra `/sw.js` con `updateViaCache: 'none'`; si ya hay permiso y
  suscripción, la re-guarda (POST `/api/avisos/suscribir`) al abrir.
- [ ] `suscribir`: POST upsert por `endpoint` (owner = sesión); DELETE quita.
- [ ] `Notificaciones` en Ajustes: estado (no soportado / no instalado en iOS / apagado / encendido),
  botón «Turn on notifications» (`Notification.requestPermission()` + `pushManager.subscribe({userVisibleOnly:true, applicationServerKey})` dentro del clic),
  «Send a test» (server action que llama `enviarA` al usuario), hora del resumen (select, «Off»).
- [ ] Commit.

### Task 14: Campo «Alert» en la hoja + tool de Klo

**Files:** Modify `src/components/hoja/hoja-tarea.tsx`, `src/lib/tareas/esquema.ts` (+test), `src/lib/datos.ts` (COLUMNAS)

- [ ] Select «Alert: None · At start · 5 · 10 · 15 · 30 · 60 min before», solo visible con hora.
- [ ] Tests de esquema. Commit.

### Task 15: Cron en Supabase y variables

**Files:** Create `supabase/migrations/0016_cron_avisos.sql`

- [ ] Generar `npx web-push generate-vapid-keys --json` y `CRON_SECRET` (`openssl rand -hex 32`);
  escribir en `.env.local`: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`,
  `VAPID_SUBJECT=mailto:jairmaldonador8@gmail.com`, `CRON_SECRET`. Cargar a Vercel (API REST con
  `VERCEL_TOKEN`, production) junto con `ANTHROPIC_API_KEY` y `SUPABASE_SECRET_KEY`.
- [ ] Guardar en Vault (SQL por pooler, no en la migración):
  `select vault.create_secret('<url>/api/avisos/enviar','avisos_url'); select vault.create_secret('<secreto>','cron_secret');`
- [ ] Migración:

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;
select cron.schedule('enviar-avisos', '* * * * *', $$
  select net.http_get(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'avisos_url'),
    headers := jsonb_build_object('Authorization', 'Bearer ' ||
      (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')),
    timeout_milliseconds := 30000
  );
$$);
```

- [ ] `npx supabase db push`; verificar `select * from cron.job_run_details order by start_time desc limit 3` tras el deploy. Commit.

## Parte 4 — Cierre

### Task 16: Verificación y producción

- [ ] `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`, `npm run test:db`, e2e por proyecto (uno a la vez; apagar el puerto 3200 al final).
- [ ] Mirar en 390 px y escritorio: panel de Klo, Ajustes.
- [ ] Merge/push a `main` → deploy de Vercel. Conversación real con Klo en producción.
- [ ] Jair: instalar en inicio desde Safari → Ajustes → Turn on notifications → Send a test. Crear task con hora +12 min y esperar el aviso.
- [ ] Actualizar memoria del proyecto.
