---
name: next16-pwa-noche
description: Use when writing Next.js 16 App Router code, Tailwind v4 styles, the PWA manifest/service worker, or iOS standalone behaviour in Klo-Ser Business
---

# Next 16 · Tailwind v4 solo oscuro · PWA iOS

## Overview
Next 16.4 cambió convenciones que los skills genéricos aún no tienen. Antes de escribir código,
lee la guía local en `node_modules/next/dist/docs/` (regla de `CLAUDE.md`).

## When to Use
- Rutas, layouts, Server Actions, `proxy.ts`
- Tokens y estilos (`globals.css`), shadcn
- `app/manifest.ts`, service worker, metas de iOS

## Core Patterns

**Next 16**
- `proxy.ts` en `src/` con `export async function proxy(req)` — `middleware.ts` está deprecado.
- APIs de petición solo async: `const { id } = await params`, `await cookies()`.
- Turbopack por defecto; nada de config de `webpack`.
- **Cache Components apagado** en la v0.1 (no `cacheComponents`, no `'use cache'`).
- `next lint` no existe: `"lint": "eslint ."` con config plana de `eslint-config-next`.
- `revalidatePath()` tras mutar en Server Actions; devolver `{ ok, mensaje }`.

**Tailwind v4 solo oscuro** — sin `tailwind.config`, sin `.dark`, sin `next-themes`:
```css
@import "tailwindcss";
:root { color-scheme: dark; --background: #06071a; --foreground: #f3f4fb; /* tokens shadcn → paleta Noche */ }
@theme inline { --color-background: var(--background); --color-foreground: var(--foreground); }
@theme { --color-noche: #06071a; /* resto de DISENO.md §8 */ }
```
shadcn: `npx shadcn@latest init -b base` (Base UI, como los hermanos). Valores exactos: `DISENO.md`.

**PWA iOS**
```ts
// app/manifest.ts
export default function manifest(): MetadataRoute.Manifest {
  return { id: '/', name: 'Klo-Ser Business', short_name: 'Business', start_url: '/hoy',
    display: 'standalone', background_color: '#06071a', theme_color: '#06071a', icons: [/* 192, 512 */] }
}
```
- `metadata.appleWebApp = { capable: true, statusBarStyle: 'black-translucent' }`,
  `export const viewport = { themeColor: '#06071a', viewportFit: 'cover' }`, `apple-touch-icon` 180,
  y `env(safe-area-inset-*)` en barras.
- Service worker: `@serwist/turbopack` + `app/serwist/[path]/route.ts` + página `app/~offline/page.tsx`.
- `navigator.storage.persist()` al arrancar (try/catch).

## Common Mistakes
- Usar `shortcuts` o `share_target` en el manifest: iOS los ignora.
- Confiar en `autofocus` para abrir el teclado en iOS: no lo abre sin toque.
- Leer `params` sin `await` (error en 16).
- Pintar texto con `#1c36ee` sobre la noche: usar `--azul-luz` (ver `DISENO.md`).
- Colores de semáforo para estado (prohibido por `CLAUDE.md`).
