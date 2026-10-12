# Skills Audit — Klo-Ser Business v0.1

> 2026-10-12 · Stack: TypeScript · Next.js 16.4 (App Router) · React 19.3 · Tailwind 4.3 ·
> shadcn (Base UI) · Supabase (Postgres/Auth/RLS, local con Docker) · Claude Haiku 5.5 ·
> Google Calendar API · PWA iOS · Vitest/pgTAP/Playwright.

## Lenguaje

| Lenguaje | Estado | Skill | Acción |
|---|---|---|---|
| TypeScript | External | `ultrapowers-dev:typescript-best-practices` | Ninguna. Ojo: sugiere biome; aquí manda ESLint 9 de `eslint-config-next` |

## Categorías

| Categoría | Estado | Skill |
|---|---|---|
| Testing/TDD | External | `ultrapowers-dev:testing-tdd`, `ultrapowers:test-driven-development` |
| Error handling | External | `ultrapowers-dev:error-handling` |
| Design patterns | External | `ultrapowers-dev:design-patterns` |
| Architecture | External | `ultrapowers-dev:architecture` |
| Database | External | `ultrapowers-dev:database-design`, `ultrapowers-dev:sql-best-practices`, `supabase:supabase-postgres-best-practices` |
| API design | External | `ultrapowers-dev:api-design` (poco uso: Server Actions + 2 rutas) |
| Observability | External | `ultrapowers-dev:observability` |
| Resilience | External | `ultrapowers-dev:resilience` (timeouts de Klo, Google) |
| Security/Auth | External | `ultrapowers-dev:auth-security` |
| Background jobs | External | `ultrapowers-dev:background-jobs` (pg_cron) |
| AI/LLM | External | `claude-api` (actual: Haiku 5.5, `output_config.format`) |
| Type safety | External | `ultrapowers-dev:type-safety` |
| Caching | No aplica en v0.1 (Cache Components apagado) |
| CI/CD | No aplica en v0.1 (sin PROD hasta aprobar) |

## Dominio

| Competencia | Estado | Skill existente | Acción |
|---|---|---|---|
| Next 16 App Router (proxy.ts, APIs async, Turbopack, ESLint plano) | **Stale** | `ultrapowers-dev:nextjs-patterns` (habla de `middleware.ts`) · `vercel:nextjs` | Cubrir en skill de proyecto |
| Tailwind v4 con `@theme`, tema solo oscuro | **Stale** | `ultrapowers-dev:tailwind-patterns` (usa `tailwind.config`) | Cubrir en skill de proyecto |
| shadcn con Base UI | External | `vercel:shadcn` | Ninguna |
| Supabase SSR + `getClaims` + llaves nuevas + grants explícitos + hook de lista permitida + RPC de espacio | Parcial | `supabase:supabase` (oficial, actual) · `ultrapowers-dev:supabase-patterns` (genérico) | Cubrir lo específico en skill de proyecto |
| RLS multi-espacio y pruebas pgTAP | Parcial | `supabase:supabase` | Cubrir en skill de proyecto |
| Klo: salida estructurada con zod en Haiku 5.5 | External | `claude-api` | Ninguna |
| Google Calendar: OAuth aparte, sync incremental, 410, invalid_grant | **Missing** | — | Cubrir en skill de proyecto |
| PWA en iOS con Serwist | **Missing** | — | Cubrir en skill de proyecto |
| Ley visual «Klo-Ser Noche» | Covered | `DISENO.md` + `diseno/prototipo.html` (fuente de verdad del repo) | Ninguna |
| React / rendimiento | External | `ultrapowers-dev:react-best-practices`, `vercel:react-best-practices` | Ninguna |
| E2E 390 px | External | `ultrapowers-dev:e2e-testing` | Ninguna |

## Resumen

Covered 1 · Stale 2 · Missing 2 · Parcial 2 · External el resto.

## Skills creadas (proyecto, `.claude/skills/`)

1. **`next16-pwa-noche`**: Next 16.4, Tailwind v4 solo oscuro, shadcn Base UI, PWA iOS con Serwist.
2. **`supabase-espacios-rls`**: tabla tipo con grants y policies, `es_miembro`, RPC de espacio, hook de lista permitida, sesión con `getClaims` en `proxy.ts`, pgTAP.
3. **`google-calendar-lectura`**: OAuth aparte, cifrado AES-GCM, sync incremental con 410 e `invalid_grant`, disparo con pg_cron.

No se editan las skills de plugins (se sobrescriben al actualizar); las de proyecto mandan donde choquen.
