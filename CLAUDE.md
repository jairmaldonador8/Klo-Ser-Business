# Klo-Ser Business — reglas de la casa para agentes

Este repo es **Klo-Ser Business** (la mitad de Klo-Ser para emprendedores): el sistema personal de Jair Maldonado para organizar
su vida de founder (Klo-Ser la startup, su agencia Top Digital, entregas, calendario, dinero).
Es hermano de **Klo-Ser Real Estate** (el CRM inmobiliario en producción), pero **independiente**:
repo, Supabase, Vercel, dominio y secretos propios. Nada se comparte en vivo con el CRM.

Lee primero, en este orden:

1. `CONTEXTO.md` — quién, qué, por qué, módulos, decisiones y lo que falta decidir.
2. `DISENO.md` — la ley visual «Klo-Ser Noche» (oscuro, atrevido, azul eléctrico).
3. `diseno/prototipo.html` — la referencia visual viva. Si hay duda de cómo se ve algo, se abre
   el prototipo; no se inventa.

## Lo que NUNCA se hace

- **Commitear secretos.** `.env*` va en `.gitignore` desde el commit 1. Si aparece una llave en el
  chat, se dice y se pide rotarla.
- **Tocar la marca.** El wordmark Klo-Ser, el monograma K y Klo (el gallo) no se redibujan, no se
  recolorean fuera de su paleta, no se deforman. **Klo va SIEMPRE azul `#1c36ee`**, nunca se pinta
  de blanco. En la app (dirección negra, 2026-10-18) va solo sobre el negro, sin disco ni sol atrás.
- **Mezclar datos de clientes de la agencia en commits, docs o capturas.** Los datos reales viven
  en la base, no en el repo.
- **Colores de semáforo para estado** (rojo/ámbar/verde). La urgencia se dice con tinta, peso y el
  punto azul vivo. Ver `DISENO.md`.

## Cómo se trabaja

- Proceso por área, igual que en Real Estate: brief → decisiones → spec revisado contra el código →
  plan → construir. Specs y planes en `docs/ultrapowers/specs/` y `docs/ultrapowers/plans/`.
- Rama por área desde `main`; commits chicos en español que cuentan el *por qué*.
- Antes de dar algo por terminado: `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`
  — y **verde no basta**: se abre la app en teléfono (390 px) y escritorio y se mira.
- **Migraciones** (`supabase/migrations/`): aditivas, numeradas `0001_…`, cada tabla con RLS desde
  el día uno y su test. Toda tabla se piensa con `owner_id`/`espacio_id` aunque hoy solo la use
  Jair: el producto se venderá después a otros founders.
- Jair aprueba viendo la app corriendo en **localhost**, no en previews.
- Next.js de este stack puede traer cambios que no conoces: lee la guía en
  `node_modules/next/dist/docs/` antes de escribir código y respeta los avisos de deprecación.

## Voz

Español de México, directo y cálido. Mensajes de la app en segunda persona («Te quedan 3
entregas hoy»). Klo habla corto, como un socio que te cuida la agenda — sin «te late» ni
«chance» en textos formales que salgan hacia clientes.
