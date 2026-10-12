# Referencia: TOP-DIGITAL-SYSTEM

El sistema interno de la agencia Top Digital. De aquí sale **el carácter visual** de Klo-Ser
Business (oscuro, degradado, cifras gordas, resplandores) y la **columna de negocio** (clientes,
entregas, calendario multi-fuente). No se conecta en vivo con este repo: se copia y se adapta.

- Repo: `OneDrive\Documents\GitHub\TOP-DIGITAL-SYSTEM`. La app vive en el worktree
  `.claude\worktrees\sistema` (rama `fase-1`). La raíz (rama `contenido`) es la producción de
  contenido de los clientes; la rama `sitio-web` es el sitio público.
- Stack: Next 16.2, React 19.2, Tailwind 4, shadcn 4 (base-ui), Supabase ssr, web-push, date-fns,
  dnd-kit, vitest, playwright. Igual que Klo-Ser Real Estate: el código se puede mover sin traducir.

## Archivos copiados aquí

| Archivo | Para qué sirve |
|---|---|
| `globals.css` | Tokens completos del tema oscuro, degradado `bg-marca`/`text-marca`, view transitions, animaciones (`crecer-y/x`, `dona`, `trazo`, tachado), reduced-motion |
| `sidebar.tsx` | Navegación con la **píldora degradada** que se desliza entre secciones (view transition `.pildora-nav`) |
| `stat-card.tsx` | `StatCard` y su variante `destacada` (degradado + sparkline que crece) — la «tarjeta que manda» de TD |
| `mi-dia/` | El inicio «Mi día» (spec agenda-tadeo): tarjeta de conteo, línea de citas, pendientes de un toque, entregas del equipo, botón «+» |
| `0019_calendario.sql`, `0023_agenda.sql` | Calendario con 4 fuentes y agenda con espejo de Google (`google_event_id`, `etag`, `borrado_en`) |
| `migraciones.txt` | La lista de las 23 migraciones, para ver el orden en que se construyó |

## Lo que se toma y lo que no

**Se toma:** el fondo casi negro, el degradado con intención (una tarjeta protagonista por
vista), las cifras grandes en negrita que cuentan de 0 al valor, los auras difuminados detrás de la
tarjeta héroe, la píldora degradada en la navegación, el «+» central con resplandor, las
transiciones de vista con blur, las cards que suben 2 px al pasar el mouse.

**Se cambia:** la paleta violeta → magenta → naranja se vuelve el **amanecer de Klo-Ser** (azul →
violeta → coral → sol). Ver `DISENO.md`.

**No se toma:** el semáforo (emerald/amber/red) para estados — en la familia Klo-Ser la urgencia
se dice con tinta, peso y el punto vivo. Tampoco Meta Ads, el portal del cliente ni el chat:
se quedan en TDS.

## Cómo organiza el trabajo la agencia (lo que el sistema tiene que entender)

- Entregable fijo por cliente: 3 anuncios en imagen + 3 carruseles al mes (1080×1350), ~60 piezas
  al mes en total, con pauta que arranca el día 1 o el 15.
- Flujo por pieza: estrategia (PDF) → `post.html` → builder en Node que saca los PNG y una hoja de
  contacto → correcciones → `copy.md` → Drive «Post Terminados».
- Por cliente: `clientes/<slug>/` con `BRIEF.md`, `marca/marca.json`, `estilo.css` y los `copy.md`
  de cada mes.

Eso se traduce en Business a: **cliente → entregas del mes (piezas con estado y fecha de
pauta) → evidencia (liga a Drive)**, y en un tablero que diga cuántas piezas faltan para el 1 y
para el 15.
