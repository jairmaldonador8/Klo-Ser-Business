---
name: google-calendar-lectura
description: Use when implementing the Google Calendar connection, OAuth callback, token encryption, or event sync in Klo-Ser Business
---

# Google Calendar: conexión de solo lectura y sync

## Overview
Calendar se conecta con un OAuth **propio** (aparte del login de Supabase), guarda el refresh
token cifrado y sincroniza en incremental con `syncToken`.

## When to Use
- `app/api/google/callback`, `app/api/google/sincronizar`
- `lib/google/{oauth,cifrado,sincronizar}.ts`

## Core Patterns

**OAuth:** permiso `https://www.googleapis.com/auth/calendar.readonly`, `access_type=offline`,
`prompt=consent`, `include_granted_scopes=true`, `state` firmado contra CSRF. Con `googleapis` /
`google-auth-library` `OAuth2Client` (refresca solo; escuchar `tokens` para persistir rotaciones).
La pantalla de consentimiento va **«En producción»** (en «Prueba» el token caduca a los 7 días).

**Cifrado:** AES-256-GCM (`node:crypto`), IV aleatorio de 12 bytes por registro; guardar
`iv.ciphertext.tag` + `key_version`; llave en `GOOGLE_TOKEN_KEY` (32 bytes base64, solo servidor).

**Sync por calendario visible:**
```ts
async function sincronizarCalendario(cal, api) {
  const base = { calendarId: cal.calendar_id, singleEvents: true, maxResults: 250 }
  let pageToken: string | undefined, syncToken = cal.sync_token
  const params = syncToken ? { ...base, syncToken }
    : { ...base, timeMin: haceDias(7), timeMax: enDias(60) }
  try {
    do {
      const { data } = await api.events.list({ ...params, pageToken })
      await guardar(data.items)            // status 'cancelled' → borrado_en
      pageToken = data.nextPageToken ?? undefined
      if (!pageToken) syncToken = data.nextSyncToken!   // solo en la última página
    } while (pageToken)
  } catch (e) {
    if (codigo(e) === 410) { await borrarEventos(cal); return sincronizarCalendario({ ...cal, sync_token: null }, api) }
    throw e
  }
  await guardarSyncToken(cal, syncToken)
}
```
- `invalid_grant` al refrescar → `estado='revocada'`, aviso «Reconecta Google», no reintentar.
- Upsert por `(user_id, calendar_id, google_event_id)`; todo idempotente (el cron puede duplicar).
- Eventos fuera de la ventana pueden llegar en incremental: filtrar al pintar, no al guardar.

**Disparo:** al abrir Hoy/Semana si `sincronizado_en` > 5 min (sin bloquear) + `pg_cron`/`pg_net`
cada 15 min → `POST /api/google/sincronizar` con `Authorization: Bearer ${CRON_SECRET}` (401 si no).

## Common Mistakes
- Mandar `timeMin`/`timeMax`/`orderBy`/`q` junto con `syncToken` → 400.
- Cambiar `singleEvents` entre la pasada completa y la incremental.
- Guardar el token en `public` o exponerlo al cliente.
- Pedir Calendar en el login de Supabase (obliga verificación y consentimiento en cada entrada).
