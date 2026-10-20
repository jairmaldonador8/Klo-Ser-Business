import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import webpush from 'web-push'
import type { Database } from '@/lib/supabase/tipos'

export type Push = { titulo: string; cuerpo: string; url?: string; tag: string }

const SITIO = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://klo-ser-business.vercel.app'

let listo = false
function configurar(): boolean {
  if (listo) return true
  const { NEXT_PUBLIC_VAPID_PUBLIC_KEY: publica, VAPID_PRIVATE_KEY: privada, VAPID_SUBJECT: sujeto } = process.env
  if (!publica || !privada || !sujeto) return false
  webpush.setVapidDetails(sujeto, publica, privada)
  listo = true
  return true
}

/** Manda el push a todos los dispositivos de alguien. Las suscripciones muertas (404/410) se borran. Regresa a cuántos llegó. */
export async function enviarA(sb: SupabaseClient<Database>, ownerId: string, push: Push): Promise<number> {
  if (!configurar()) {
    console.error('avisos: faltan las llaves VAPID')
    return 0
  }
  const { data: subs } = await sb.from('push_suscripciones').select('id, endpoint, p256dh, auth').eq('owner_id', ownerId)
  // Formato declarativo (iOS 18.4+ lo muestra sin service worker); el sw.js también lo entiende.
  const cuerpo = JSON.stringify({
    web_push: 8030,
    notification: { title: push.titulo, body: push.cuerpo, navigate: new URL(push.url ?? '/hoy', SITIO).toString(), tag: push.tag },
  })
  let llegaron = 0
  await Promise.all(
    (subs ?? []).map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, cuerpo, {
          TTL: 900,
          urgency: 'high',
          // Un tema por evento: un push nuevo del mismo evento reemplaza al anterior en vez de apilarse.
          topic: push.tag.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 32),
        })
        llegaron++
      } catch (e) {
        const codigo = (e as { statusCode?: number }).statusCode
        if (codigo === 404 || codigo === 410) await sb.from('push_suscripciones').delete().eq('id', s.id)
        else console.error('avisos: envío', codigo, (e as Error).message)
      }
    }),
  )
  return llegaron
}
