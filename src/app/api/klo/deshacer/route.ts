import { NextResponse } from 'next/server'
import { z } from 'zod'
import type { Deshacer } from '@/lib/klo/acciones'
import type { Accion } from '@/lib/klo/conversar'
import { aplicarDeshacer } from '@/lib/klo/deshacer'
import { crearClienteServidor } from '@/lib/supabase/servidor'

const entrada = z.object({ id: z.uuid() })

/** Undo de un mensaje de Klo: revierte todo lo que hizo en él, una sola vez. */
export async function POST(req: Request) {
  const leida = entrada.safeParse(await req.json().catch(() => null))
  if (!leida.success) return NextResponse.json({ mensaje: 'Check the details.' }, { status: 400 })
  const sb = await crearClienteServidor()
  const { data: claims } = await sb.auth.getClaims()
  if (!claims?.claims) return NextResponse.json({ mensaje: 'Sign in again.' }, { status: 401 })

  const { data: tomado } = await sb
    .from('klo_mensajes')
    .update({ deshecho_en: new Date().toISOString() })
    .eq('id', leida.data.id)
    .is('deshecho_en', null)
    .select('acciones')
  if (!tomado?.length) return NextResponse.json({ mensaje: 'Already undone.' }, { status: 409 })

  const lista = ((tomado[0].acciones ?? []) as Accion[]).map((a) => a.deshacer).filter((d): d is Deshacer => !!d)
  const fallas = await aplicarDeshacer(sb, lista)
  if (fallas) return NextResponse.json({ mensaje: 'Couldn’t undo everything, check your tasks.' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
