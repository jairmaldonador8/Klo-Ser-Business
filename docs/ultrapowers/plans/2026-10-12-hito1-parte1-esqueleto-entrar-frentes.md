# Hito 1 · Parte 1 — Esqueleto, entrar y frentes · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use ultrapowers:subagent-driven-development (recommended) or ultrapowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Una app Next.js 16.4 con la cara «Klo-Ser Noche», en la que Jair entra con Google (solo si su correo está permitido), da de alta sus frentes la primera vez y ve el armazón navegable (Hoy, Proyectos, Semana, Clientes, Notas) en teléfono y escritorio.

**Architecture:** Next.js App Router con Server Components y Server Actions sobre Supabase local (Docker). La tenencia vive en la base: `espacios` + `miembros` con RLS y la función `private.es_miembro`. La lógica que decide (navegación, saludo, rutas, atajos de frente) va en funciones puras con Vitest; la base se prueba con pgTAP. El CSS del prototipo se porta tal cual como capa de componentes de Tailwind v4.

**Tech Stack:** Next.js 16.4 · React 19.3 · TypeScript estricto · Tailwind 4.3 · shadcn (Base UI) · `@supabase/ssr` 0.12 · `@supabase/supabase-js` 2.117 · Supabase CLI 2.120 · Vitest 5 · pgTAP · Playwright 1.64.

**Hito 1 = 3 partes.** Parte 1 (este plan) → Parte 2: `0002` + tareas + **Hoy** → Parte 3: `0003` + **Klo** + Notas. Las partes 2 y 3 se escriben al terminar la anterior, revisadas contra el código real (proceso de `CLAUDE.md`).

**Fuentes de verdad:** spec `docs/ultrapowers/specs/2026-10-12-v0.1-design.md` · investigación `docs/ultrapowers/research/2026-10-12-v0.1-research.md` · `DISENO.md` y `diseno/prototipo.html` (mandan en lo visual) · `CLAUDE.md` (reglas).

**Skills:** @next16-pwa-noche · @supabase-espacios-rls · @ultrapowers-dev:typescript-best-practices · @ultrapowers-dev:testing-tdd · @vercel:shadcn · @supabase:supabase

**Preferencias:** auto-commit ON, auto-push ON → cada tarea termina con commit + push.

**Repo:** `C:\dev\klo-ser-business` (Git Bash: `/c/dev/klo-ser-business`). Todas las rutas de este plan son relativas a esa carpeta.

---

## Mapa de archivos

| Archivo | Responsabilidad |
|---|---|
| `package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`, `vitest.config.mts` | Proyecto y herramientas |
| `src/app/globals.css` | Tailwind + tokens shadcn mapeados a la noche + `@theme` de `DISENO.md` + utilidades `bg-amanecer`/`text-amanecer` |
| `src/app/noche.css` | CSS del prototipo portado (capas `base` y `components`) |
| `src/app/layout.tsx` | Fuentes, metadatos, viewport, PWA iOS |
| `src/app/manifest.ts` | Manifest de la app instalable |
| `src/app/page.tsx` | `/` → `/hoy` |
| `src/app/entrar/page.tsx`, `src/app/entrar/boton-google.tsx` | Pantalla de entrada |
| `src/app/auth/callback/route.ts` | Canje del código OAuth por sesión |
| `src/app/bienvenida/page.tsx`, `forma-bienvenida.tsx`, `acciones.ts` | Alta de frentes (primer ingreso) |
| `src/app/(app)/layout.tsx` | Exige sesión y frentes; pinta el armazón |
| `src/app/(app)/{hoy,proyectos,semana,clientes,notas}/page.tsx` | Vistas (vacías en esta parte) |
| `src/app/(app)/acciones.ts` | `salir()` |
| `src/components/armazon/*` | Barra lateral, barra del teléfono, encabezado, íconos, vacío |
| `src/components/marca/*` | Componentes de marca copiados de `marca/componentes/` |
| `src/lib/navegacion.ts` | Secciones y sección activa (puro) |
| `src/lib/saludo.ts` | Saludo por hora y fecha larga en la zona del usuario (puro) |
| `src/lib/rutas.ts` | Rutas públicas y destino seguro tras entrar (puro) |
| `src/lib/frentes.ts` | Atajo, inicial y preparación de frentes (puro) |
| `src/lib/supabase/{servidor,navegador}.ts`, `tipos.ts` | Clientes y tipos generados |
| `src/proxy.ts` | Refresco de sesión y redirección a `/entrar` |
| `supabase/config.toml` | Supabase local: auth, Google, hook |
| `supabase/migrations/0001_espacios_y_miembros.sql` | Perfiles, espacios, miembros, RLS, RPC, lista permitida |
| `supabase/tests/000_ayudantes.sql`, `001_espacios.test.sql` | pgTAP |
| `scripts/permitir-correo.mjs` | Agrega un correo a la lista permitida |
| `playwright.config.ts`, `e2e/entrar.spec.ts` | Capturas 390 px y escritorio |
| `public/marca/…`, `public/iconos/…` | SVG de marca e íconos de la app |

---

### Task 1: Rama y comprobaciones

**Files:** ninguno.

- [ ] **Step 1: Llevar los docs aprobados a `main` y abrir la rama del área**

```bash
cd /c/dev/klo-ser-business
git checkout main && git merge --ff-only brief-v0.1 && git push
git checkout -b v0.1/esqueleto
git push -u origin v0.1/esqueleto
```
Expected: `main` avanza a los commits de docs; rama `v0.1/esqueleto` creada.

- [ ] **Step 2: Comprobar herramientas**

```bash
node -v        # >= 20.9 (hay 24.x)
docker info --format '{{.ServerVersion}}'
```
Expected: versión de Node y versión del servidor Docker. **Si `docker info` falla, DETENTE**: Jair debe instalar/abrir Docker Desktop (WSL2). No sigas sin Docker.

---

### Task 2: Esqueleto Next.js 16.4

**Files:**
- Create: `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`, `next-env.d.ts`, `src/app/*` (temporal), `public/*`
- Modify: `.gitignore`

El repo ya tiene archivos (`CLAUDE.md`, `marca/`, …) y `create-next-app` no escribe en carpetas con contenido ajeno: se genera en una carpeta hermana y se copian solo los archivos del proyecto.

- [ ] **Step 1: Ver la versión vigente y las banderas**

```bash
npm view next version
npx create-next-app@latest --help | grep -E "cache-components|agent|use-npm|src-dir|import-alias"
```
Expected: `16.4.x` (si salió el parche de seguridad del 2026-10-14, será `16.4.1` o mayor: usa esa). Anota qué banderas existen.

- [ ] **Step 2: Generar en carpeta temporal**

```bash
cd /c/dev
npx create-next-app@16.4 klo-andamio --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes
```
Si el Step 1 mostró `--no-cache-components` y/o `--no-agent-feedback`, agrégalas al comando. Expected: `Success! Created klo-andamio`.

- [ ] **Step 3: Copiar al repo solo lo del proyecto**

```bash
cd /c/dev/klo-andamio
cp package.json package-lock.json tsconfig.json next.config.ts eslint.config.mjs postcss.config.mjs next-env.d.ts /c/dev/klo-ser-business/
cp -r src public /c/dev/klo-ser-business/
cat .gitignore >> /c/dev/klo-ser-business/.gitignore
cd /c/dev && rm -rf klo-andamio
```
NO copies `README.md`, `CLAUDE.md`, `AGENTS.md` ni `.git` del andamio. Si `next-env.d.ts` no existe todavía, ignora el aviso de `cp`: Next lo crea al primer `dev`/`build`.

- [ ] **Step 4: Ajustar nombre, Cache Components y exclusiones**

En `package.json` cambia `"name"` a `"klo-ser-business"`.

En `next.config.ts` deja exactamente esto (sin `cacheComponents`):
```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {}

export default nextConfig
```

En `tsconfig.json` asegura `"strict": true` y agrega/sustituye `"exclude"`:
```json
"exclude": ["node_modules", "referencia", "marca", "diseno"]
```

En `eslint.config.mjs`, dentro de `globalIgnores([...])` (o el arreglo de ignores que traiga), agrega:
```js
'referencia/**', 'marca/**', 'diseno/**', 'supabase/**', '.claude/**', 'playwright-report/**', 'test-results/**',
```

Deduplica `.gitignore` a mano (quita líneas repetidas como `node_modules`, `.next`, `.env*`, `.vercel`, `*.tsbuildinfo`, `next-env.d.ts` si quedó dos veces). Debe conservar `.env*` y `!.env.example`.

- [ ] **Step 5: Instalar y leer la guía local de Next**

```bash
cd /c/dev/klo-ser-business
npm install
ls node_modules/next/dist/docs/
```
Lee (regla de `CLAUDE.md`) las guías de `proxy`, Server Actions, metadata/manifest, `next/image` y PWA que aparezcan en esa carpeta. Si algo contradice este plan, manda la guía: anótalo en el commit. Ojo conocido: en Next 16 `<Image priority>` está deprecado en favor de `preload`; donde este plan dice `priority`, usa lo que indique la guía.

- [ ] **Step 6: Verificar que arranca**

```bash
npm run build
```
Expected: `✓ Compiled successfully` y ruta `/` generada.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: esqueleto Next 16.4 con TypeScript, Tailwind y ESLint

Generado con create-next-app en carpeta aparte para no pisar el paquete de
arranque. Sin Cache Components (todo es por usuario y así se copia código
de los hermanos sin traducir).

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push
```

---

### Task 3: Vitest y scripts

**Files:**
- Create: `vitest.config.mts`
- Modify: `package.json` (scripts, devDependencies)

- [ ] **Step 1: Instalar**

```bash
npm i -D vitest@5 @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom vite-tsconfig-paths
```

- [ ] **Step 2: Config**

`vitest.config.mts`:
```ts
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
```

- [ ] **Step 3: Scripts**

En `package.json` deja `"scripts"` así:
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint .",
  "typecheck": "tsc --noEmit",
  "test": "vitest run --passWithNoTests",
  "test:db": "supabase test db",
  "db:tipos": "supabase gen types typescript --local > src/lib/supabase/tipos.ts"
}
```

- [ ] **Step 4: Verificar**

```bash
npm test && npm run lint && npm run typecheck
```
Expected: `No test files found, exiting with code 0`, lint sin errores, tsc sin errores.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: Vitest y scripts de verificación

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push
```

---

### Task 4: La ley visual — shadcn, tokens, fuentes y CSS del prototipo

**Files:**
- Create: `src/app/noche.css`, `components.json` (lo crea shadcn), `src/lib/utils.ts` (lo crea shadcn)
- Modify: `src/app/globals.css`, `src/app/layout.tsx`

- [ ] **Step 1: shadcn con Base UI**

```bash
npx shadcn@latest init --help | grep -iE "base|radix|-b"
npx shadcn@latest init -b base
```
Confirma en la ayuda que `-b` es la librería (`base`/`radix`/`aria`) y no el color base; si fuera el color, usa la bandera que la ayuda indique para elegir Base UI.
Acepta los valores por defecto. Expected: crea `components.json` y `src/lib/utils.ts` (con `cn`) y reescribe `src/app/globals.css`.

- [ ] **Step 2: Tokens en `globals.css`**

Abre `src/app/globals.css`. **Conserva** las líneas `@import` que puso shadcn (p. ej. `@import "tailwindcss";`, `@import "tw-animate-css";`, `@import "shadcn/tailwind.css";`) y el bloque `@theme inline { … }` que mapea `--color-background: var(--background)` etc. **Borra** la línea `@custom-variant dark …`, el bloque `.dark { … }` y el bloque `:root { … }` generado. Agrega después de los imports:

```css
@import "./noche.css";

/* «Klo-Ser Noche»: la app es siempre de noche. Los tokens de shadcn apuntan a la paleta de DISENO.md. */
:root {
  color-scheme: dark;
  --radius: 1rem;
  --background: #06071a;
  --foreground: #f3f4fb;
  --card: #11142d;
  --card-foreground: #f3f4fb;
  --popover: #181c3d;
  --popover-foreground: #f3f4fb;
  --primary: #1c36ee;
  --primary-foreground: #ffffff;
  --secondary: #181c3d;
  --secondary-foreground: #f3f4fb;
  --muted: #181c3d;
  --muted-foreground: #a9aed0;
  --accent: #181c3d;
  --accent-foreground: #f3f4fb;
  --destructive: #ff5f8f;
  --border: #242a52;
  --input: #242a52;
  --ring: #7b4dff;
}

@theme {
  --color-noche: #06071a;
  --color-noche-2: #0c0e24;
  --color-tarjeta: #11142d;
  --color-tarjeta-alta: #181c3d;
  --color-linea: #242a52;
  --color-tinta: #f3f4fb;
  --color-tinta-2: #a9aed0;
  --color-tinta-3: #6b7199;
  --color-azul: #1c36ee;
  --color-azul-luz: #7181f4;
  --color-violeta: #7b4dff;
  --color-rosa: #ff5f8f;
  --color-sol: #ffc933;
  --font-sans: var(--font-poppins), system-ui, sans-serif;
  --font-titulo: var(--font-fredoka), system-ui, sans-serif;
  --font-mano: var(--font-caveat), cursive;
}

@utility bg-amanecer {
  background-image: linear-gradient(100deg, #1c36ee 0%, #7b4dff 38%, #ff5f8f 70%, #ffc933 100%);
}

@utility text-amanecer {
  background-image: linear-gradient(100deg, #7181f4 0%, #9b7bff 35%, #ff7fa6 70%, #ffd25c 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
```
Si el bloque `@theme inline` de shadcn ya define `--font-sans`, quítalo de ahí (manda el de arriba).

- [ ] **Step 3: Portar el CSS del prototipo a `src/app/noche.css`**

Copia todo lo que hay entre `<style>` y `</style>` de `diseno/prototipo.html` a `src/app/noche.css` y aplica, en orden, estas reglas (no inventes estilos nuevos):

1. En `:root`, sustituye las tres variables de fuente por:
   ```css
   --fredoka: var(--font-fredoka), system-ui, sans-serif;
   --poppins: var(--font-poppins), system-ui, sans-serif;
   --mano: var(--font-caveat), cursive;
   ```
2. Envuelve `:root`, `*{…}`, `html,body{…}`, `body{…}`, `body::after{…}`, `button{…}`, `img{…}` y el bloque `@media (prefers-reduced-motion:reduce){…}` en `@layer base { … }`.
3. Envuelve **todo lo demás** en `@layer components { … }` (los `@keyframes` pueden quedar fuera de la capa).
4. Borra la regla `.text-amanecer{…}` (ya es `@utility`).
5. Sustituye `.nav button` → `.nav a` (en todas sus apariciones) y `.barra-tel button` → `.barra-tel :is(a,button)`.
6. `.vista{display:none}` y `.vista.activa{…}` se vuelven una sola regla: `.vista{animation:vista-entra .48s var(--ease) both}`.
7. Modo teléfono: toma **solo** las reglas cuyo selector empieza con `.app.tel` o `.tel ` y muévelas a un bloque `@media (max-width: 860px) { … }` quitando el prefijo (`.app.tel` → `.app`; `.tel .lado` → `.lado`; `.tel .barra-tel{display:flex;…}` → `.barra-tel{display:flex;…}`). **Ese bloque `@media` va al final de `@layer components`**, después de todas las demás reglas: al quitar `.tel` la especificidad queda igual y gana lo que va después (si no, `.marca-tel{display:none}` le gana al teléfono y el wordmark nunca aparece). Las reglas de esa sección que **no** empiezan con `.tel` (`.marca-tel{…}`, `.marca-tel img`, `.marca-tel span`, `.barra-tel{display:none}`, `.barra-tel :is(a,button)…`, `.barra-tel .mas…`) se quedan fuera del media, antes de él.
8. Borra todo lo de `.ver-tel`, `.solo-escritorio` y `.marco` (solo eran del prototipo). En el selector agrupado `.tel .captura kbd,.tel .barra .btn-amanecer,.tel:not(.marco) .ver-tel.solo-escritorio{display:none}` quita la tercera parte y mueve las dos primeras (sin `.tel`) al bloque del teléfono.
9. Zonas seguras de iPhone (la app instalada usa `viewport-fit=cover` + barra translúcida): dentro del `@media` del teléfono, `.principal` lleva `padding-top: max(18px, env(safe-area-inset-top))` y `.barra-tel` lleva `bottom: calc(14px + env(safe-area-inset-bottom))`. Es lo único nuevo que se agrega al CSS portado.

- [ ] **Step 4: Fuentes y layout raíz**

`src/app/layout.tsx`:
```tsx
import type { Metadata, Viewport } from 'next'
import { Caveat, Fredoka, Poppins } from 'next/font/google'
import './globals.css'

const poppins = Poppins({ variable: '--font-poppins', subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] })
// La redonda hermana del wordmark: titulares, saludos, nombres de proyecto.
const fredoka = Fredoka({ variable: '--font-fredoka', subsets: ['latin'], weight: ['500', '600', '700'] })
// Notas a mano, con cuentagotas.
const caveat = Caveat({ variable: '--font-caveat', subsets: ['latin'], weight: ['700'] })

export const metadata: Metadata = {
  title: 'Klo-Ser Business',
  description: 'El sistema con el que organizas tu trabajo de founder.',
  appleWebApp: { capable: true, title: 'Business', statusBarStyle: 'black-translucent' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#06071a',
  // Sin cover, env(safe-area-inset-*) vale 0 en iPhone.
  viewportFit: 'cover',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-MX" className={`${poppins.variable} ${fredoka.variable} ${caveat.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 5: Página de prueba temporal**

Sustituye `src/app/page.tsx` por:
```tsx
export default function Inicio() {
  return (
    <main className="principal">
      <div className="micro">Prueba de la ley</div>
      <h1 className="titulo text-4xl">
        Buenas, <span className="text-amanecer">founder</span>
      </h1>
      <p className="cifra text-7xl">66</p>
    </main>
  )
}
```

- [ ] **Step 6: Verificar a ojo**

```bash
npm run dev
```
Abre `http://localhost:3000`: fondo azul-negro con grano, micro-etiqueta con rayita de amanecer, titular en Fredoka con «founder» en degradado y el 66 en Poppins 800. Cierra el servidor. Luego:
```bash
npm run lint && npm run typecheck && npm run build
```
Expected: todo verde.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: ley visual Klo-Ser Noche con shadcn y el CSS del prototipo

Los tokens de shadcn apuntan a la paleta de DISENO.md y el CSS del
prototipo se porta tal cual como capa de componentes: si hay duda de cómo
se ve algo, manda el prototipo.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push
```

---

### Task 5: Marca e íconos de la app

**Files:**
- Create: `src/components/marca/{klo,ornamentos,wordmark,vacio-klo}.tsx`, `public/marca/blanco/*.svg`, `public/marca/azul/*.svg`, `public/iconos/icon-192.png`, `public/iconos/icon-512.png`, `src/app/apple-icon.png`, `src/app/favicon.ico`
- Delete: `public/*.svg` que trajo el andamio (`next.svg`, `vercel.svg`, `file.svg`, `globe.svg`, `window.svg`), `src/app/favicon.ico` del andamio (se sustituye)

- [ ] **Step 1: Copiar**

```bash
mkdir -p src/components/marca public/marca/blanco public/marca/azul public/iconos
cp marca/componentes/klo.tsx marca/componentes/ornamentos.tsx marca/componentes/wordmark.tsx marca/componentes/vacio-klo.tsx src/components/marca/
cp marca/logos/blanco/*.svg public/marca/blanco/
cp marca/logos/azul/*.svg public/marca/azul/
cp marca/icono-business/icon-192.png marca/icono-business/icon-512.png public/iconos/
cp marca/icono-business/apple-icon.png marca/icono-business/favicon.ico src/app/
rm -f public/next.svg public/vercel.svg public/file.svg public/globe.svg public/window.svg
```
`klo-festeja.tsx` NO se copia todavía (depende de `@/lib/festejo`; llega en la Parte 2 con el festejo de cerrar el día). La marca no se toca: los componentes se copian sin modificar sus trazos.

- [ ] **Step 2: Verificar que compilan**

```bash
npm run typecheck && npm run lint
```
Expected: sin errores (dependen solo de `cn` de `@/lib/utils`, que ya existe). Si `vacio-klo.tsx` usa clases de color del tema claro, NO lo edites aún: se usa hasta la Parte 2.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: componentes de marca, SVG e íconos de la app

Klo, wordmark y ornamentos copiados sin tocar sus trazos (la marca no se
redibuja). El ícono es el de Business: K blanca sobre el amanecer.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push
```

---

### Task 6: Lógica pura del armazón (TDD)

**Files:**
- Create: `src/lib/navegacion.ts`, `src/lib/saludo.ts`, `src/lib/rutas.ts`
- Test: `src/lib/navegacion.test.ts`, `src/lib/saludo.test.ts`, `src/lib/rutas.test.ts`

- [ ] **Step 1: Pruebas que fallan**

`src/lib/navegacion.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { SECCIONES, SECCIONES_TELEFONO, seccionActiva } from './navegacion'

describe('seccionActiva', () => {
  it('reconoce la ruta exacta', () => {
    expect(seccionActiva('/hoy')).toBe('/hoy')
  })
  it('reconoce subrutas', () => {
    expect(seccionActiva('/proyectos/123')).toBe('/proyectos')
  })
  it('no confunde prefijos parecidos', () => {
    expect(seccionActiva('/hoyx')).toBeNull()
  })
  it('devuelve null fuera de las secciones', () => {
    expect(seccionActiva('/ajustes')).toBeNull()
  })
})

describe('secciones', () => {
  it('el teléfono muestra cuatro secciones (el + va en medio)', () => {
    expect(SECCIONES_TELEFONO.map((s) => s.ruta)).toEqual(['/hoy', '/semana', '/proyectos', '/clientes'])
  })
  it('Dinero no aparece en la v0.1', () => {
    expect(SECCIONES.some((s) => s.nombre === 'Dinero')).toBe(false)
  })
})
```

`src/lib/saludo.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { fechaLarga, horaEn, saludoPorHora } from './saludo'

describe('saludoPorHora', () => {
  it('mañana, tarde y noche', () => {
    expect(saludoPorHora(8)).toBe('Buenos días')
    expect(saludoPorHora(12)).toBe('Buenas tardes')
    expect(saludoPorHora(19)).toBe('Buenas noches')
  })
  it('agrega el nombre si lo hay', () => {
    expect(saludoPorHora(8, 'Ana')).toBe('Buenos días, Ana')
    expect(saludoPorHora(8, '  ')).toBe('Buenos días')
  })
})

describe('zona horaria', () => {
  const instante = new Date('2026-10-12T15:30:00Z') // 9:30 en Monterrey
  it('horaEn usa la zona del usuario', () => {
    expect(horaEn(instante, 'America/Monterrey')).toBe(9)
  })
  it('fechaLarga en español de México y con mayúscula', () => {
    expect(fechaLarga(instante, 'America/Monterrey')).toBe('Lunes 12 de octubre')
  })
  it('una zona inválida cae a Monterrey en vez de romper', () => {
    expect(horaEn(instante, 'Marte/Olympus')).toBe(9)
  })
  it('el día cambia según la zona', () => {
    const tarde = new Date('2026-10-13T04:00:00Z') // 23:00 del 12 en Monterrey
    expect(fechaLarga(tarde, 'America/Monterrey')).toBe('Lunes 12 de octubre')
  })
})
```

`src/lib/rutas.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { destinoSeguro, esRutaPublica } from './rutas'

describe('esRutaPublica', () => {
  it('entrar, callback y sin conexión son públicas', () => {
    expect(esRutaPublica('/entrar')).toBe(true)
    expect(esRutaPublica('/auth/callback')).toBe(true)
    expect(esRutaPublica('/~offline')).toBe(true)
  })
  it('lo demás exige sesión', () => {
    expect(esRutaPublica('/hoy')).toBe(false)
    expect(esRutaPublica('/bienvenida')).toBe(false)
    expect(esRutaPublica('/entrarx')).toBe(false)
  })
})

describe('destinoSeguro', () => {
  it('acepta rutas relativas', () => {
    expect(destinoSeguro('/proyectos')).toBe('/proyectos')
  })
  it('rechaza dominios externos y protocolo relativo', () => {
    expect(destinoSeguro('https://malo.com')).toBe('/hoy')
    expect(destinoSeguro('//malo.com')).toBe('/hoy')
    expect(destinoSeguro('/\\malo.com')).toBe('/hoy')
  })
  it('sin destino va a Hoy', () => {
    expect(destinoSeguro(null)).toBe('/hoy')
  })
})
```

- [ ] **Step 2: Correr y ver que fallan**

Run: `npx vitest run src/lib`
Expected: FAIL — `Failed to resolve import "./navegacion"` (y los otros dos).

- [ ] **Step 3: Implementar**

`src/lib/navegacion.ts`:
```ts
export type Icono = 'hoy' | 'proyectos' | 'semana' | 'clientes' | 'notas'

export type Seccion = { ruta: string; nombre: string; icono: Icono }

export const SECCIONES: readonly Seccion[] = [
  { ruta: '/hoy', nombre: 'Hoy', icono: 'hoy' },
  { ruta: '/proyectos', nombre: 'Proyectos', icono: 'proyectos' },
  { ruta: '/semana', nombre: 'Semana', icono: 'semana' },
  { ruta: '/clientes', nombre: 'Clientes', icono: 'clientes' },
  { ruta: '/notas', nombre: 'Notas', icono: 'notas' },
]

const RUTAS_TELEFONO = ['/hoy', '/semana', '/proyectos', '/clientes']

/** En el teléfono, Notas se abre desde Hoy y desde el +. */
export const SECCIONES_TELEFONO: readonly Seccion[] = RUTAS_TELEFONO.map(
  (ruta) => SECCIONES.find((s) => s.ruta === ruta)!,
)

export function seccionActiva(pathname: string): string | null {
  const seccion = SECCIONES.find((s) => pathname === s.ruta || pathname.startsWith(`${s.ruta}/`))
  return seccion?.ruta ?? null
}
```

`src/lib/saludo.ts`:
```ts
export function saludoPorHora(hora: number, nombre?: string | null): string {
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches'
  const limpio = nombre?.trim()
  return limpio ? `${saludo}, ${limpio}` : saludo
}

const ZONA_POR_DEFECTO = 'America/Monterrey'

/** Una zona inválida en el perfil no debe tumbar la app: cae a la de fábrica. */
function zonaValida(zona: string): string {
  try {
    new Intl.DateTimeFormat('es-MX', { timeZone: zona })
    return zona
  } catch {
    return ZONA_POR_DEFECTO
  }
}

export function horaEn(instante: Date, zona: string): number {
  const hora = new Intl.DateTimeFormat('es-MX', { hour: 'numeric', hourCycle: 'h23', timeZone: zonaValida(zona) }).format(instante)
  return Number(hora)
}

/** «Lunes 12 de octubre» en la zona del usuario. */
export function fechaLarga(instante: Date, zona: string): string {
  const partes = new Intl.DateTimeFormat('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: zonaValida(zona),
  }).formatToParts(instante)
  const parte = (tipo: Intl.DateTimeFormatPartTypes) => partes.find((p) => p.type === tipo)?.value ?? ''
  const texto = `${parte('weekday')} ${parte('day')} de ${parte('month')}`
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}
```

`src/lib/rutas.ts`:
```ts
const PUBLICAS = ['/entrar', '/auth/', '/~offline']

export function esRutaPublica(pathname: string): boolean {
  return PUBLICAS.some((ruta) => (ruta.endsWith('/') ? pathname.startsWith(ruta) : pathname === ruta))
}

/** Solo rutas internas: evita redirigir a otro dominio tras entrar. */
export function destinoSeguro(destino: string | null): string {
  if (!destino || !destino.startsWith('/') || destino.startsWith('//') || destino.startsWith('/\\')) return '/hoy'
  return destino
}
```

- [ ] **Step 4: Correr y ver que pasan**

Run: `npx vitest run src/lib`
Expected: PASS (3 archivos, 17 pruebas).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: navegación, saludo y rutas como funciones puras

El saludo y la fecha se calculan en la zona horaria del usuario, no la del
servidor, para que «Buenos días» no cambie según dónde corra la app.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push
```

---

### Task 7: Armazón visual, vistas vacías y manifest

**Files:**
- Create: `src/components/armazon/iconos.tsx`, `barra-lateral.tsx`, `barra-telefono.tsx`, `encabezado.tsx`, `vacio.tsx`, `src/app/(app)/layout.tsx`, `src/app/(app)/{hoy,proyectos,semana,clientes,notas}/page.tsx`, `src/app/manifest.ts`
- Modify: `src/app/page.tsx`

En esta tarea el layout pinta el armazón con datos de muestra vacíos; la Task 13 lo conecta a Supabase.

- [ ] **Step 1: Íconos (trazos del prototipo)**

`src/components/armazon/iconos.tsx`:
```tsx
import type { Icono as NombreIcono } from '@/lib/navegacion'

const TRAZOS: Record<NombreIcono | 'mas', React.ReactNode> = {
  hoy: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  proyectos: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  semana: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  clientes: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18.5 14.8c1.6.8 2.6 2.5 3 5.2" />
    </>
  ),
  notas: (
    <>
      <path d="M5 3h10l4 4v14H5z" />
      <path d="M9 11h6M9 15h4" />
    </>
  ),
  mas: <path d="M12 5v14M5 12h14" />,
}

export function Icono({ nombre }: { nombre: NombreIcono | 'mas' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
      {TRAZOS[nombre]}
    </svg>
  )
}
```

- [ ] **Step 2: Barra lateral**

`src/components/armazon/barra-lateral.tsx`:
```tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SECCIONES, seccionActiva } from '@/lib/navegacion'
import { Icono } from './iconos'

export type FrenteLado = { id: string; nombre: string; inicial: string }

/** Alto de cada botón de la nav (44 px) + hueco (4 px): la píldora se desliza de 48 en 48. */
const PASO_PILDORA = 48

export function BarraLateral({ frentes, fraseKlo }: { frentes: FrenteLado[]; fraseKlo: string }) {
  const activa = seccionActiva(usePathname())
  const indice = SECCIONES.findIndex((s) => s.ruta === activa)

  return (
    <aside className="lado">
      <div className="lockup">
        <Image src="/marca/blanco/03-wordmark.svg" alt="Klo-Ser" width={120} height={30} unoptimized priority />
        <span>BUSINESS</span>
      </div>

      <nav className="nav" aria-label="Secciones">
        {indice >= 0 && <div className="pildora" style={{ transform: `translateY(${indice * PASO_PILDORA}px)` }} />}
        {SECCIONES.map((s) => (
          <Link
            key={s.ruta}
            href={s.ruta}
            className={s.ruta === activa ? 'activo' : undefined}
            aria-current={s.ruta === activa ? 'page' : undefined}
          >
            <Icono nombre={s.icono} />
            {s.nombre}
          </Link>
        ))}
      </nav>

      {frentes.length > 0 && (
        <div className="frentes">
          <div className="micro">Frentes</div>
          {frentes.map((f) => (
            <div key={f.id} className="frente">
              <span className="k">{f.inicial}</span>
              {f.nombre}
            </div>
          ))}
        </div>
      )}

      <div className="klo-lado">
        <div className="disco-sol">
          <Image src="/marca/azul/04-gallo-cabeza.svg" alt="" width={26} height={26} unoptimized />
        </div>
        <p>
          <b>Klo:</b> {fraseKlo}
        </p>
      </div>
    </aside>
  )
}
```

- [ ] **Step 3: Barra del teléfono**

`src/components/armazon/barra-telefono.tsx`:
```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SECCIONES_TELEFONO, seccionActiva } from '@/lib/navegacion'
import { Icono } from './iconos'

export function BarraTelefono() {
  const activa = seccionActiva(usePathname())
  const [primeras, ultimas] = [SECCIONES_TELEFONO.slice(0, 2), SECCIONES_TELEFONO.slice(2)]

  const enlace = (s: (typeof SECCIONES_TELEFONO)[number]) => (
    <Link key={s.ruta} href={s.ruta} className={s.ruta === activa ? 'activo' : undefined} aria-current={s.ruta === activa ? 'page' : undefined}>
      <Icono nombre={s.icono} />
      {s.nombre}
    </Link>
  )

  return (
    <nav className="barra-tel" aria-label="Secciones">
      {primeras.map(enlace)}
      {/* El + abre la captura de Klo (Parte 3) o la hoja a mano (Parte 2). */}
      <button type="button" className="mas" aria-label="Nuevo" disabled>
        <Icono nombre="mas" />
      </button>
      {ultimas.map(enlace)}
    </nav>
  )
}
```

- [ ] **Step 4: Encabezado y vacío**

`src/components/armazon/encabezado.tsx`:
```tsx
import Image from 'next/image'
import { fechaLarga, horaEn, saludoPorHora } from '@/lib/saludo'

type Props = { nombre: string | null; zona: string; salir?: () => Promise<void> }

export function Encabezado({ nombre, zona, salir }: Props) {
  const ahora = new Date()
  const inicial = nombre?.trim().charAt(0).toUpperCase() || '·'

  return (
    <header className="barra">
      <div className="marca-tel">
        <Image src="/marca/blanco/03-wordmark.svg" alt="Klo-Ser" width={96} height={24} unoptimized />
        <span>BUSINESS</span>
      </div>
      <div className="saludo">
        <h1>{saludoPorHora(horaEn(ahora, zona), nombre)}</h1>
        <p>{fechaLarga(ahora, zona)}</p>
      </div>
      {/* La captura de Klo se enciende en la Parte 3. */}
      <label className="captura">
        <span className="disco-sol">
          <Image src="/marca/azul/04-gallo-cabeza.svg" alt="" width={20} height={20} unoptimized />
        </span>
        <input placeholder="Díselo a Klo: «mañana entrego los carruseles de Aurora a las 5»" disabled aria-label="Díselo a Klo" />
        <kbd>⌘ K</kbd>
      </label>
      {salir ? (
        <form action={salir}>
          <button className="avatar" title="Salir" aria-label="Salir">
            <span>{inicial}</span>
          </button>
        </form>
      ) : (
        <div className="avatar">
          <span>{inicial}</span>
        </div>
      )}
    </header>
  )
}
```

`src/components/armazon/vacio.tsx`:
```tsx
import Image from 'next/image'

type Props = { antes: string; palabra: string; texto: string }

/** El vacío con Klo del prototipo: titular con una palabra de amanecer. */
export function Vacio({ antes, palabra, texto }: Props) {
  return (
    <div className="vacio">
      <div className="disco-sol">
        <Image src="/marca/azul/02-gallo-completo.svg" alt="" width={76} height={90} unoptimized />
      </div>
      <h2>
        {antes} <span className="text-amanecer">{palabra}</span>
      </h2>
      <p>{texto}</p>
    </div>
  )
}
```

- [ ] **Step 5: Layout del grupo `(app)` y vistas**

`src/app/(app)/layout.tsx` (provisional; la Task 13 lo conecta a Supabase):
```tsx
import { BarraLateral } from '@/components/armazon/barra-lateral'
import { BarraTelefono } from '@/components/armazon/barra-telefono'
import { Encabezado } from '@/components/armazon/encabezado'

export default function LayoutApp({ children }: { children: React.ReactNode }) {
  return (
    <div className="app">
      <BarraLateral frentes={[]} fraseKlo="Cuando me escribas, aquí te digo qué sigue." />
      <main className="principal">
        <Encabezado nombre={null} zona="America/Monterrey" />
        {children}
      </main>
      <BarraTelefono />
    </div>
  )
}
```

`src/app/(app)/hoy/page.tsx`:
```tsx
import { Vacio } from '@/components/armazon/vacio'

export default function Hoy() {
  return (
    <section className="vista">
      <Vacio antes="Aquí va tu" palabra="día" texto="Muy pronto: lo que te toca hoy, tu agenda y lo que sigue." />
    </section>
  )
}
```
Crea las otras cuatro con el mismo patrón y estos textos:
- `proyectos/page.tsx` → función `Proyectos`, `antes="Tus metas, con"`, `palabra="avance"`, `texto="Cada proyecto con su meta, su fecha y su siguiente paso."`
- `semana/page.tsx` → `Semana`, `antes="Tu semana de un"`, `palabra="vistazo"`, `texto="Tus bloques y tus juntas de Google, día por día."`
- `clientes/page.tsx` → `Clientes`, `antes="Tus clientes y sus"`, `palabra="entregas"`, `texto="Qué se le entrega a cada quien este mes y cómo va."`
- `notas/page.tsx` → `Notas`, `antes="Aquí van tus ideas"`, `palabra="sueltas"`, `texto="Escríbele a Klo lo que se te ocurra y aquí aparece, acomodado por frente."`

`src/app/page.tsx`:
```tsx
import { redirect } from 'next/navigation'

export default function Inicio() {
  redirect('/hoy')
}
```

- [ ] **Step 6: Manifest**

`src/app/manifest.ts`:
```ts
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Klo-Ser Business',
    short_name: 'Business',
    description: 'El sistema con el que organizas tu trabajo de founder.',
    start_url: '/hoy',
    display: 'standalone',
    background_color: '#06071a',
    theme_color: '#06071a',
    lang: 'es-MX',
    icons: [
      { src: '/iconos/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/iconos/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
```

- [ ] **Step 7: Verificar a ojo**

```bash
npm run dev
```
Abre `http://localhost:3000` → redirige a `/hoy`. En escritorio: barra lateral con lockup, píldora de amanecer sobre «Hoy», vacío con Klo en disco sol. Navega a Proyectos: la píldora baja. Con DevTools a 390 px: sin barra lateral, wordmark arriba, captura a ancho completo, barra inferior flotante con el + de amanecer, **sin scroll horizontal**. `http://localhost:3000/manifest.webmanifest` responde el JSON. Luego:
```bash
npm test && npm run lint && npm run typecheck && npm run build
```
Expected: verde.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: armazón navegable con barra lateral, barra del teléfono y vistas vacías

Mismas clases y medidas que el prototipo. Dinero no aparece (un botón que
lleva a un vacío es ruido). Manifest con start_url en Hoy para que la app
instalada abra donde está el campo de Klo.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push
```

---

### Task 8: Supabase local

**Files:**
- Create: `supabase/config.toml` (lo crea la CLI), `supabase/.env` (no se versiona), `.env.local` (no se versiona), `.env.example`
- Modify: `package.json` (devDependency `supabase`)

- [ ] **Step 1: CLI e init**

```bash
npm i -D supabase@2.120
npx supabase init
```
Responde **N** a las preguntas de VS Code/Deno. Expected: `Finished supabase init.` y carpeta `supabase/`.

- [ ] **Step 2: Credenciales de Google (las da Jair) — PASO MANUAL**

Jair crea el cliente OAuth (se reutiliza luego para Calendar):
1. https://console.cloud.google.com/ → proyecto nuevo «Klo-Ser Business».
2. *APIs y servicios → Pantalla de consentimiento de OAuth*: tipo **Externo**, nombre «Klo-Ser Business», su correo de soporte. Permisos: `openid`, `email`, `profile`. Agrega su correo como usuario de prueba. (Publicarla «En producción» se hace al conectar Calendar.)
3. *Credenciales → Crear credenciales → ID de cliente de OAuth → Aplicación web*. URI de redirección autorizado: `http://127.0.0.1:54321/auth/v1/callback`.
4. Copia el *Client ID* y el *Client secret* a `supabase/.env`:
```
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=<client id>
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=<client secret>
```
Verifica que no se versiona: `git check-ignore supabase/.env` debe imprimir la ruta. **Si alguna llave aparece en el chat, avisa y pide rotarla.**

- [ ] **Step 3: Configurar auth en `supabase/config.toml`**

Cambia `project_id = "klo-ser-business"`. En la sección `[auth]`:
```toml
site_url = "http://localhost:3000"
additional_redirect_urls = ["http://localhost:3000/auth/callback"]
```
Sustituye la sección `[auth.external.google]` (o agrégala) por:
```toml
[auth.external.google]
enabled = true
client_id = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID)"
secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET)"
redirect_uri = ""
skip_nonce_check = true
```
Deja deshabilitado el registro por correo si existe la opción (`[auth.email] enable_signup = false`): solo se entra con Google.

- [ ] **Step 4: Arrancar**

```bash
npx supabase start
npx supabase status -o env
```
Expected: contenedores arriba; la salida trae `API_URL` y las llaves (`PUBLISHABLE_KEY`/`SECRET_KEY`, o `ANON_KEY`/`SERVICE_ROLE_KEY` si la CLI aún usa las viejas).

- [ ] **Step 5: Variables de la app**

`.env.local` (no se versiona):
```
NEXT_PUBLIC_SUPABASE_URL=<API_URL>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<PUBLISHABLE_KEY o ANON_KEY>
SUPABASE_SECRET_KEY=<SECRET_KEY o SERVICE_ROLE_KEY>
```
`.env.example` (sí se versiona):
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
```

- [ ] **Step 6: Commit**

```bash
git status --short   # NO debe aparecer supabase/.env ni .env.local
git add -A
git commit -m "chore: Supabase local con entrada por Google

Las credenciales viven en supabase/.env y .env.local, fuera de git.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push
```

---

### Task 9: Migración 0001 — espacios, miembros y lista permitida (TDD con pgTAP)

**Files:**
- Create: `supabase/tests/000_ayudantes.sql`, `supabase/tests/001_espacios.test.sql`, `supabase/migrations/0001_espacios_y_miembros.sql`
- Modify: `supabase/config.toml` (hook)

- [ ] **Step 1: Ayudantes de prueba**

`supabase/tests/000_ayudantes.sql` (sin transacción: deja los ayudantes en la base local; nunca va en una migración):
```sql
create extension if not exists pgtap with schema extensions;

create schema if not exists pruebas;
grant usage on schema pruebas to authenticated, anon;

create or replace function pruebas.crear_usuario(p_id uuid, p_correo text, p_nombre text default '')
returns uuid language plpgsql security definer set search_path = '' as $$
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values (p_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', p_correo,
          '{"provider":"google"}', jsonb_build_object('full_name', p_nombre), now(), now());
  return p_id;
end $$;

create or replace function pruebas.autenticar_como(p_id uuid)
returns void language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', p_id, 'role', 'authenticated')::text, true);
end $$;

grant execute on all functions in schema pruebas to authenticated, anon;

select plan(1);
select has_function('pruebas', 'autenticar_como', array['uuid'], 'ayudantes listos');
select * from finish();
```

- [ ] **Step 2: Pruebas que fallan**

`supabase/tests/001_espacios.test.sql`:
```sql
begin;
select plan(23);

select pruebas.crear_usuario('11111111-1111-1111-1111-111111111111', 'a@prueba.mx', 'Ana');
select pruebas.crear_usuario('22222222-2222-2222-2222-222222222222', 'b@prueba.mx');
select pruebas.crear_usuario('33333333-3333-3333-3333-333333333333', 'c@prueba.mx');

-- Perfil automático
select is((select nombre from public.perfiles where user_id = '11111111-1111-1111-1111-111111111111'), 'Ana',
  'cada usuario nuevo tiene perfil con su nombre de Google');

-- A crea su espacio
select pruebas.autenticar_como('11111111-1111-1111-1111-111111111111');
select lives_ok($$ select public.crear_espacio('Frente A', 'A', 'fa', 0) $$, 'A crea su espacio por RPC');
select set_config('pruebas.espacio_a', (select id::text from public.espacios limit 1), true);
select is((select count(*)::int from public.espacios), 1, 'A ve su espacio');
select is((select rol from public.miembros where user_id = '11111111-1111-1111-1111-111111111111'), 'dueno', 'A queda como dueña');
select throws_ok($$ select public.crear_espacio('Otro', 'O', 'fa', 1) $$, '23505', null, 'no repite atajo entre sus espacios');
select throws_ok($$ insert into public.espacios (nombre, inicial, atajo) values ('x', 'X', 'x') $$, '42501', null,
  'no se insertan espacios directo, solo por RPC');
select lives_ok($$ update public.perfiles set espacio_predeterminado_id = current_setting('pruebas.espacio_a')::uuid
  where user_id = '11111111-1111-1111-1111-111111111111' $$, 'A usa su espacio como predeterminado');

-- B no ve nada de A
select pruebas.autenticar_como('22222222-2222-2222-2222-222222222222');
select is((select count(*)::int from public.espacios), 0, 'B no ve espacios de A');
select is((select count(*)::int from public.miembros), 0, 'B no ve miembros de A');
select is((select count(*)::int from public.perfiles), 1, 'B solo ve su propio perfil');
select throws_ok($$ insert into public.miembros (espacio_id, user_id) values (current_setting('pruebas.espacio_a')::uuid,
  '22222222-2222-2222-2222-222222222222') $$, '42501', null, 'B no se mete al espacio de A');
update public.espacios set nombre = 'hackeado' where id = current_setting('pruebas.espacio_a')::uuid;
select throws_ok($$ update public.perfiles set espacio_predeterminado_id = current_setting('pruebas.espacio_a')::uuid
  where user_id = '22222222-2222-2222-2222-222222222222' $$, '42501', null, 'B no puede usar el espacio de A como predeterminado');

-- Bienvenida atómica
select lives_ok($$ select public.completar_bienvenida('Beto',
  '[{"nombre":"Uno","inicial":"U","atajo":"uno"},{"nombre":"Dos","inicial":"D","atajo":"dos"}]'::jsonb) $$,
  'la bienvenida crea los frentes de B');
select is((select count(*)::int from public.espacios), 2, 'B ve sus dos frentes');
select is((select e.atajo from public.perfiles p join public.espacios e on e.id = p.espacio_predeterminado_id
  where p.user_id = '22222222-2222-2222-2222-222222222222'), 'uno', 'el primer frente queda como predeterminado');

-- Compartir: A invita a B
select pruebas.autenticar_como('11111111-1111-1111-1111-111111111111');
select lives_ok($$ insert into public.miembros (espacio_id, user_id) values (current_setting('pruebas.espacio_a')::uuid,
  '22222222-2222-2222-2222-222222222222') $$, 'la dueña invita a B a su espacio');
select pruebas.autenticar_como('22222222-2222-2222-2222-222222222222');
select is((select count(*)::int from public.espacios), 3, 'B ya ve el espacio compartido');
select throws_ok($$ insert into public.miembros (espacio_id, user_id) values (current_setting('pruebas.espacio_a')::uuid,
  '33333333-3333-3333-3333-333333333333') $$, '42501', null, 'un miembro que no es dueño no da de alta miembros');
delete from public.espacios where id = current_setting('pruebas.espacio_a')::uuid;
delete from public.miembros where user_id = '11111111-1111-1111-1111-111111111111';

-- anon no hace nada
reset role;
select set_config('request.jwt.claims', '', true);
set local role anon;
select throws_ok($$ select public.crear_espacio('x', 'X', 'x', 0) $$, '42501', null, 'anon no crea espacios');
reset role;

-- B no pudo renombrar el espacio de A (se revisa como postgres)
select is((select nombre from public.espacios where id = current_setting('pruebas.espacio_a')::uuid), 'Frente A',
  'B no pudo renombrar ni borrar el espacio de A');
select is((select count(*)::int from public.miembros where espacio_id = current_setting('pruebas.espacio_a')::uuid
  and user_id = '11111111-1111-1111-1111-111111111111'), 1, 'B no pudo sacar a la dueña de su espacio');

-- Lista permitida
insert into private.correos_permitidos (correo) values ('si@prueba.mx');
select is(public.hook_lista_permitida('{"user":{"email":"SI@prueba.mx"}}'::jsonb), '{}'::jsonb,
  'el hook deja pasar un correo permitido (sin importar mayúsculas)');
select is(public.hook_lista_permitida('{"user":{"email":"nadie@prueba.mx"}}'::jsonb) -> 'error' ->> 'http_code', '403',
  'el hook rechaza un correo que no está en la lista');

select * from finish();
rollback;
```

Run: `npx supabase test db`
Expected: FAIL — `001_espacios.test.sql` falla (no existen `public.perfiles`, `crear_espacio`, …).

- [ ] **Step 3: La migración**

`supabase/migrations/0001_espacios_y_miembros.sql`:
```sql
-- 0001 · Espacios y miembros: la tenencia de Klo-Ser Business.
-- Un frente ES un espacio. Todo dato de negocio colgará de un espacio y solo lo ven sus miembros.

create schema if not exists private;
grant usage on schema private to authenticated;

-- ── Tablas ──────────────────────────────────────────────────────────────
create table public.perfiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null default '' check (char_length(nombre) <= 80),
  zona_horaria text not null default 'America/Monterrey',
  espacio_predeterminado_id uuid,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table public.espacios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (char_length(trim(nombre)) between 1 and 40),
  inicial text not null check (char_length(inicial) = 1),
  atajo text not null check (atajo ~ '^[a-z0-9]{1,12}$'),
  orden int not null default 0,
  creado_por uuid not null default auth.uid() references auth.users (id),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table public.miembros (
  espacio_id uuid not null references public.espacios (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  rol text not null default 'miembro' check (rol in ('dueno', 'miembro')),
  creado_en timestamptz not null default now(),
  primary key (espacio_id, user_id)
);
create index miembros_user_espacio_idx on public.miembros (user_id, espacio_id);

alter table public.perfiles
  add constraint perfiles_espacio_predeterminado_fk
  foreign key (espacio_predeterminado_id) references public.espacios (id) on delete set null;

-- ── Ayudantes de RLS ────────────────────────────────────────────────────
create function private.es_miembro(p_espacio uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.miembros m
    where m.espacio_id = p_espacio and m.user_id = (select auth.uid())
  );
$$;

create function private.es_dueno(p_espacio uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.miembros m
    where m.espacio_id = p_espacio and m.user_id = (select auth.uid()) and m.rol = 'dueno'
  );
$$;

revoke execute on function private.es_miembro(uuid), private.es_dueno(uuid) from public, anon;
grant execute on function private.es_miembro(uuid), private.es_dueno(uuid) to authenticated;

-- ── Disparadores ────────────────────────────────────────────────────────
create function private.tocar_actualizado_en() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.actualizado_en := now();
  return new;
end $$;

create trigger perfiles_tocar before update on public.perfiles
  for each row execute function private.tocar_actualizado_en();
create trigger espacios_tocar before update on public.espacios
  for each row execute function private.tocar_actualizado_en();

-- Cada usuario nuevo nace con perfil (nombre de Google si lo trae).
create function private.crear_perfil() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.perfiles (user_id, nombre)
  values (new.id, coalesce(left(new.raw_user_meta_data ->> 'full_name', 80), ''));
  return new;
end $$;

create trigger auth_usuario_crea_perfil after insert on auth.users
  for each row execute function private.crear_perfil();

-- El espacio predeterminado tiene que ser uno donde el usuario es miembro.
create function private.validar_perfil() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.espacio_predeterminado_id is not null and not exists (
    select 1 from public.miembros m
    where m.espacio_id = new.espacio_predeterminado_id and m.user_id = new.user_id
  ) then
    raise exception 'espacio_ajeno' using errcode = '42501';
  end if;
  return new;
end $$;

create trigger perfiles_validar before insert or update on public.perfiles
  for each row execute function private.validar_perfil();

-- ── RLS y permisos ──────────────────────────────────────────────────────
alter table public.perfiles enable row level security;
alter table public.espacios enable row level security;
alter table public.miembros enable row level security;

revoke all on public.perfiles, public.espacios, public.miembros from anon, authenticated;
grant select on public.perfiles, public.espacios, public.miembros to authenticated;
grant update (nombre, zona_horaria, espacio_predeterminado_id) on public.perfiles to authenticated;
grant update (nombre, inicial, atajo, orden) on public.espacios to authenticated;
grant delete on public.espacios to authenticated;
grant insert, delete on public.miembros to authenticated;

create policy perfiles_select on public.perfiles for select to authenticated
  using (user_id = (select auth.uid()));
create policy perfiles_update on public.perfiles for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy espacios_select on public.espacios for select to authenticated
  using ((select private.es_miembro(id)));
create policy espacios_update on public.espacios for update to authenticated
  using ((select private.es_dueno(id))) with check ((select private.es_dueno(id)));
create policy espacios_delete on public.espacios for delete to authenticated
  using ((select private.es_dueno(id)));

create policy miembros_select on public.miembros for select to authenticated
  using ((select private.es_miembro(espacio_id)));
create policy miembros_insert on public.miembros for insert to authenticated
  with check ((select private.es_dueno(espacio_id)));
create policy miembros_delete on public.miembros for delete to authenticated
  using ((select private.es_dueno(espacio_id)));

-- ── RPC: crear espacio (espacio + dueño en un solo paso) ────────────────
create function public.crear_espacio(p_nombre text, p_inicial text, p_atajo text, p_orden int default 0)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'sin_sesion' using errcode = '42501';
  end if;
  if exists (
    select 1 from public.espacios e join public.miembros m on m.espacio_id = e.id
    where m.user_id = v_uid and e.atajo = p_atajo
  ) then
    raise exception 'atajo_repetido' using errcode = '23505';
  end if;
  insert into public.espacios (nombre, inicial, atajo, orden, creado_por)
  values (trim(p_nombre), p_inicial, p_atajo, p_orden, v_uid)
  returning id into v_id;
  insert into public.miembros (espacio_id, user_id, rol) values (v_id, v_uid, 'dueno');
  return v_id;
end $$;

revoke execute on function public.crear_espacio(text, text, text, int) from public, anon;
grant execute on function public.crear_espacio(text, text, text, int) to authenticated;

-- ── RPC: bienvenida (todos los frentes + perfil, todo o nada) ──────────
create function public.completar_bienvenida(p_nombre text, p_frentes jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_frente jsonb;
  v_id uuid;
  v_primero uuid;
  v_orden int := 0;
begin
  if v_uid is null then
    raise exception 'sin_sesion' using errcode = '42501';
  end if;
  if jsonb_typeof(p_frentes) <> 'array' or jsonb_array_length(p_frentes) = 0 then
    raise exception 'sin_frentes' using errcode = '22023';
  end if;
  for v_frente in select * from jsonb_array_elements(p_frentes) loop
    v_id := public.crear_espacio(v_frente ->> 'nombre', v_frente ->> 'inicial', v_frente ->> 'atajo', v_orden);
    v_primero := coalesce(v_primero, v_id);
    v_orden := v_orden + 1;
  end loop;
  update public.perfiles
  set nombre = left(trim(coalesce(p_nombre, '')), 80), espacio_predeterminado_id = v_primero
  where user_id = v_uid;
end $$;

revoke execute on function public.completar_bienvenida(text, jsonb) from public, anon;
grant execute on function public.completar_bienvenida(text, jsonb) to authenticated;

-- ── Lista permitida (registro cerrado) ──────────────────────────────────
create table private.correos_permitidos (
  correo text primary key check (correo = lower(correo)),
  creado_en timestamptz not null default now()
);
alter table private.correos_permitidos enable row level security;

-- Hook «Before User Created» de Supabase Auth: corre ANTES de crear el usuario.
create function public.hook_lista_permitida(event jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  if exists (
    select 1 from private.correos_permitidos
    where correo = lower(event -> 'user' ->> 'email')
  ) then
    return '{}'::jsonb;
  end if;
  return jsonb_build_object('error', jsonb_build_object(
    'message', 'Todavía no hay lugar, pronto abrimos.',
    'http_code', 403
  ));
end $$;

revoke execute on function public.hook_lista_permitida(jsonb) from public, anon, authenticated;
grant execute on function public.hook_lista_permitida(jsonb) to supabase_auth_admin;

-- Agregar un correo a la lista (solo con la llave secreta del servidor).
create function public.permitir_correo(p_correo text) returns void
language sql security definer set search_path = '' as $$
  insert into private.correos_permitidos (correo) values (lower(trim(p_correo)))
  on conflict do nothing;
$$;

revoke execute on function public.permitir_correo(text) from public, anon, authenticated;
grant execute on function public.permitir_correo(text) to service_role;
```

**Decisiones de esta migración (para que la Parte 2 no las «arregle» al revés):**
- Editar o borrar un espacio es solo de **dueños** (más seguro que «miembros» del spec; un miembro invitado no renombra el frente de otro).
- Cambiar el `atajo` por UPDATE no pasa por la revisión de unicidad de `crear_espacio`; la pantalla de Ajustes (Parte posterior) lo validará en su acción.
- `espacio_predeterminado_id` queda en `null` si se borra ese espacio; Ajustes reasignará el siguiente frente. `perfiles.proyecto_destacado_id` llega en `0002` (depende de `proyectos`).

- [ ] **Step 4: Aplicar y correr las pruebas**

```bash
npx supabase db reset
npx supabase test db
```
Expected: `000_ayudantes.sql .. ok` y `001_espacios.test.sql .. ok` (24 pruebas: 1 + 23). Si alguna falla, corrige la migración (no la prueba) salvo que la prueba contradiga el spec.

- [ ] **Step 5: Encender el hook**

Agrega a `supabase/config.toml`:
```toml
[auth.hook.before_user_created]
enabled = true
uri = "pg-functions://postgres/public/hook_lista_permitida"
```
```bash
npx supabase stop && npx supabase start
npx supabase test db
```
Expected: arranca sin errores y las pruebas siguen verdes. (`db reset` borra los datos; los ayudantes de `000` se vuelven a crear al correr `test db`.)

- [ ] **Step 6: Tipos generados**

```bash
mkdir -p src/lib/supabase
npm run db:tipos
```
Expected: `src/lib/supabase/tipos.ts` con `perfiles`, `espacios`, `miembros` y las funciones. Si la CLI avisa que el comando está deprecado, usa `supabase gen types --lang typescript --local` en el script `db:tipos`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(db): 0001 espacios, miembros y lista permitida con RLS y pgTAP

Un frente es un espacio y solo lo ven sus miembros, garantizado por la base.
Crear espacio y la bienvenida van por RPC para que espacio y dueño nazcan
juntos. El registro está cerrado con el hook Before User Created.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push
```

---

### Task 10: Clientes de Supabase y `proxy.ts`

**Files:**
- Create: `src/lib/supabase/servidor.ts`, `src/lib/supabase/navegador.ts`, `src/proxy.ts`

- [ ] **Step 1: Instalar**

```bash
npm i @supabase/ssr@0.12 @supabase/supabase-js@2
```

- [ ] **Step 2: Clientes**

`src/lib/supabase/servidor.ts`:
```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './tipos'

/** Cliente por petición para Server Components, Server Actions y rutas. */
export async function crearClienteServidor() {
  const almacen = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => almacen.getAll(),
        setAll: (lista) => {
          try {
            lista.forEach(({ name, value, options }) => almacen.set(name, value, options))
          } catch {
            // Server Components no pueden escribir cookies; el proxy ya refrescó la sesión.
          }
        },
      },
    },
  )
}
```

`src/lib/supabase/navegador.ts`:
```ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './tipos'

export function crearClienteNavegador() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  )
}
```

- [ ] **Step 3: Proxy**

`src/proxy.ts`:
```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { esRutaPublica } from '@/lib/rutas'

/**
 * Refresca la sesión (ÚNICO lugar donde se refresca: los refresh tokens son de un solo uso)
 * y manda a /entrar a quien no tenga sesión.
 */
export async function proxy(request: NextRequest) {
  let respuesta = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (lista, encabezados?: Record<string, string>) => {
          lista.forEach(({ name, value }) => request.cookies.set(name, value))
          respuesta = NextResponse.next({ request })
          lista.forEach(({ name, value, options }) => respuesta.cookies.set(name, value, options))
          // Evita que un CDN guarde la cookie de sesión de un usuario y se la sirva a otro.
          Object.entries(encabezados ?? {}).forEach(([clave, valor]) => respuesta.headers.set(clave, valor))
        },
      },
    },
  )

  const { data } = await supabase.auth.getClaims()

  if (!data?.claims && !esRutaPublica(request.nextUrl.pathname)) {
    const destino = request.nextUrl.clone()
    destino.pathname = '/entrar'
    destino.search = ''
    const redireccion = NextResponse.redirect(destino)
    respuesta.cookies.getAll().forEach((cookie) => redireccion.cookies.set(cookie))
    return redireccion
  }

  return respuesta
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|apple-icon.png|manifest.webmanifest|marca/|iconos/).*)'],
}
```
Si `tsc` marca la firma de `setAll` (versión de `@supabase/ssr` sin el segundo argumento), quita `encabezados` y su línea; anótalo en el commit.

- [ ] **Step 4: Verificar**

```bash
npm run typecheck && npm run lint && npm run build
npm run dev
```
Abre `http://localhost:3000/hoy` sin sesión → redirige a `/entrar` (404 por ahora, se crea en la Task 11).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: clientes de Supabase y proxy que refresca la sesión

Next 16 usa proxy.ts; la sesión se refresca solo ahí con getClaims para no
gastar dos veces el refresh token y cerrar sesión sin querer.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push
```

---

### Task 11: Entrar con Google, callback y salir

**Files:**
- Create: `src/app/entrar/page.tsx`, `src/app/entrar/boton-google.tsx`, `src/app/auth/callback/route.ts`, `src/app/(app)/acciones.ts`, `scripts/permitir-correo.mjs`

- [ ] **Step 1: Callback**

`src/app/auth/callback/route.ts`:
```ts
import { NextResponse, type NextRequest } from 'next/server'
import { destinoSeguro } from '@/lib/rutas'
import { crearClienteServidor } from '@/lib/supabase/servidor'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const codigo = searchParams.get('code')
  const destino = destinoSeguro(searchParams.get('next'))

  if (codigo) {
    const supabase = await crearClienteServidor()
    const { error } = await supabase.auth.exchangeCodeForSession(codigo)
    if (!error) return NextResponse.redirect(`${origin}${destino}`)
    console.error('auth/callback', error)
  }

  // Sin código: Google o el hook de lista permitida rechazaron la entrada.
  return NextResponse.redirect(`${origin}/entrar?error=1`)
}
```

- [ ] **Step 2: Botón y página**

`src/app/entrar/boton-google.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { crearClienteNavegador } from '@/lib/supabase/navegador'

export function BotonGoogle() {
  const [yendo, setYendo] = useState(false)

  async function entrar() {
    setYendo(true)
    const { error } = await crearClienteNavegador().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) setYendo(false)
  }

  return (
    <button type="button" className="btn-amanecer" onClick={entrar} disabled={yendo}>
      {yendo ? 'Abriendo Google…' : 'Entrar con Google'}
    </button>
  )
}
```

`src/app/entrar/page.tsx`:
```tsx
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { crearClienteServidor } from '@/lib/supabase/servidor'
import { BotonGoogle } from './boton-google'

export default async function Entrar({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const supabase = await crearClienteServidor()
  const { data } = await supabase.auth.getClaims()
  if (data?.claims) redirect('/hoy')

  const { error } = await searchParams

  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className="relative flex w-full max-w-sm flex-col items-center gap-6 text-center">
        <div className="aura">
          <i />
          <i />
          <i />
        </div>
        <div className="lockup items-center">
          <Image src="/marca/blanco/03-wordmark.svg" alt="Klo-Ser" width={180} height={45} unoptimized priority />
          <span>BUSINESS</span>
        </div>
        <div className="disco-sol size-28">
          <Image src="/marca/azul/02-gallo-completo.svg" alt="" width={72} height={86} unoptimized />
        </div>
        <h1 className="titulo text-2xl">
          Tu trabajo de founder, en <span className="text-amanecer">un solo lugar</span>
        </h1>
        <BotonGoogle />
        {error && (
          <p className="text-sm text-tinta-2" role="alert">
            No pudiste entrar. Si no tienes invitación, todavía no hay lugar: pronto abrimos.
          </p>
        )}
      </div>
    </main>
  )
}
```

- [ ] **Step 3: Salir**

`src/app/(app)/acciones.ts`:
```ts
'use server'

import { redirect } from 'next/navigation'
import { crearClienteServidor } from '@/lib/supabase/servidor'

export async function salir() {
  const supabase = await crearClienteServidor()
  await supabase.auth.signOut()
  redirect('/entrar')
}
```

- [ ] **Step 4: Script para permitir un correo**

`scripts/permitir-correo.mjs`:
```js
// Uso: node --env-file=.env.local scripts/permitir-correo.mjs persona@correo.com
import { createClient } from '@supabase/supabase-js'

const correo = process.argv[2]
if (!correo) {
  console.error('Falta el correo: node --env-file=.env.local scripts/permitir-correo.mjs persona@correo.com')
  process.exit(1)
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
})
const { error } = await supabase.rpc('permitir_correo', { p_correo: correo })
if (error) {
  console.error('No se pudo permitir el correo:', error.message)
  process.exit(1)
}
console.log(`Listo: ${correo.toLowerCase()} ya puede entrar.`)
```

- [ ] **Step 5: Probar la entrada de punta a punta (con Jair)**

```bash
node --env-file=.env.local scripts/permitir-correo.mjs <correo de Google de Jair>
npm run dev
```
1. `http://localhost:3000/entrar` con un correo **no** permitido → vuelve con «No pudiste entrar…».
2. Con el correo de Jair → vuelve a `/hoy` (que hoy pinta el armazón provisional).
3. `npx supabase db query "select email from auth.users"` (o Studio en `http://127.0.0.1:54323`) muestra solo el correo permitido: el rechazado **no** creó usuario.

El correo real se pasa por la terminal; no se escribe en ningún archivo del repo.

- [ ] **Step 6: Verificar y commit**

```bash
npm test && npm run lint && npm run typecheck && npm run build
git add -A
git commit -m "feat: entrar con Google, callback y salir

Si el correo no está en la lista permitida, el hook rechaza antes de crear
el usuario y la pantalla lo dice en voz de la app.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push
```

---

### Task 12: Lógica pura de frentes (TDD)

**Files:**
- Create: `src/lib/frentes.ts`
- Test: `src/lib/frentes.test.ts`

- [ ] **Step 1: Pruebas que fallan**

`src/lib/frentes.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { atajoDesdeNombre, inicialDesdeNombre, MAX_FRENTES, prepararFrentes } from './frentes'

describe('atajoDesdeNombre', () => {
  it('toma la primera palabra en minúsculas', () => {
    expect(atajoDesdeNombre('Top Digital')).toBe('top')
    expect(atajoDesdeNombre('Marca personal')).toBe('marca')
  })
  it('quita guiones, acentos y signos', () => {
    expect(atajoDesdeNombre('Klo-Ser')).toBe('kloser')
    expect(atajoDesdeNombre('Ñandú Café')).toBe('nandu')
    expect(atajoDesdeNombre('¡Hola!')).toBe('hola')
  })
  it('máximo 12 caracteres', () => {
    expect(atajoDesdeNombre('Supercalifragilístico')).toBe('supercalifra')
  })
  it('sin letras usa «frente»', () => {
    expect(atajoDesdeNombre('   ')).toBe('frente')
    expect(atajoDesdeNombre('—')).toBe('frente')
  })
})

describe('inicialDesdeNombre', () => {
  it('primera letra o número en mayúscula', () => {
    expect(inicialDesdeNombre('Klo-Ser')).toBe('K')
    expect(inicialDesdeNombre('¡ojo')).toBe('O')
    expect(inicialDesdeNombre('Ñandú')).toBe('N')
  })
  it('sin letras usa F', () => {
    expect(inicialDesdeNombre('')).toBe('F')
  })
})

describe('prepararFrentes', () => {
  it('limpia espacios y descarta vacíos', () => {
    const r = prepararFrentes(['  Top   Digital ', '', '   '])
    expect(r).toEqual({ ok: true, frentes: [{ nombre: 'Top Digital', inicial: 'T', atajo: 'top' }] })
  })
  it('no repite atajos', () => {
    const r = prepararFrentes(['Marca A', 'Marca B'])
    expect(r.ok && r.frentes.map((f) => f.atajo)).toEqual(['marca', 'marca2'])
  })
  it('respeta atajos ya ocupados', () => {
    const r = prepararFrentes(['Top'], ['top'])
    expect(r.ok && r.frentes[0].atajo).toBe('top2')
  })
  it('pide al menos uno', () => {
    expect(prepararFrentes(['', ' '])).toEqual({ ok: false, mensaje: 'Escribe al menos un frente.' })
  })
  it('pone tope', () => {
    const muchos = Array.from({ length: MAX_FRENTES + 1 }, (_, i) => `Frente ${i}`)
    expect(prepararFrentes(muchos).ok).toBe(false)
  })
  it('rechaza nombres de más de 40 letras', () => {
    expect(prepararFrentes(['x'.repeat(41)]).ok).toBe(false)
  })
})
```

Run: `npx vitest run src/lib/frentes.test.ts`
Expected: FAIL — `Failed to resolve import "./frentes"`.

- [ ] **Step 2: Implementar**

`src/lib/frentes.ts`:
```ts
export type FrenteNuevo = { nombre: string; inicial: string; atajo: string }

export const MAX_FRENTES = 8
const MAX_NOMBRE = 40
const MAX_ATAJO = 12

function sinAcentos(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/** «Top Digital» → «top», «Klo-Ser» → «kloser». Es el `/atajo` de Klo. */
export function atajoDesdeNombre(nombre: string): string {
  const primera = sinAcentos(nombre).trim().split(/\s+/)[0] ?? ''
  const limpio = primera.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, MAX_ATAJO)
  return limpio || 'frente'
}

export function inicialDesdeNombre(nombre: string): string {
  const letra = sinAcentos(nombre).match(/[a-z0-9]/i)?.[0]
  return letra ? letra.toUpperCase() : 'F'
}

export function prepararFrentes(
  nombres: string[],
  ocupados: string[] = [],
): { ok: true; frentes: FrenteNuevo[] } | { ok: false; mensaje: string } {
  const limpios = nombres.map((n) => n.trim().replace(/\s+/g, ' ')).filter(Boolean)
  if (limpios.length === 0) return { ok: false, mensaje: 'Escribe al menos un frente.' }
  if (limpios.length > MAX_FRENTES) return { ok: false, mensaje: `Por ahora caben hasta ${MAX_FRENTES} frentes.` }
  const largo = limpios.find((n) => n.length > MAX_NOMBRE)
  if (largo) return { ok: false, mensaje: `«${largo.slice(0, 20)}…» es muy largo: máximo ${MAX_NOMBRE} letras.` }

  const usados = new Set(ocupados)
  const frentes = limpios.map((nombre) => {
    const base = atajoDesdeNombre(nombre)
    let atajo = base
    for (let n = 2; usados.has(atajo); n++) atajo = `${base.slice(0, MAX_ATAJO - 1)}${n}`
    usados.add(atajo)
    return { nombre, inicial: inicialDesdeNombre(nombre), atajo }
  })
  return { ok: true, frentes }
}
```

- [ ] **Step 3: Correr**

Run: `npx vitest run src/lib/frentes.test.ts`
Expected: PASS (12 pruebas).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: atajos e iniciales de frentes como funciones puras

El atajo sale del nombre («Top Digital» → /top) y nunca se repite entre
los frentes de una persona, para que Klo no dude a cuál va algo.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push
```

---

### Task 13: Bienvenida y armazón con datos reales

**Files:**
- Create: `src/app/bienvenida/page.tsx`, `src/app/bienvenida/forma-bienvenida.tsx`, `src/app/bienvenida/acciones.ts`
- Modify: `src/app/(app)/layout.tsx`

- [ ] **Step 1: Acción**

`src/app/bienvenida/acciones.ts`:
```ts
'use server'

import { redirect } from 'next/navigation'
import { prepararFrentes } from '@/lib/frentes'
import { crearClienteServidor } from '@/lib/supabase/servidor'

export type EstadoBienvenida = { mensaje: string | null }

export async function completarBienvenida(_previo: EstadoBienvenida, datos: FormData): Promise<EstadoBienvenida> {
  const supabase = await crearClienteServidor()
  const { data } = await supabase.auth.getClaims()
  if (!data?.claims) redirect('/entrar')

  const preparados = prepararFrentes(datos.getAll('frente').map(String))
  if (!preparados.ok) return { mensaje: preparados.mensaje }

  const { error } = await supabase.rpc('completar_bienvenida', {
    p_nombre: String(datos.get('nombre') ?? ''),
    p_frentes: preparados.frentes,
  })
  if (error) {
    console.error('completar_bienvenida', error)
    return { mensaje: 'No pude guardar tus frentes, inténtalo otra vez.' }
  }
  redirect('/hoy')
}
```

- [ ] **Step 2: Forma**

`src/app/bienvenida/forma-bienvenida.tsx`:
```tsx
'use client'

import { useActionState, useState } from 'react'
import { MAX_FRENTES } from '@/lib/frentes'
import { completarBienvenida, type EstadoBienvenida } from './acciones'

/** Sugerencias genéricas: ningún nombre real vive en el código. */
const SUGERENCIAS = ['Mi empresa', 'Mi agencia', 'Mi marca personal']
const CAMPO = 'w-full rounded-full bg-tarjeta-alta px-4 py-3 text-[15px] text-tinta ring-1 ring-linea outline-none placeholder:text-tinta-3 focus:ring-violeta/60'

export function FormaBienvenida({ nombreInicial }: { nombreInicial: string }) {
  const [estado, accion, enviando] = useActionState<EstadoBienvenida, FormData>(completarBienvenida, { mensaje: null })
  const [frentes, setFrentes] = useState(SUGERENCIAS)

  return (
    <form action={accion} className="flex w-full flex-col gap-5">
      <label className="flex flex-col gap-2">
        <span className="micro">Tu nombre</span>
        <input name="nombre" defaultValue={nombreInicial} maxLength={80} className={CAMPO} autoComplete="given-name" />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="micro mb-2">Tus frentes</legend>
        {frentes.map((valor, i) => (
          <input key={i} name="frente" defaultValue={valor} maxLength={40} className={CAMPO} aria-label={`Frente ${i + 1}`} />
        ))}
        {frentes.length < MAX_FRENTES && (
          <button type="button" className="self-start text-[13px] text-tinta-2 hover:text-tinta" onClick={() => setFrentes([...frentes, ''])}>
            ＋ Otro frente
          </button>
        )}
      </fieldset>

      {estado.mensaje && (
        <p className="text-sm text-tinta" role="alert">
          {estado.mensaje}
        </p>
      )}

      <button type="submit" className="btn-amanecer justify-center" disabled={enviando}>
        {enviando ? 'Guardando…' : 'Empezar'}
      </button>
    </form>
  )
}
```

- [ ] **Step 3: Página**

`src/app/bienvenida/page.tsx`:
```tsx
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { crearClienteServidor } from '@/lib/supabase/servidor'
import { FormaBienvenida } from './forma-bienvenida'

export default async function Bienvenida() {
  const supabase = await crearClienteServidor()
  const { data } = await supabase.auth.getClaims()
  if (!data?.claims) redirect('/entrar')

  const [{ count }, { data: perfil }] = await Promise.all([
    supabase.from('espacios').select('id', { count: 'exact', head: true }),
    supabase.from('perfiles').select('nombre').eq('user_id', data.claims.sub).single(),
  ])
  if (count && count > 0) redirect('/hoy')

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
        <div className="disco-sol size-24">
          <Image src="/marca/azul/02-gallo-completo.svg" alt="" width={60} height={72} unoptimized />
        </div>
        <h1 className="titulo text-3xl">
          ¿En qué <span className="text-amanecer">frentes</span> trabajas?
        </h1>
        <p className="text-tinta-2">
          Cada frente es un espacio: tu empresa, tu agencia, tu marca. Cámbiales el nombre; luego puedes agregar más.
        </p>
        <FormaBienvenida nombreInicial={perfil?.nombre ?? ''} />
      </div>
    </main>
  )
}
```

- [ ] **Step 4: Layout con datos reales**

Sustituye `src/app/(app)/layout.tsx`:
```tsx
import { redirect } from 'next/navigation'
import { BarraLateral } from '@/components/armazon/barra-lateral'
import { BarraTelefono } from '@/components/armazon/barra-telefono'
import { Encabezado } from '@/components/armazon/encabezado'
import { crearClienteServidor } from '@/lib/supabase/servidor'
import { salir } from './acciones'

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const supabase = await crearClienteServidor()
  const { data } = await supabase.auth.getClaims()
  if (!data?.claims) redirect('/entrar')

  const [{ data: perfil }, { data: espacios }] = await Promise.all([
    supabase.from('perfiles').select('nombre, zona_horaria').eq('user_id', data.claims.sub).single(),
    supabase.from('espacios').select('id, nombre, inicial').order('orden'),
  ])
  if (!espacios?.length) redirect('/bienvenida')

  return (
    <div className="app">
      <BarraLateral frentes={espacios} fraseKlo="Cuando me escribas, aquí te digo qué sigue." />
      <main className="principal">
        <Encabezado nombre={perfil?.nombre ?? null} zona={perfil?.zona_horaria ?? 'America/Monterrey'} salir={salir} />
        {children}
      </main>
      <BarraTelefono />
    </div>
  )
}
```

- [ ] **Step 5: Probar con Jair**

```bash
npx supabase db reset      # base limpia (borra usuarios de prueba)
node --env-file=.env.local scripts/permitir-correo.mjs <correo de Jair>
npm run dev
```
0. Antes de entrar, borra las cookies de `localhost` en el navegador (la sesión de la Task 11 apunta a un usuario que `db reset` ya borró).
1. Entra con Google → cae en `/bienvenida` con su nombre de Google y las tres sugerencias.
2. Cambia los frentes por los suyos (Klo-Ser, Top Digital, Marca personal) → «Empezar» → `/hoy`.
3. La barra lateral muestra sus tres frentes con su inicial; el saludo dice «Buenos días/tardes/noches, <nombre>».
4. Volver a `/bienvenida` lo manda a `/hoy`.
5. El avatar cierra sesión y regresa a `/entrar`.

- [ ] **Step 6: Verificar y commit**

```bash
npm test && npm run lint && npm run typecheck && npm run build
git add -A
git commit -m "feat: bienvenida que da de alta los frentes y armazón con datos reales

La primera vez se piden los frentes (con sugerencias genéricas, sin nombres
reales en el código) y se crean todos de una vez; el primero queda como
predeterminado para que Klo siempre tenga a dónde mandar lo que no entienda.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push
```

---

### Task 14: Capturas a 390 px y verificación final

**Files:**
- Create: `playwright.config.ts`, `e2e/entrar.spec.ts`
- Modify: `.gitignore`, `package.json` (script `e2e`)

- [ ] **Step 1: Instalar**

```bash
npm i -D @playwright/test@1.64
npx playwright install webkit chromium
```

- [ ] **Step 2: Config**

`playwright.config.ts`:
```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e',
  use: { baseURL: 'http://localhost:3000' },
  webServer: { command: 'npm run dev', url: 'http://localhost:3000/entrar', reuseExistingServer: true, timeout: 120_000 },
  projects: [
    { name: 'telefono', use: { ...devices['iPhone 14'], viewport: { width: 390, height: 844 } } },
    { name: 'escritorio', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
  ],
})
```

`e2e/entrar.spec.ts`:
```ts
import { expect, test } from '@playwright/test'

test('entrar se ve completo y sin scroll horizontal', async ({ page }, info) => {
  await page.goto('/entrar')
  await expect(page.getByRole('button', { name: 'Entrar con Google' })).toBeVisible()
  // body tiene overflow-x:hidden, así que se mide el contenido del body, no el viewport.
  const anchoDocumento = await page.evaluate(() => document.body.scrollWidth)
  const anchoVentana = page.viewportSize()!.width
  expect(anchoDocumento).toBeLessThanOrEqual(anchoVentana)
  await page.screenshot({ path: `test-results/capturas/entrar-${info.project.name}.png`, fullPage: true })
})

test('sin sesión, Hoy manda a entrar', async ({ page }) => {
  await page.goto('/hoy')
  await expect(page).toHaveURL(/\/entrar$/)
})
```

Agrega a `package.json` → `"e2e": "playwright test"` y a `.gitignore`:
```
/test-results/
/playwright-report/
```

- [ ] **Step 3: Correr**

```bash
npm run e2e
```
Expected: 4 pruebas PASS (2 por proyecto). Revisa `test-results/capturas/entrar-telefono.png` y `entrar-escritorio.png`: lockup, Klo en disco sol, aura detrás, botón de amanecer.

- [ ] **Step 4: Verificación completa (regla de `CLAUDE.md`)**

```bash
npm test && npm run lint && npm run typecheck && npm run build && npx supabase test db && npm run e2e
```
Expected: todo verde. **Verde no basta:** con `npm run dev`, Jair abre en su compu `http://localhost:3000` (escritorio) y, en DevTools a 390 px, revisa entrar → bienvenida → Hoy → navegar las cinco secciones. Para verlo en el iPhone en la misma red: `npm run dev -- -H 0.0.0.0` y abrir `http://<IP-de-la-compu>:3000` (la entrada con Google en el iPhone queda para cuando haya dominio; aquí basta ver el armazón tras entrar en la compu).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "test: capturas de entrar a 390 px y escritorio con Playwright

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push
```

---

## Al terminar la Parte 1

- Jair aprueba en localhost lo que se ve.
- Se escribe la **Parte 2** (`0002` proyectos/tareas/clientes + hoja de edición + **Hoy** con sus cinco tarjetas) revisada contra este código.
- La rama `v0.1/esqueleto` sigue abierta; se integra a `main` al cerrar el Hito 1 (o antes si Jair lo pide).
