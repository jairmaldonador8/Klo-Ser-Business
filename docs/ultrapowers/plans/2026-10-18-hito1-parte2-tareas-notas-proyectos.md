# Hito 1 · Parte 2 — Tareas, Notas y Proyectos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use ultrapowers:subagent-driven-development (recommended) or ultrapowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que Jair capture, vea y palomee sus tareas reales en Hoy (y dentro de cada frente), guarde notas que puede volver tarea y lleve proyectos simples con avance — y que todo esté en producción hoy (2026-10-18).

**Architecture:** Una migración aditiva `0003_proyectos_tareas_notas` (RLS por `es_miembro(espacio_id)`, borrado suave, sin `delete`). Los cálculos de Hoy y del avance son funciones puras con Vitest (`lib/hoy/calcular.ts`, `lib/proyectos/avance.ts`, `lib/tareas/esquema.ts`). La UI son Server Components que leen con el cliente de Supabase del servidor + una **hoja de edición** cliente (contexto `HojaProvider` en el layout) que abre el **+** y cualquier tarea; las escrituras van por Server Actions con zod y `revalidatePath('/', 'layout')`.

**Tech Stack:** Next 16.4 (App Router, Server Actions), React 19.3, Supabase (`@supabase/ssr`, Postgres + RLS, pgTAP vía `npm run test:db`), zod 4, Vitest 5, Playwright 1.64, CSS de vidrio (`src/app/vidrio.css`, prefijo `v-`).

**Fuera de hoy (queda para después, en este orden):** Klo con IA (captura, `klo_capturas`, «Volver tarea» vía Klo) · hitos y «Destacar en Hoy» (`perfiles.proyecto_destacado_id`) · clientes, `tipos_entrega`, `plan_cliente`, «Armar el mes» (columnas `cliente_id`, `tipo_entrega_id`, `evidencia_url`, `periodo`, `indice` se agregan a `tareas` en esa migración) · Semana · Google.

**Numeración:** el spec dice `0002_proyectos_tareas_clientes` y `0003_notas_y_klo`; `0002` ya se usó para vista y color. Hoy va `0003_proyectos_tareas_notas`; clientes y Klo serán `0004`/`0005`. Nunca se edita una migración ya aplicada.

**Reglas de la casa que aplican:** commits chicos en español (auto-commit y auto-push encendidos), sin nombres reales en el código, sin colores de semáforo (urgencia = tinta, peso, palabra, punto vivo), mensajes en segunda persona, revisar a 390 px y escritorio. Antes de escribir código de Next lee la guía local relevante en `node_modules/next/dist/docs/` (Server Actions, `revalidatePath`).

---

## Mapa de archivos

| Archivo | Responsabilidad |
|---|---|
| `supabase/migrations/0003_proyectos_tareas_notas.sql` | Tablas `proyectos`, `tareas`, `notas`; triggers de validación; RLS |
| `supabase/tests/003_proyectos_tareas_notas.test.sql` | pgTAP: reglas y aislamiento entre espacios |
| `src/lib/supabase/tipos.ts` | Regenerado con `npm run db:tipos` |
| `src/lib/fechas.ts` (+ `.test.ts`) | `fechaEn`, `horaMinEn`, `sumarDias`, `etiquetaDia` en la zona del usuario |
| `src/lib/tareas/esquema.ts` (+ `.test.ts`) | Tipo `Tarea`, `CLASES`, esquema zod del formulario |
| `src/lib/hoy/calcular.ts` (+ `.test.ts`) | Pendientes, hechas, siguiente, De un toque, Tu día, En riesgo, resumen por frente |
| `src/lib/proyectos/avance.ts` (+ `.test.ts`) | Avance por modo y días restantes |
| `src/lib/datos.ts` | Lecturas de servidor compartidas (`leerTareas`, `leerProyectos`, zona) |
| `src/app/(app)/tareas/acciones.ts` | `guardarTarea`, `completarTarea`, `borrarTarea`, `restaurarTarea` |
| `src/components/hoja/hoja-provider.tsx` | Contexto cliente: `abrir(tarea?, valores?)`, monta la hoja |
| `src/components/hoja/hoja-tarea.tsx` | La hoja de edición (panel abajo en teléfono, lateral en escritorio) |
| `src/components/tareas/renglon-tarea.tsx` | Renglón con palomita (+ toast Deshacer) que abre la hoja |
| `src/components/vidrio/mosaicos.tsx` | Mosaicos con datos reales (De un toque, Tu día, En riesgo, Proyectos) |
| `src/app/(app)/hoy/page.tsx` | Lee tareas/proyectos y pasa a los mosaicos |
| `src/app/(app)/layout.tsx` | Monta `HojaProvider` con frentes y proyectos activos |
| `src/components/vidrio/pildoras.tsx` | Enciende el **+** |
| `src/app/(app)/notas/{page.tsx,lista-notas.tsx,acciones.ts}` | Notas por frente |
| `src/app/(app)/proyectos/{page.tsx,nuevo-proyecto.tsx,acciones.ts}` | Rejilla + alta |
| `src/app/(app)/proyectos/[id]/page.tsx` | Detalle: editar, tareas del proyecto, +1 manual, cerrar |
| `src/app/vidrio.css` | Estilos nuevos: `.v-hoja`, `.v-palomita`, `.v-toast`, `.v-barra-avance`, `.v-nota` |
| `e2e/tareas.spec.ts` | Crear con el +, verla en Hoy, palomear |

---

### Task 1: Migración 0003 con RLS y pgTAP

**Files:**
- Create: `supabase/migrations/0003_proyectos_tareas_notas.sql`
- Create: `supabase/tests/003_proyectos_tareas_notas.test.sql`
- Modify: `src/lib/supabase/tipos.ts` (regenerado)

- [ ] **Step 1: Escribe la prueba pgTAP (falla: las tablas no existen)**

```sql
begin;
select plan(16);

select pruebas.crear_usuario('66666666-6666-6666-6666-666666666666', 'f@prueba.mx', 'Fer');
select pruebas.crear_usuario('77777777-7777-7777-7777-777777777777', 'g@prueba.mx', 'Gabo');

select pruebas.autenticar_como('66666666-6666-6666-6666-666666666666');
select public.crear_espacio('Uno', 'U', 'uno', 0);
select public.crear_espacio('Dos', 'D', 'dos', 1);
-- Los ids se guardan antes de cambiar de usuario: luego RLS los oculta.
select set_config('pruebas.uno', (select id::text from public.espacios where atajo = 'uno'), false);
select set_config('pruebas.dos', (select id::text from public.espacios where atajo = 'dos'), false);

-- Proyecto y tarea en el espacio propio
select lives_ok($$ insert into public.proyectos (espacio_id, nombre, modo_avance)
  values (current_setting('pruebas.uno')::uuid, 'Lanzar', 'tareas') $$, 'creo un proyecto en mi frente');
select lives_ok($$ insert into public.tareas (espacio_id, titulo, fecha, proyecto_id)
  values (current_setting('pruebas.uno')::uuid, 'Mandar propuesta', current_date, (select id from public.proyectos where nombre = 'Lanzar')) $$,
  'creo una tarea ligada al proyecto');
select is((select responsable_id from public.tareas where titulo = 'Mandar propuesta'),
  '66666666-6666-6666-6666-666666666666'::uuid, 'el responsable por defecto es quien la crea');
select is((select origen from public.tareas where titulo = 'Mandar propuesta'), 'manual', 'origen manual por defecto');

-- Reglas de la tarea
select throws_ok($$ insert into public.tareas (espacio_id, titulo, hora)
  values (current_setting('pruebas.uno')::uuid, 'Sin fecha', '10:00') $$, '23514', null, 'la hora exige fecha');
select throws_ok($$ insert into public.tareas (espacio_id, titulo, fecha, hora, hora_fin)
  values (current_setting('pruebas.uno')::uuid, 'Al revés', current_date, '10:00', '09:00') $$, '23514', null,
  'la hora fin va después de la hora');
select throws_ok($$ insert into public.tareas (espacio_id, titulo, clase, fecha)
  values (current_setting('pruebas.uno')::uuid, 'Junta sin hora', 'junta', current_date) $$, '23514', null,
  'una junta exige hora');
select throws_ok($$ insert into public.tareas (espacio_id, titulo, proyecto_id)
  values (current_setting('pruebas.dos')::uuid, 'Cruzada', (select id from public.proyectos where nombre = 'Lanzar')) $$,
  'P0001', null, 'el proyecto debe ser del mismo frente');
select throws_ok($$ insert into public.tareas (espacio_id, titulo)
  values (current_setting('pruebas.uno')::uuid, '   ') $$, '23514', null, 'el título no va vacío');

-- Nota y borrado suave
select lives_ok($$ insert into public.notas (espacio_id, texto) values (current_setting('pruebas.uno')::uuid, 'Idea suelta') $$,
  'creo una nota');
select lives_ok($$ update public.tareas set borrado_en = now() where titulo = 'Mandar propuesta' $$, 'borro suave una tarea');
select throws_ok($$ delete from public.tareas $$, '42501', null, 'nadie borra en duro');

-- Otra persona no ve ni toca nada
select pruebas.autenticar_como('77777777-7777-7777-7777-777777777777');
select is((select count(*)::int from public.tareas) + (select count(*)::int from public.proyectos) + (select count(*)::int from public.notas),
  0, 'otra persona no lee tareas, proyectos ni notas ajenas');
-- Con un responsable que sí es miembro, para que el trigger pase y lo frene RLS.
select throws_ok($$ insert into public.tareas (espacio_id, titulo, responsable_id)
  values (current_setting('pruebas.uno')::uuid, 'Intrusa', '66666666-6666-6666-6666-666666666666') $$,
  '42501', null, 'ni inserta en un frente ajeno');
update public.notas set texto = 'hackeada';
select pruebas.autenticar_como('66666666-6666-6666-6666-666666666666');
select is((select texto from public.notas limit 1), 'Idea suelta', 'ni actualiza notas ajenas');
select is((select count(*)::int from public.tareas), 1, 'la tarea borrada sigue en la base');

select * from finish();
rollback;
```

- [ ] **Step 2: Corre y confirma que falla**

Run: `npm run test:db`
Expected: `003_proyectos_tareas_notas.test.sql .. FALLA: relation "public.proyectos" does not exist`

- [ ] **Step 3: Escribe la migración**

```sql
-- 0003 · Proyectos, tareas y notas: lo que Jair captura y palomea cada día.
-- Todo cuelga de un espacio (frente) y lo ven solo sus miembros. Nada se borra en duro: borrado_en.
-- Clientes, entregas del plan y Klo llegan en migraciones siguientes (columnas aditivas).

-- ── Proyectos ───────────────────────────────────────────────────────────
create table public.proyectos (
  id uuid primary key default gen_random_uuid(),
  espacio_id uuid not null references public.espacios (id) on delete cascade,
  nombre text not null check (char_length(trim(nombre)) between 1 and 80),
  meta text not null default '' check (char_length(meta) <= 200),
  fecha_inicio date not null default current_date,
  fecha_meta date,
  modo_avance text not null default 'tareas' check (modo_avance in ('hitos', 'tareas', 'manual')),
  cifra_actual numeric not null default 0 check (cifra_actual >= 0),
  cifra_meta numeric check (cifra_meta > 0),
  estado text not null default 'activo' check (estado in ('activo', 'pausado', 'cerrado')),
  orden int not null default 0,
  creado_por uuid not null default auth.uid() references auth.users (id),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  check (fecha_meta is null or fecha_meta >= fecha_inicio),
  check (modo_avance <> 'manual' or cifra_meta is not null)
);
create index proyectos_espacio_idx on public.proyectos (espacio_id, estado);

-- ── Tareas ──────────────────────────────────────────────────────────────
create table public.tareas (
  id uuid primary key default gen_random_uuid(),
  espacio_id uuid not null references public.espacios (id) on delete cascade,
  titulo text not null check (char_length(trim(titulo)) between 1 and 200),
  clase text not null default 'tarea' check (clase in ('tarea', 'entrega', 'junta', 'profundo')),
  fecha date,
  hora time,
  hora_fin time,
  proyecto_id uuid references public.proyectos (id) on delete set null,
  responsable_id uuid not null default auth.uid() references auth.users (id),
  completada_en timestamptz,
  origen text not null default 'manual' check (origen in ('manual', 'klo', 'armar_mes')),
  borrado_en timestamptz,
  creado_por uuid not null default auth.uid() references auth.users (id),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  check (hora is null or fecha is not null),
  check (hora_fin is null or (hora is not null and hora_fin > hora)),
  check (clase <> 'junta' or hora is not null)
);
create index tareas_pendientes_idx on public.tareas (espacio_id, fecha)
  where borrado_en is null and completada_en is null;
create index tareas_proyecto_idx on public.tareas (proyecto_id) where proyecto_id is not null;

-- ── Notas ───────────────────────────────────────────────────────────────
create table public.notas (
  id uuid primary key default gen_random_uuid(),
  espacio_id uuid not null references public.espacios (id) on delete cascade,
  texto text not null check (char_length(trim(texto)) between 1 and 4000),
  convertida_en_tarea_id uuid references public.tareas (id) on delete set null,
  borrado_en timestamptz,
  creado_por uuid not null default auth.uid() references auth.users (id),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
create index notas_espacio_idx on public.notas (espacio_id, creado_en desc) where borrado_en is null;

create trigger proyectos_actualizado before update on public.proyectos
  for each row execute function private.tocar_actualizado_en();
create trigger tareas_actualizado before update on public.tareas
  for each row execute function private.tocar_actualizado_en();
create trigger notas_actualizado before update on public.notas
  for each row execute function private.tocar_actualizado_en();

-- ── Coherencia entre espacios (el proyecto y el responsable son del mismo frente) ──
create function private.validar_tarea() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.proyecto_id is not null and not exists (
    select 1 from public.proyectos p where p.id = new.proyecto_id and p.espacio_id = new.espacio_id
  ) then
    raise exception 'proyecto_de_otro_frente' using errcode = 'P0001';
  end if;
  -- Solo si cambia quién o dónde: las cascadas (set null) no deben tropezar aquí.
  if (tg_op = 'INSERT' or new.responsable_id is distinct from old.responsable_id or new.espacio_id is distinct from old.espacio_id)
    and not exists (
    select 1 from public.miembros m where m.espacio_id = new.espacio_id and m.user_id = new.responsable_id
  ) then
    raise exception 'responsable_no_es_miembro' using errcode = 'P0001';
  end if;
  return new;
end $$;

create trigger tareas_validar before insert or update on public.tareas
  for each row execute function private.validar_tarea();

create function private.validar_nota() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.convertida_en_tarea_id is not null and not exists (
    select 1 from public.tareas t where t.id = new.convertida_en_tarea_id and t.espacio_id = new.espacio_id
  ) then
    raise exception 'tarea_de_otro_frente' using errcode = 'P0001';
  end if;
  return new;
end $$;

create trigger notas_validar before insert or update on public.notas
  for each row execute function private.validar_nota();

-- ── RLS y permisos (sin delete: se borra suave) ─────────────────────────
alter table public.proyectos enable row level security;
alter table public.tareas enable row level security;
alter table public.notas enable row level security;

revoke all on public.proyectos, public.tareas, public.notas from anon, authenticated;
grant select, insert on public.proyectos, public.tareas, public.notas to authenticated;
grant update (nombre, meta, fecha_inicio, fecha_meta, modo_avance, cifra_actual, cifra_meta, estado, orden)
  on public.proyectos to authenticated;
grant update (espacio_id, titulo, clase, fecha, hora, hora_fin, proyecto_id, responsable_id, completada_en, borrado_en)
  on public.tareas to authenticated;
grant update (espacio_id, texto, convertida_en_tarea_id, borrado_en) on public.notas to authenticated;

create policy proyectos_select on public.proyectos for select to authenticated
  using ((select private.es_miembro(espacio_id)));
create policy proyectos_insert on public.proyectos for insert to authenticated
  with check ((select private.es_miembro(espacio_id)) and creado_por = (select auth.uid()));
create policy proyectos_update on public.proyectos for update to authenticated
  using ((select private.es_miembro(espacio_id))) with check ((select private.es_miembro(espacio_id)));

create policy tareas_select on public.tareas for select to authenticated
  using ((select private.es_miembro(espacio_id)));
create policy tareas_insert on public.tareas for insert to authenticated
  with check ((select private.es_miembro(espacio_id)) and creado_por = (select auth.uid()));
create policy tareas_update on public.tareas for update to authenticated
  using ((select private.es_miembro(espacio_id))) with check ((select private.es_miembro(espacio_id)));

create policy notas_select on public.notas for select to authenticated
  using ((select private.es_miembro(espacio_id)));
create policy notas_insert on public.notas for insert to authenticated
  with check ((select private.es_miembro(espacio_id)) and creado_por = (select auth.uid()));
create policy notas_update on public.notas for update to authenticated
  using ((select private.es_miembro(espacio_id))) with check ((select private.es_miembro(espacio_id)));
```

- [ ] **Step 4: Aplica y corre las pruebas**

Run: `npx supabase db push` y luego `npm run test:db`
Expected: los cuatro archivos `ok`; `003_proyectos_tareas_notas.test.sql .. ok (16 pasan)`. Si una prueba falla, corrige la migración con una **nueva** migración `0003a_…` si ya se aplicó (no edites la aplicada), salvo que la prueba contradiga este plan.

- [ ] **Step 5: Regenera los tipos y verifica**

Run: `npm run db:tipos` y `npx tsc --noEmit`
Expected: `tipos.ts` con `proyectos`, `tareas`, `notas`; tsc sin errores.

- [ ] **Step 6: Commit y push**

```bash
git add supabase/migrations/0003_proyectos_tareas_notas.sql supabase/tests/003_proyectos_tareas_notas.test.sql src/lib/supabase/tipos.ts
git commit -m "feat(db): 0003 proyectos, tareas y notas con RLS y borrado suave"
git push
```

---

### Task 2: Fechas en la zona del usuario (pura)

**Files:**
- Create: `src/lib/fechas.ts`, `src/lib/fechas.test.ts`
- Modify: `src/lib/saludo.ts` (exporta `zonaValida` para reusarla)

- [ ] **Step 1: Prueba que falla**

```ts
import { describe, expect, it } from 'vitest'
import { etiquetaDia, fechaEn, horaMinEn, sumarDias } from './fechas'

const zona = 'America/Monterrey' // UTC-6 en octubre

describe('fechas', () => {
  it('da el día en la zona, no en UTC', () => {
    expect(fechaEn(new Date('2026-10-19T03:00:00Z'), zona)).toBe('2026-10-18')
  })
  it('da la hora HH:MM en la zona', () => {
    expect(horaMinEn(new Date('2026-10-18T15:05:00Z'), zona)).toBe('09:05')
  })
  it('suma días cruzando el fin de mes', () => {
    expect(sumarDias('2026-10-31', 1)).toBe('2026-11-01')
    expect(sumarDias('2026-10-01', -1)).toBe('2026-09-30')
  })
  it('nombra el día relativo a hoy', () => {
    expect(etiquetaDia('2026-10-18', '2026-10-18')).toBe('hoy')
    expect(etiquetaDia('2026-10-19', '2026-10-18')).toBe('mañana')
    expect(etiquetaDia('2026-10-17', '2026-10-18')).toBe('ayer')
    expect(etiquetaDia('2026-10-20', '2026-10-18')).toBe('en 2 días')
    expect(etiquetaDia('2026-10-14', '2026-10-18')).toBe('hace 4 días')
  })
})
```

- [ ] **Step 2: Corre** `npx vitest run src/lib/fechas.test.ts` → FAIL (no existe el módulo).

- [ ] **Step 3: Implementa**

En `saludo.ts` cambia `function zonaValida` por `export function zonaValida`. Luego:

```ts
import { zonaValida } from './saludo'

/** «2026-10-18»: el día calendario de ese instante en la zona del usuario. */
export function fechaEn(instante: Date, zona: string): string {
  // en-CA da AAAA-MM-DD.
  return new Intl.DateTimeFormat('en-CA', { timeZone: zonaValida(zona), year: 'numeric', month: '2-digit', day: '2-digit' }).format(instante)
}

/** «09:05» en la zona del usuario. */
export function horaMinEn(instante: Date, zona: string): string {
  return new Intl.DateTimeFormat('en-GB', { timeZone: zonaValida(zona), hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(instante)
}

export function sumarDias(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().slice(0, 10)
}

function diferencia(fecha: string, hoy: string): number {
  return Math.round((Date.parse(`${fecha}T12:00:00Z`) - Date.parse(`${hoy}T12:00:00Z`)) / 86_400_000)
}

export function etiquetaDia(fecha: string, hoy: string): string {
  const n = diferencia(fecha, hoy)
  if (n === 0) return 'hoy'
  if (n === 1) return 'mañana'
  if (n === -1) return 'ayer'
  return n > 0 ? `en ${n} días` : `hace ${-n} días`
}

export { diferencia as diasEntre }
```

- [ ] **Step 4: Corre** → PASS. `npm test` completo verde.
- [ ] **Step 5: Commit y push** — `feat: fechas en la zona del usuario como funciones puras`

---

### Task 3: Esquema de tarea y cálculos de Hoy (puras)

**Files:**
- Create: `src/lib/tareas/esquema.ts`, `src/lib/tareas/esquema.test.ts`
- Create: `src/lib/hoy/calcular.ts`, `src/lib/hoy/calcular.test.ts`

- [ ] **Step 1: `esquema.ts`** (tipos + zod; la prueba va en el paso 2)

```ts
import { z } from 'zod'

export const CLASES = ['tarea', 'entrega', 'junta', 'profundo'] as const
export type Clase = (typeof CLASES)[number]
export const NOMBRE_CLASE: Record<Clase, string> = { tarea: 'Tarea', entrega: 'Entrega', junta: 'Junta', profundo: 'Trabajo profundo' }

/** Lo que la app usa de una tarea (fila de `tareas` ya filtrada de borradas). */
export type Tarea = {
  id: string
  espacio_id: string
  titulo: string
  clase: Clase
  fecha: string | null
  hora: string | null // 'HH:MM' o 'HH:MM:SS' tal como llega de Postgres
  hora_fin: string | null
  proyecto_id: string | null
  completada_en: string | null
}

const vacioANulo = (v: unknown) => (v === '' || v === undefined ? null : v)
const hora = z.preprocess(vacioANulo, z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).nullable())

export const esquemaTarea = z
  .object({
    id: z.preprocess(vacioANulo, z.uuid().nullable()),
    espacio_id: z.uuid({ error: 'Elige un frente.' }),
    titulo: z.string().trim().min(1, 'Escribe qué hay que hacer.').max(200),
    clase: z.enum(CLASES),
    fecha: z.preprocess(vacioANulo, z.iso.date().nullable()),
    hora,
    hora_fin: hora,
    proyecto_id: z.preprocess(vacioANulo, z.uuid().nullable()),
  })
  .refine((t) => !t.hora || t.fecha, { message: 'Para ponerle hora, ponle fecha.', path: ['hora'] })
  .refine((t) => !t.hora_fin || (t.hora && t.hora_fin > t.hora), { message: 'La hora de fin va después de la de inicio.', path: ['hora_fin'] })
  .refine((t) => t.clase !== 'junta' || t.hora, { message: 'Una junta necesita hora.', path: ['hora'] })

export type DatosTarea = z.infer<typeof esquemaTarea>

/** «09:00:00» → «09:00». */
export const hhmm = (h: string | null) => (h ? h.slice(0, 5) : null)
```

- [ ] **Step 2: `esquema.test.ts`** — casos: válida mínima (`espacio_id`, `titulo`, `clase:'tarea'`, resto `''`) da nulos; título vacío → error «Escribe qué hay que hacer.»; hora sin fecha → error; `hora_fin` ≤ `hora` → error; junta sin hora → error; `hhmm('09:00:00') === '09:00'`. Usa `esquemaTarea.safeParse` y revisa `error.issues[0].message`. Los ids de prueba van con `crypto.randomUUID()`: el `z.uuid()` de zod 4 rechaza ids como `1111…`. Corre → PASS (el módulo ya existe; si algún caso falla, corrige el esquema).

- [ ] **Step 3: Prueba de `calcular.ts` que falla**

```ts
import { describe, expect, it } from 'vitest'
import type { Tarea } from '@/lib/tareas/esquema'
import { calcularHoy, enRiesgo, resumenPorFrente } from './calcular'

const hoy = '2026-10-18'
let n = 0
const t = (p: Partial<Tarea>): Tarea => ({
  id: String(++n), espacio_id: 'a', titulo: `t${n}`, clase: 'tarea', fecha: hoy, hora: null, hora_fin: null,
  proyecto_id: null, completada_en: null, ...p,
})
const ctx = { hoy, ahora: '11:00', zona: 'America/Monterrey' }

describe('calcularHoy', () => {
  it('cuenta pendientes de hoy y vencidas, sin juntas ni futuras', () => {
    const r = calcularHoy([t({}), t({ fecha: '2026-10-16' }), t({ clase: 'junta', hora: '12:00' }), t({ fecha: '2026-10-20' }), t({ fecha: null })], ctx)
    expect(r.pendientes).toBe(2)
  })
  it('cuenta hechas hoy por su completada_en en la zona', () => {
    const r = calcularHoy([t({ completada_en: '2026-10-18T17:00:00Z' }), t({ completada_en: '2026-10-17T17:00:00Z', fecha: '2026-10-17' }), t({})], ctx)
    expect(r.hechas).toBe(1)
    expect(r.pendientes).toBe(1)
  })
  it('lo siguiente es la próxima con hora ≥ ahora', () => {
    const r = calcularHoy([t({ titulo: 'temprano', hora: '09:00' }), t({ titulo: 'luego', hora: '13:00' }), t({ titulo: 'antes', hora: '12:00' })], ctx)
    expect(r.siguiente?.titulo).toBe('antes')
  })
  it('sin horas por venir, lo siguiente es la primera de De un toque (vencidas primero, la más vieja)', () => {
    const r = calcularHoy([t({ titulo: 'hoy' }), t({ titulo: 'vieja', fecha: '2026-10-10' }), t({ titulo: 'ayer', fecha: '2026-10-17' })], ctx)
    expect(r.deUnToque.map((x) => x.titulo)).toEqual(['vieja', 'ayer', 'hoy'])
    expect(r.siguiente?.titulo).toBe('vieja')
  })
  it('De un toque: hoy sin hora + todas las vencidas; Tu día: hoy con hora en orden', () => {
    const r = calcularHoy([t({ titulo: 'a', hora: '15:00' }), t({ titulo: 'b', hora: '09:00', completada_en: '2026-10-18T15:30:00Z' }), t({ titulo: 'c' }), t({ titulo: 'd', fecha: '2026-10-17', hora: '10:00' })], ctx)
    expect(r.deUnToque.map((x) => x.titulo)).toEqual(['d', 'c'])
    expect(r.tuDia.map((x) => x.titulo)).toEqual(['b', 'a'])
  })
})

describe('enRiesgo', () => {
  it('entregas no hechas a ≤ 2 días, vencidas primero', () => {
    const r = enRiesgo([t({ clase: 'entrega', titulo: 'x', fecha: '2026-10-20' }), t({ clase: 'entrega', titulo: 'y', fecha: '2026-10-15' }), t({ clase: 'entrega', fecha: '2026-10-21' }), t({ titulo: 'no entrega', fecha: '2026-10-15' })], hoy)
    expect(r.map((x) => x.titulo)).toEqual(['y', 'x'])
  })
})

describe('resumenPorFrente', () => {
  it('da pendientes de hoy y en riesgo por frente', () => {
    const r = resumenPorFrente([t({ espacio_id: 'a' }), t({ espacio_id: 'b', clase: 'entrega', fecha: '2026-10-19' }), t({ espacio_id: 'b' })], ctx)
    expect(r.get('a')).toEqual({ hoy: 1, riesgo: 0 })
    expect(r.get('b')).toEqual({ hoy: 1, riesgo: 1 })
  })
})
```

- [ ] **Step 4: Corre** `npx vitest run src/lib/hoy` → FAIL.

- [ ] **Step 5: Implementa `calcular.ts`**

```ts
import { fechaEn, sumarDias } from '@/lib/fechas'
import { hhmm, type Tarea } from '@/lib/tareas/esquema'

export type Contexto = { hoy: string; ahora: string; zona: string }

const porFechaYHora = (a: Tarea, b: Tarea) =>
  (a.fecha ?? '').localeCompare(b.fecha ?? '') || (hhmm(a.hora) ?? '99').localeCompare(hhmm(b.hora) ?? '99')

/** Cuenta para el medidor: no es junta y es de hoy o vencida. */
const cuenta = (x: Tarea, hoy: string) => x.clase !== 'junta' && x.fecha !== null && x.fecha <= hoy

export function calcularHoy(tareas: readonly Tarea[], { hoy, ahora, zona }: Contexto) {
  const pendientesLista = tareas.filter((x) => !x.completada_en && cuenta(x, hoy))
  const hechas = tareas.filter((x) => x.completada_en && x.clase !== 'junta' && fechaEn(new Date(x.completada_en), zona) === hoy).length

  const vencidas = pendientesLista.filter((x) => x.fecha! < hoy).sort(porFechaYHora)
  const hoySinHora = pendientesLista.filter((x) => x.fecha === hoy && !x.hora)
  const deUnToque = [...vencidas, ...hoySinHora]
  const tuDia = tareas.filter((x) => x.fecha === hoy && x.hora).sort(porFechaYHora)

  const porVenir = tuDia.find((x) => !x.completada_en && x.clase !== 'junta' && hhmm(x.hora)! >= ahora)
  return { pendientes: pendientesLista.length, hechas, siguiente: porVenir ?? deUnToque[0] ?? null, deUnToque, tuDia }
}

export function enRiesgo(tareas: readonly Tarea[], hoy: string): Tarea[] {
  const limite = sumarDias(hoy, 2)
  return tareas.filter((x) => x.clase === 'entrega' && !x.completada_en && x.fecha && x.fecha <= limite).sort(porFechaYHora)
}

export function resumenPorFrente(tareas: readonly Tarea[], ctx: Contexto): Map<string, { hoy: number; riesgo: number }> {
  const mapa = new Map<string, { hoy: number; riesgo: number }>()
  const fila = (id: string) => mapa.get(id) ?? (mapa.set(id, { hoy: 0, riesgo: 0 }), mapa.get(id)!)
  for (const x of tareas) if (!x.completada_en && cuenta(x, ctx.hoy)) fila(x.espacio_id).hoy++
  for (const x of enRiesgo(tareas, ctx.hoy)) fila(x.espacio_id).riesgo++
  return mapa
}
```

Nota: las tareas que llegan ya vienen filtradas por `borrado_en is null` y `responsable_id = yo` desde la lectura (Task 5).

- [ ] **Step 6: Corre** → PASS; `npm test` verde.
- [ ] **Step 7: Commit y push** — `feat: esquema de tarea y cálculos de Hoy como funciones puras`

---

### Task 4: Avance de proyectos (pura)

**Files:** Create `src/lib/proyectos/avance.ts`, `src/lib/proyectos/avance.test.ts`

- [ ] **Step 1: Prueba que falla** — casos:
  - `avance({ modo_avance: 'tareas' }, { total: 4, hechas: 1 })` → `0.25`; con `total: 0` → `0`.
  - `avance({ modo_avance: 'manual', cifra_actual: 30, cifra_meta: 60 }, …)` → `0.5`; con actual > meta → `1`.
  - `avance({ modo_avance: 'hitos' }, …)` → `0` (los hitos llegan después).
  - `diasRestantes('2026-10-31', '2026-10-18')` → `13`; `null` → `null`.
  - `porcentaje(0.554)` → `'55 %'`.
- [ ] **Step 2: Corre** → FAIL.
- [ ] **Step 3: Implementa**

```ts
import { diasEntre } from '@/lib/fechas'

export type ProyectoAvance = { modo_avance: 'hitos' | 'tareas' | 'manual'; cifra_actual?: number | null; cifra_meta?: number | null }
export type ConteoTareas = { total: number; hechas: number }

export function avance(p: ProyectoAvance, conteo: ConteoTareas): number {
  if (p.modo_avance === 'manual') return p.cifra_meta ? Math.min(1, Number(p.cifra_actual ?? 0) / Number(p.cifra_meta)) : 0
  if (p.modo_avance === 'tareas') return conteo.total ? conteo.hechas / conteo.total : 0
  return 0 // hitos: llegan en la siguiente parte
}

export const diasRestantes = (fechaMeta: string | null, hoy: string) => (fechaMeta ? diasEntre(fechaMeta, hoy) : null)
export const porcentaje = (x: number) => `${Math.floor(x * 100)} %`
```

- [ ] **Step 4: Corre** → PASS.
- [ ] **Step 5: Commit y push** — `feat: avance de proyectos por tareas o cifra manual`

---

### Task 5: Lecturas y acciones de tareas

**Files:**
- Create: `src/lib/datos.ts`
- Create: `src/app/(app)/tareas/acciones.ts`

- [ ] **Step 1: `datos.ts`** (solo servidor)

```ts
import { fechaEn, horaMinEn } from '@/lib/fechas'
import { crearClienteServidor } from '@/lib/supabase/servidor'
import type { Clase, Tarea } from '@/lib/tareas/esquema'

const COLUMNAS = 'id, espacio_id, titulo, clase, fecha, hora, hora_fin, proyecto_id, completada_en'

/** Mis tareas vivas: pendientes de cualquier fecha + las completadas desde ayer (para «hechas hoy»). */
export async function leerMisTareas(espacioId?: string): Promise<Tarea[]> {
  const supabase = await crearClienteServidor()
  const { data: sesion } = await supabase.auth.getClaims()
  const desde = new Date(Date.now() - 36 * 3600_000).toISOString()
  let q = supabase
    .from('tareas')
    .select(COLUMNAS)
    .is('borrado_en', null)
    .eq('responsable_id', sesion!.claims.sub)
    .or(`completada_en.is.null,completada_en.gte.${desde}`)
    .order('fecha', { nullsFirst: false })
    .order('hora', { nullsFirst: true })
    .limit(500)
  if (espacioId) q = q.eq('espacio_id', espacioId)
  const { data, error } = await q
  if (error) console.error('leerMisTareas', error)
  return (data ?? []).map((x) => ({ ...x, clase: x.clase as Clase }))
}

export async function contextoAhora() {
  const supabase = await crearClienteServidor()
  const { data: sesion } = await supabase.auth.getClaims()
  const { data } = await supabase.from('perfiles').select('zona_horaria').eq('user_id', sesion!.claims.sub).single()
  const zona = data?.zona_horaria ?? 'America/Monterrey'
  const ahora = new Date()
  return { zona, hoy: fechaEn(ahora, zona), ahora: horaMinEn(ahora, zona) }
}

export type ProyectoLista = { id: string; espacio_id: string; nombre: string; meta: string; fecha_inicio: string; fecha_meta: string | null;
  modo_avance: 'hitos' | 'tareas' | 'manual'; cifra_actual: number; cifra_meta: number | null; estado: string; total: number; hechas: number }

/** Proyectos con su conteo de tareas no borradas (para el avance). */
export async function leerProyectos({ espacioId, soloActivos = true }: { espacioId?: string; soloActivos?: boolean } = {}): Promise<ProyectoLista[]> {
  const supabase = await crearClienteServidor()
  let q = supabase.from('proyectos').select('id, espacio_id, nombre, meta, fecha_inicio, fecha_meta, modo_avance, cifra_actual, cifra_meta, estado, tareas(completada_en, borrado_en)').order('fecha_meta', { nullsFirst: false }).order('orden')
  if (soloActivos) q = q.eq('estado', 'activo')
  if (espacioId) q = q.eq('espacio_id', espacioId)
  const { data, error } = await q
  if (error) console.error('leerProyectos', error)
  return (data ?? []).map(({ tareas, ...p }) => {
    const vivas = (tareas ?? []).filter((t) => !t.borrado_en)
    return { ...p, modo_avance: p.modo_avance as ProyectoLista['modo_avance'], cifra_actual: Number(p.cifra_actual), cifra_meta: p.cifra_meta === null ? null : Number(p.cifra_meta), total: vivas.length, hechas: vivas.filter((t) => t.completada_en).length }
  })
}
```

`server-only` no está instalado: no pongas esa línea. Si el embebido `tareas(...)` da error de tipos por la relación, castea con `as unknown as` mínimo y deja un comentario.

- [ ] **Step 2: `tareas/acciones.ts`**

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { crearClienteServidor } from '@/lib/supabase/servidor'
import { esquemaTarea } from '@/lib/tareas/esquema'

export type Resultado = { ok: true; id?: string } | { ok: false; mensaje: string }

const listo = (id?: string): Resultado => (revalidatePath('/', 'layout'), { ok: true, id })

export async function guardarTarea(datos: unknown, notaId?: string): Promise<Resultado> {
  const leida = esquemaTarea.safeParse(datos)
  if (!leida.success) return { ok: false, mensaje: leida.error.issues[0]?.message ?? 'Revisa los datos.' }
  const { id, ...campos } = leida.data
  const supabase = await crearClienteServidor()
  const consulta = id
    ? supabase.from('tareas').update(campos).eq('id', id).select('id').single()
    : supabase.from('tareas').insert(campos).select('id').single()
  const { data, error } = await consulta
  if (error || !data) {
    console.error('guardarTarea', error)
    return { ok: false, mensaje: 'No pude guardar la tarea, inténtalo otra vez.' }
  }
  if (notaId) await supabase.from('notas').update({ convertida_en_tarea_id: data.id }).eq('id', notaId)
  return listo(data.id)
}

export async function completarTarea(id: string, hecha: boolean): Promise<Resultado> {
  const supabase = await crearClienteServidor()
  const { error } = await supabase.from('tareas').update({ completada_en: hecha ? new Date().toISOString() : null }).eq('id', id)
  if (error) return { ok: false, mensaje: 'No pude marcarla, inténtalo otra vez.' }
  return listo()
}

export async function borrarTarea(id: string, borrar = true): Promise<Resultado> {
  const supabase = await crearClienteServidor()
  const { error } = await supabase.from('tareas').update({ borrado_en: borrar ? new Date().toISOString() : null }).eq('id', id)
  if (error) return { ok: false, mensaje: 'No pude borrarla, inténtalo otra vez.' }
  return listo()
}
```

Ojo: un `update` de `borrado_en = null` sobre una fila borrada sí pasa RLS (la policy de select no filtra borradas). Verifica a mano que «Deshacer» funciona.

- [ ] **Step 3:** `npx tsc --noEmit` y `npm run lint` → limpios.
- [ ] **Step 4: Commit y push** — `feat: lecturas de tareas y proyectos y acciones de tareas`

---

### Task 6: La hoja de edición y el +

**Files:**
- Create: `src/components/hoja/hoja-provider.tsx`, `src/components/hoja/hoja-tarea.tsx`
- Modify: `src/app/(app)/layout.tsx`, `src/components/vidrio/pildoras.tsx`, `src/app/vidrio.css`

- [ ] **Step 1: `hoja-provider.tsx`** (cliente)

```tsx
'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import type { FrenteVista } from '@/lib/frentes'
import type { Tarea } from '@/lib/tareas/esquema'
import { HojaTarea } from './hoja-tarea'

export type ProyectoOpcion = { id: string; espacio_id: string; nombre: string }
/** Lo que abre la hoja: una tarea existente, o valores para una nueva (frente abierto, texto de una nota…). */
export type Apertura = { tarea?: Tarea; valores?: Partial<Tarea>; notaId?: string }

const Contexto = createContext<(a?: Apertura) => void>(() => {})
export const useHoja = () => useContext(Contexto)

export function HojaProvider({ frentes, proyectos, children }: { frentes: FrenteVista[]; proyectos: ProyectoOpcion[]; children: React.ReactNode }) {
  const [abierta, setAbierta] = useState<Apertura | null>(null)
  const abrir = useCallback((a: Apertura = {}) => setAbierta(a), [])
  return (
    <Contexto.Provider value={abrir}>
      {children}
      {abierta && <HojaTarea key={abierta.tarea?.id ?? 'nueva'} apertura={abierta} frentes={frentes} proyectos={proyectos} cerrar={() => setAbierta(null)} />}
    </Contexto.Provider>
  )
}
```

- [ ] **Step 2: `hoja-tarea.tsx`** — un `<dialog>` abierto con `showModal()` en `useEffect` (Esc y fondo cierran), clase `v-hoja`. Formulario controlado con: **título** (input autofocus, `maxLength=200`), **clase** (botones tipo píldora con `NOMBRE_CLASE`), **frente** (radiogroup con `v-foto v-color-*` + nombre; por defecto `valores.espacio_id` (el + y las vistas ya pasan el frente abierto) → el primero; la hoja no usa `useSearchParams`), **fecha** (`<input type="date">` con atajos «Hoy» / «Mañana» / «Sin fecha» calculados con `fechaEn(new Date(), Intl.DateTimeFormat().resolvedOptions().timeZone)` + `sumarDias`), **hora** y **hora fin** (`type="time"`), **proyecto** (`<select>` filtrado a `proyectos` del frente elegido; al cambiar de frente se limpia). Botones: **Guardar** (`v-boton primario`), y si es existente **Completar/Reabrir** y **Borrar**. Al guardar llama `guardarTarea({...form, id: tarea?.id ?? ''}, apertura.notaId)` dentro de `useTransition`; error → `v-aviso` con el mensaje; ok → `cerrar()`. Borrar → `borrarTarea(id)` y avisa con el toast de Deshacer (Task 7 trae `useToast`; si aún no existe, primero cierra y ya). `Enter` en el título envía. En la nueva, fecha por defecto = hoy.

- [ ] **Step 3: CSS** en `vidrio.css` (al final, antes de las media queries no hace falta; usa variables existentes):

```css
/* Hoja de edición: lateral en escritorio, panel inferior en teléfono */
.v-hoja{margin:0 0 0 auto;height:100dvh;max-height:none;width:min(440px,100vw);border:0;padding:24px;background:rgba(14,16,40,.92);backdrop-filter:blur(30px) saturate(1.4);color:var(--tinta);box-shadow:-30px 0 80px -30px rgba(0,0,0,.8);display:flex;flex-direction:column;gap:14px;overflow-y:auto}
.v-hoja::backdrop{background:rgba(3,4,14,.55)}
.v-hoja .grupo{display:flex;flex-wrap:wrap;gap:6px}
.v-hoja .grupo button[aria-pressed=true],.v-hoja .grupo button[aria-checked=true]{background:var(--v-azul)}
.v-hoja label.etq{font-size:12px;color:var(--tinta-3);text-transform:uppercase;letter-spacing:.08em}
.v-hoja .pie{margin-top:auto;display:flex;gap:8px;flex-wrap:wrap}
@media (max-width:700px){.v-hoja{margin:auto 0 0;width:100vw;max-width:100vw;height:auto;max-height:88dvh;border-radius:26px 26px 0 0;padding-bottom:calc(24px + env(safe-area-inset-bottom))}}
```

- [ ] **Step 4: Layout** — en `(app)/layout.tsx` agrega a `Promise.all` la lectura `supabase.from('proyectos').select('id, espacio_id, nombre').eq('estado', 'activo').order('nombre')` y envuelve **todo** el `<div className="v-escena">` en `<HojaProvider frentes={frentes} proyectos={proyectos ?? []}>`.

- [ ] **Step 5: El +** — en `pildoras.tsx` quita `disabled`, `const abrir = useHoja()` y `onClick={() => abrir({ valores: abierto ? { espacio_id: abierto.id } : {} })}`. Actualiza el comentario: «El + abre la hoja a mano; con Klo (Parte 3) abrirá la captura».

- [ ] **Step 6: Verifica** — `npm run dev`, entra, toca el + en 390 px y escritorio: la hoja abre, crea una tarea para hoy (aún no se ve en Hoy: llega en Task 7). Confírmalo en Supabase: `npx supabase db query "select titulo, fecha from tareas order by creado_en desc limit 1"` (o con `node` + `pg` como `probar-db.mjs`) .
- [ ] **Step 7:** `npx tsc --noEmit`, `npm run lint`, `npm test` → limpios. **Commit y push** — `feat: hoja de edición de tareas y el + que la abre`

---

### Task 7: Hoy con tareas reales

**Files:**
- Create: `src/components/tareas/renglon-tarea.tsx`, `src/components/tareas/toast.tsx`
- Modify: `src/components/vidrio/mosaicos.tsx`, `src/app/(app)/hoy/page.tsx`, `src/components/hoja/hoja-provider.tsx` (monta el toast), `src/app/vidrio.css`

- [ ] **Step 1: Toast** — `toast.tsx`: contexto `useToast()` que devuelve `avisar(texto, deshacer?: () => void)`; muestra un `.v-toast` fijo abajo (por encima de las píldoras) 5 s con botón «Deshacer». Móntalo dentro de `HojaProvider` (un solo proveedor en el layout).

- [ ] **Step 2: `renglon-tarea.tsx`** (cliente) — props `{ tarea, frente?: FrenteVista, detalle: string }`. Render: `<li className="v-renglon">` con botón `.v-palomita` (`aria-pressed={hecha}`, `aria-label="Marcar «titulo»"`) y un botón `.txt` que abre la hoja (`abrir({ tarea })`) con `<b>` título (tachado si hecha) y `<small>` = `detalle` + `· inicial nombre` del frente si se pasa. Palomita: estado optimista `useOptimistic`/`useState`, llama `completarTarea(id, !hecha)` y `avisar('Hecha', () => completarTarea(id, false))` al marcar.

```css
.v-palomita{width:26px;height:26px;flex:none;border-radius:50%;box-shadow:inset 0 0 0 2px var(--tinta-3);display:grid;place-items:center;transition:background .2s}
.v-palomita[aria-pressed=true]{background:var(--v-azul);box-shadow:none}
.v-palomita[aria-pressed=true]::after{content:"";width:10px;height:6px;border:2px solid #fff;border-top:0;border-right:0;transform:rotate(-45deg) translate(1px,-1px)}
.v-renglon.hecha .txt b{text-decoration:line-through;color:var(--tinta-3)}
.v-renglon .txt{text-align:left}
.v-renglon .vencida{color:var(--tinta);font-weight:600}
.v-vivo{display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--v-azul);box-shadow:0 0 0 4px rgba(42,68,255,.25);margin-right:6px}
.v-toast{position:fixed;left:50%;bottom:calc(96px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:60;display:flex;gap:12px;align-items:center;padding:10px 14px 10px 18px;border-radius:99px;background:rgba(14,16,40,.95);box-shadow:inset 0 0 0 1px var(--v-borde),0 20px 50px -20px #000;font-size:14px}
```

- [ ] **Step 3: Mosaicos** — en `mosaicos.tsx`:
  - `MosaicoMedidor`: el vacío cambia a «Nada pendiente hoy. Captura con el +.» cuando `total === 0`, y «¡Todo listo por hoy!» cuando `pendientes === 0 && hechas > 0`.
  - Nuevo `MosaicoLista({ titulo, chip?, vacio, ancho, i, children })`: igual que `MosaicoSimple` pero con `<ul className="v-lista">{children}</ul>` si hay hijos, si no el `v-sub` vacío. Muestra máx. 6 renglones con «y N más» abajo (el corte lo hace la página).
  - `MosaicoFrente` recibe `resumen?: { hoy: number; riesgo: number }` y pinta `«N hoy · M en riesgo»` o `«N hoy · Al día»`.
  - `MosaicoProyectos({ proyectos, hoy, frenteNombre?, i })`: hasta 2 (o todos dentro de un frente) con nombre, `porcentaje(avance)` y una `.v-barra-avance` (`<i style={{width}}/>`); vacío con enlace «Nuevo proyecto» a `conFrente('/proyectos', atajo)`.

```css
.v-barra-avance{height:6px;border-radius:99px;background:rgba(255,255,255,.1);overflow:hidden}
.v-barra-avance i{display:block;height:100%;background:linear-gradient(90deg,#2a44ff,#7b4dff,#ff5f8f)}
```

- [ ] **Step 4: `hoy/page.tsx`** — agrega en el `Promise.all`: `leerMisTareas()` (todas; el filtro por frente se hace en memoria con `frente?.id` para que el panorama tenga todo), `leerProyectos()` y `contextoAhora()`. Luego:

```ts
const delFrente = frente ? tareas.filter((t) => t.espacio_id === frente.id) : tareas
const hoyCalc = calcularHoy(delFrente, ctx)
const riesgo = enRiesgo(delFrente, ctx.hoy)
const resumen = resumenPorFrente(tareas, ctx)
const nombreDe = new Map(frentes.map((f) => [f.id, f]))
const detalle = (t: Tarea) => t.fecha && t.fecha < ctx.hoy ? `vencida · ${etiquetaDia(t.fecha, ctx.hoy)}${t.hora ? ' ' + hhmm(t.hora) : ''}` : 'hoy'
```

  - `medidor` → `hechas={hoyCalc.hechas} pendientes={hoyCalc.pendientes} siguiente={hoyCalc.siguiente?.titulo ?? null}`.
  - `de_un_toque` → `MosaicoLista` con `RenglonTarea` por cada `hoyCalc.deUnToque` (vencidas con clase `vencida` en el `small`), chip `${n}`; vacío «Nada por palomear.».
  - `tu_dia` → `MosaicoLista` con `hoyCalc.tuDia`: detalle `hh:mm–hh:mm`; la que ocurre ahora (`hora ≤ ahora < hora_fin`, o `hora ≤ ahora` y sin fin dentro de la misma hora) lleva `<span className="v-vivo"/>Ahora`; vacío «Sin horas fijas hoy.».
  - `en_riesgo` → `MosaicoLista` (ancho 1) con detalle `etiquetaDia` («vencida» si `< hoy`); vacío «Nada en riesgo.».
  - `proyectos` → `MosaicoProyectos` con `proyectos` filtrados al frente (todos) o los 2 primeros (ya vienen ordenados por `fecha_meta`).
  - `frentes` → pasa `resumen.get(f.id)`.
  - Pasa `frente` a cada `RenglonTarea` solo en «Todos».
  - `klo` → frase: sin pendientes «Hoy vas libre. Si algo sale, dale al +.»; con `siguiente` «Lo que sigue: {titulo}.»; si no «Te quedan {n} por hacer hoy.».

- [ ] **Step 5: Verifica en el navegador** (390 px y 1280 px): crea con el + una tarea de hoy sin hora, una con hora en 1 h, una vencida (ayer) y una entrega para mañana. Revisa medidor, De un toque (vencida arriba en negrita), Tu día, En riesgo, frente con «N hoy», palomea y Deshacer, abre una tarea y edítala, bórrala y Deshacer, abre un frente y confirma que solo ves lo suyo y que el + preelige ese frente.
- [ ] **Step 6:** tsc, lint, test → limpios. **Commit y push** — `feat: Hoy con tus tareas reales, palomita y Deshacer`

---

### Task 8: Notas

**Files:** Create `src/app/(app)/notas/acciones.ts`, `src/app/(app)/notas/lista-notas.tsx`; Modify `src/app/(app)/notas/page.tsx`, `src/app/vidrio.css`

- [ ] **Step 1: Acciones** — `crearNota(espacioId, texto)`, `editarNota(id, texto)`, `borrarNota(id, borrar = true)`; mismas formas que `tareas/acciones.ts` (trim, 1–4000, `revalidatePath('/', 'layout')`, mensajes en segunda persona).
- [ ] **Step 2: Página** (servidor) — lee frentes y `notas` (`id, espacio_id, texto, creado_en`) con `borrado_en is null` y `convertida_en_tarea_id is null`, más nuevas arriba, filtradas por `?frente=` (mismo patrón de `searchParams` que Hoy). Renderiza `<section className="v-bento">` con `ListaNotas`. Si no hay notas, debajo del campo se ve el `Vacio` actual.
- [ ] **Step 3: `lista-notas.tsx`** (cliente) — arriba un `v-t c2` con `<textarea className="v-campo">` («Escribe una idea…»), selector de frente (si estás en «Todos» y hay >1; si no, el abierto) y botón «Guardar nota»; ⌘/Ctrl+Enter guarda. Debajo cada nota como `.v-t .v-nota` con el texto (`white-space: pre-wrap`), inicial del frente y fecha corta; acciones: **Editar** (cambia a textarea en sitio, guarda al salir), **Borrar** (toast con Deshacer) y **Volver tarea** → `abrir({ valores: { titulo: texto.slice(0, 200), espacio_id }, notaId: id })`. Al guardar la tarea, la acción liga la nota y deja de mostrarse.

```css
.v-nota p{white-space:pre-wrap;font-size:15px;line-height:1.5}
.v-nota .acciones{display:flex;gap:6px;margin-top:auto;flex-wrap:wrap}
```

- [ ] **Step 4: Verifica** en el navegador: crear, editar, borrar + Deshacer, Volver tarea → aparece en Hoy y la nota se va; dentro de un frente solo sus notas.
- [ ] **Step 5:** tsc, lint, test. **Commit y push** — `feat: notas por frente que se vuelven tarea`

---

### Task 9: Proyectos simples

**Files:** Create `src/app/(app)/proyectos/acciones.ts`, `src/app/(app)/proyectos/nuevo-proyecto.tsx`, `src/app/(app)/proyectos/[id]/page.tsx`, `src/app/(app)/proyectos/[id]/editar-proyecto.tsx`; Modify `src/app/(app)/proyectos/page.tsx`

- [ ] **Step 1: Esquema y acciones** — en `acciones.ts` un zod `esquemaProyecto` (`espacio_id` uuid, `nombre` 1–80, `meta` ≤ 200, `fecha_meta` fecha o nulo, `modo_avance` `tareas`|`manual`, `cifra_meta` número > 0 requerido si manual, `cifra_actual` ≥ 0). Acciones: `crearProyecto(datos)` → devuelve id; `editarProyecto(id, datos)`; `sumarCifra(id, delta)` (lee y escribe `cifra_actual`, mínimo 0); `cambiarEstado(id, estado)` (`activo`|`pausado`|`cerrado` — «Archivar» = cerrado).
- [ ] **Step 2: Rejilla** (`page.tsx`, servidor) — `leerProyectos({ espacioId: frente?.id, soloActivos: false })`, separa activos y el resto («Pausados y cerrados», plegado con `<details>`). Tarjeta `v-t c2` con color del frente (`v-color-*` solo en la inicial), nombre, meta, `porcentaje(avance)`, `.v-barra-avance`, «N de M tareas» o «cifra de meta», y «faltan N días» / «venció hace N días» con `diasRestantes`; enlace a `conFrente('/proyectos/' + id, atajo)`. Arriba el botón «Nuevo proyecto» (`NuevoProyecto`). Vacío: el `Vacio` actual + el botón.
- [ ] **Step 3: `nuevo-proyecto.tsx`** (cliente) — `<details>` o diálogo con: nombre, frente (preelegido el abierto), meta, fecha meta, modo («Por tareas» / «Por cifra» con cifra meta). Al crear, `router.push` al detalle.
- [ ] **Step 4: Detalle** (`[id]/page.tsx`) — lee el proyecto (404 con `notFound()` si no hay) y sus tareas no borradas (`proyecto_id = id`, todas, ordenadas por fecha). Muestra `EditarProyecto` (mismos campos, guarda al salir del campo), el avance grande, botón **+1** si es manual, **Pausar/Reactivar/Archivar**, la lista de tareas con `RenglonTarea` y un botón «Agregar tarea» → `abrir({ valores: { espacio_id, proyecto_id: id } })`.
- [ ] **Step 5: Verifica** — crea un proyecto por tareas y otro por cifra; liga 3 tareas y palomea una (33 %); +1 en el manual; mira la tarjeta Proyectos de Hoy y el mosaico del frente.
- [ ] **Step 6:** tsc, lint, test. **Commit y push** — `feat: proyectos con meta, avance y tareas ligadas`

---

### Task 10: e2e, verificación completa y producción

**Files:** Create `e2e/tareas.spec.ts`; Modify `e2e/armazon.spec.ts` si algún texto de vacío cambió

- [ ] **Step 1: Prueba e2e** — usando la sesión de `sesion.setup.ts`: ir a `/hoy`, tocar `getByRole('button', { name: 'Nuevo' })`, llenar el título con un texto único (`Prueba ${Date.now()}`), Guardar; esperar que aparezca en «De un toque»; tocar su palomita; esperar el toast «Hecha»; el chip del medidor sube. Al final borra la tarea desde la hoja (para no ensuciar la cuenta de pruebas).
- [ ] **Step 2: Corre todo**

```bash
npm test && npm run lint && npx tsc --noEmit && npm run test:db && npm run build && npm run e2e
```
Expected: todo verde. Si e2e de armazón falla por textos de vacío que cambiaron, actualiza la prueba a los textos nuevos.

- [ ] **Step 3: Mira la app** a 390 px y escritorio (Hoy en Todos y en un frente, Notas, Proyectos, la hoja). Nada de rojo/ámbar/verde; textos en segunda persona.
- [ ] **Step 4: Producción** — `git checkout main && git merge --ff-only v0.1/esqueleto && git push origin main && git checkout v0.1/esqueleto`. Vercel despliega solo. Verifica el deploy con la API (`VERCEL_TOKEN`, equipo `team_pxgxRowgzfI14YSsn2yUMal3`, proyecto `prj_Wmew55hhxJonYs5WTvtLTVa0UV4V`): `GET https://api.vercel.com/v6/deployments?projectId=…&teamId=…&limit=1` hasta `state: READY`; luego `curl -sI https://klo-ser-business.vercel.app/entrar` → 200. La migración ya está en el mismo Supabase DEV que usa producción.
- [ ] **Step 5: Commit y push** de la prueba e2e — `test: e2e de capturar y palomear una tarea`
