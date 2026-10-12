# Klo-Ser Business — contexto de arranque

> Paquete preparado el **2026-10-12** desde el repo de Klo-Ser Real Estate (`Inmobiliaria-CRM`)
> para cargar en el repo nuevo, que está vacío. Todo lo que hace falta para arrancar sin tener que
> volver a preguntar lo ya decidido.

---

## 1. Quién y para qué

**Jair Maldonado** — fundador de **Klo-Ser** (la empresa) y de **Top Digital** (su agencia de
marketing). Opera varios frentes a la vez y hoy los tiene repartidos en cabeza, WhatsApp, Google
Calendar y el sistema interno de la agencia.

**Klo-Ser Business** es el sistema donde Jair organiza **todo su trabajo de founder**:

- **Klo-Ser, la startup** — producto, ventas (meta: primer cliente inmobiliario que pague),
  inversionistas, contenido, formalización (SAT, Meta).
- **Top Digital, la agencia** — clientes, entregas de cada mes (carruseles, reels, campañas),
  fechas, quién hace qué.
- **Su marca personal y su vida de calendario** — juntas, bloques de trabajo profundo, pendientes.

**Regla de arranque: solo lo usa Jair.** Un usuario, un espacio. Se pule en su día a día y
**después** se le hace marketing como producto para otros emprendedores. Por eso todo se
construye genérico (sección 7), pero no se frena nada por hacer multi-usuario ahora.

## 2. La familia Klo-Ser

```
                Klo-Ser  (marca madre · empresa de Jair)
                   │
     ┌─────────────┴──────────────┐
 Klo-Ser Real Estate          Klo-Ser Business   ← ESTE REPO
 CRM inmobiliario en          el sistema del founder:
 producción (Montana)         proyectos, entregas, calendario,
 www.klo-ser.com              clientes, dinero, Klo
```

- **Mismo apellido, productos independientes.** Uno ataca el sector inmobiliario; este va «full» a
  negocios, emprendimientos y proyectos. Misma org de GitHub (`Klo-Ser`); la independencia vive
  en repo, Supabase (DEV y PROD), Vercel, dominio y secretos propios.
- **Klo** es la mascota de toda la familia: un gallo azul. En Real Estate ya es un asistente con IA
  (Claude) que propone y el usuario confirma conversando. Aquí será **la forma principal de
  capturar**: le dices «mañana entrego los carruseles de Aurora a las 5» y él lo acomoda.
- Lo que cambia entre hermanos es el **tono visual**: Real Estate es claro, papel y azul sereno
  (para asesores en la calle). **Business es de noche, atrevido y eléctrico** — la estética de
  Top Digital vestida con la marca Klo-Ser. Ver `DISENO.md`.

## 3. Decisiones ya tomadas (no se vuelven a discutir)

| Fecha | Decisión |
|---|---|
| 2026-09-09 | Repo nuevo dentro de la org `Klo-Ser`, totalmente aparte del CRM. |
| 2026-09-09 | Se **hereda código** de Klo-Ser Real Estate (capa «mi día», Klo, push, componentes) y de TOP-DIGITAL-SYSTEM (clientes, tareas por cliente, calendario multi-fuente); **el esquema NO se hereda**: base nueva desde `0001`. |
| 2026-09-09 | Sin paquete compartido de UI por ahora: `referencia/klo-ser-real-estate/estilos.ts` se copia y se adapta. |
| 2026-09-18 | Klo-Ser es la marca madre con dos mitades: Real Estate y Emprendedores. |
| 2026-09-23 | Los dos productos son independientes entre sí. Org aparte solo si se vuelve otra empresa. |
| 2026-10-12 | Nombre: **Klo-Ser Business**. Ícono: K blanca sobre el amanecer (`marca/icono-business/`). |
| 2026-10-12 | **Estilo: oscuro por defecto, atrevido, en la línea de Top Digital**, con el logo y Klo de Klo-Ser. Primer usuario: Jair. |

Nombre (decidido por Jair el 2026-10-12): **Klo-Ser Business**. Repo: `jairmaldonador8/Klo-Ser-Business` (cuenta personal; se puede transferir a la org `Klo-Ser` cuando haga falta).


## 4. Los módulos (mapa de 11, a marcar por Jair)

El mapa salió del brainstorming del 2026-09-09. Marcado con ★ lo recomendado para la **v0.1**
(lo mínimo para que Jair deje WhatsApp-como-agenda desde la primera semana).

| # | Módulo | De dónde viene | v0.1 |
|---|---|---|---|
| 1 | **Hoy** — lo que toca hoy, cada cosa dice a qué proyecto/cliente pertenece; el bloque que sigue en grande | Real Estate («Para hoy», «Mi semana») | ★ |
| 2 | **Proyectos y objetivos** — meta, fecha, siguiente paso, avance. Lo que ninguno de los dos sistemas tiene y lo primero que pide un founder | NUEVO | ★ |
| 3 | **Tareas y entregas** — cuelgan del proyecto o del cliente; una entrega es una tarea con fecha de cliente y evidencia | TDS + Real Estate | ★ |
| 4 | **Calendario** — día/semana, varias fuentes (Google, iCal) y feed de salida a Google | Klo Calendar (RE) + calendario multi-fuente (TDS) | ★ |
| 5 | **Clientes** — ficha ligera de cada cliente de la agencia: qué se le entrega cada mes, estado del mes, contacto | TDS (sin Meta ni portal) | ★ |
| 6 | **Equipo y encargos** — delegar a diseñador/editor y ver evidencia | TDS | después |
| 7 | **Muro de notas** — ideas sueltas, captura rápida | Real Estate | ★ |
| 8 | **Klo, el asistente** — captura por texto/voz, resume el día, propone y tú confirmas | Real Estate (Claude) | ★ (texto) |
| 9 | Chat equipo/clientes | TDS | no (WhatsApp lo cubre) |
| 10 | Campañas y Meta | TDS | no (se queda en TDS) |
| 11 | **Dinero** — qué te deben, qué debes, cuándo cae. Sin contabilidad | NUEVO | después |

**Preguntas abiertas para el brief** (contestarlas antes del primer spec):

1. ¿Qué frentes tienes hoy, con nombre? (Klo-Ser, Top Digital, marca personal, ¿otro?)
2. ¿Cómo capturas hoy un pendiente cuando vas en la calle?
3. ¿Qué es lo primero que quieres ver en la mañana?
4. ¿La captura rápida crea tarea, nota o decide sola según lo que escribas?
5. ¿El calendario manda (todo es bloque con hora) o la lista manda (tareas sin hora y el calendario
   solo muestra juntas)?
6. ¿Cuál es tu papel en Top Digital y cuál el de Tadeo? (qué entregas haces tú y cuáles delegas)

## 5. Lo que se hereda y de dónde

**De Klo-Ser Real Estate** (repo `Klo-Ser/Inmobiliaria-CRM`, carpeta de referencia en
`referencia/klo-ser-real-estate/`):

- La marca completa (`marca/`): wordmark, Klo, cabeza, monograma, íconos de app, 50 ornamentos.
- Componentes de marca en `marca/componentes/` (`wordmark.tsx`, `klo.tsx`, `ornamentos.tsx`,
  `vacio-klo.tsx`, `klo-festeja.tsx`): SVG en línea con `currentColor`, listos para copiar a
  `src/components/marca/`. Dependen de `cn()` de `@/lib/utils` (shadcn).
- El idioma de clases (`estilos.ts`): MICRO, HEROE, PUNTO_VIVO, PILDORA, TARJETA_MANDA… — aquí se
  re-calibran para noche.
- Patrones probados en producción: PWA + Web Push (VAPID), «Hoy»/«Mi semana», Klo con Claude
  (herramientas de lectura con la sesión + propuestas que el usuario confirma), tareas que se
  repiten, conexión con Google Calendar (OAuth, refresh token cifrado, cron de reintento).

**De TOP-DIGITAL-SYSTEM** (repo en `OneDrive\Documents\GitHub\TOP-DIGITAL-SYSTEM`, la app vive
en el worktree `.claude/worktrees/sistema/`): ver `referencia/top-digital/README.md`.

## 6. Stack

Mismo que los hermanos, para poder copiar código sin traducir:

- **Next.js** (App Router, la versión vigente del CRM — revisar `node_modules/next/dist/docs/`),
  React, TypeScript estricto, **Tailwind v4** (tokens en `globals.css` con `@theme`), shadcn/ui.
- **Supabase**: Postgres + Auth + RLS + Storage + pg_cron. Dos proyectos: DEV y PROD.
- **Vercel** para el deploy (o GitHub Actions → Vercel, como el CRM).
- **Claude** (Anthropic API, modelo vigente de la familia Claude 5) para Klo.
- Vitest para pruebas; Playwright para capturas a 390 px.

## 7. Pensado para venderse después

Hoy un solo usuario; mañana otros founders. Sin frenar nada:

- Toda tabla nace con `espacio_id` (o `owner_id`) y policies que filtran por él.
- Nada de «Jair», «Top Digital» o nombres de clientes escritos en el código: son datos o configuración.
- Frentes, tipos de entrega y etapas son **configurables con valores de fábrica**, nunca enums
  cerrados.
- Una sola base de código; lo que cambie entre usuarios vive en su configuración.

## 8. Primeros pasos sugeridos en el repo nuevo

1. Copiar esta carpeta a la raíz del repo (`CLAUDE.md`, `CONTEXTO.md`, `DISENO.md`, `marca/`,
   `diseno/`, `referencia/`). Mover los SVG de `marca/logos/azul|blanco` y `marca/ornamentos` a
   `public/marca/` cuando exista el proyecto Next.
2. Abrir `diseno/prototipo.html` en el navegador: esa es la cara que buscamos.
3. **Brief** (`docs/ultrapowers/specs/brief.md`): contestar las 6 preguntas de la sección 4 y marcar
   los módulos.
4. Spec de la v0.1 → plan → `create-next-app` + Supabase DEV + migración `0001_espacios_proyectos_tareas.sql`.
5. Primera pantalla: **Hoy**, con datos reales de Jair desde el día uno.
