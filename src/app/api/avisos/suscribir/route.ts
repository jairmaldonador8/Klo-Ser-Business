import { NextResponse } from 'next/server'
import { z } from 'zod'
import { crearClienteServidor } from '@/lib/supabase/servidor'

const suscripcion = z.object({
  endpoint: z.url().startsWith('https://'),
  keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
  agente: z.string().max(200).optional(),
})

async function sesion() {
  const sb = await crearClienteServidor()
  const { data } = await sb.auth.getClaims()
  return data?.claims ? sb : null
}

/** Guarda este dispositivo para recibir avisos (o actualiza sus llaves). */
export async function POST(req: Request) {
  const leida = suscripcion.safeParse(await req.json().catch(() => null))
  if (!leida.success) return NextResponse.json({ mensaje: 'Invalid subscription.' }, { status: 400 })
  const sb = await sesion()
  if (!sb) return NextResponse.json({ mensaje: 'Sign in again.' }, { status: 401 })
  const { endpoint, keys, agente } = leida.data
  const { data: existe } = await sb.from('push_suscripciones').select('id').eq('endpoint', endpoint).maybeSingle()
  const { error } = existe
    ? await sb.from('push_suscripciones').update({ p256dh: keys.p256dh, auth: keys.auth, agente }).eq('id', existe.id)
    : await sb.from('push_suscripciones').insert({ endpoint, p256dh: keys.p256dh, auth: keys.auth, agente })
  if (error) {
    console.error('suscribir', error)
    return NextResponse.json({ mensaje: 'Couldn’t save this device.' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  const leida = z.object({ endpoint: z.string() }).safeParse(await req.json().catch(() => null))
  if (!leida.success) return NextResponse.json({ mensaje: 'Check the details.' }, { status: 400 })
  const sb = await sesion()
  if (!sb) return NextResponse.json({ mensaje: 'Sign in again.' }, { status: 401 })
  await sb.from('push_suscripciones').delete().eq('endpoint', leida.data.endpoint)
  return NextResponse.json({ ok: true })
}
