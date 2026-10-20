import { NextResponse } from 'next/server'
import { z } from 'zod'
import { ejecutar } from '@/lib/klo/acciones'
import type { Accion, Pendiente } from '@/lib/klo/conversar'
import { leerCtx } from '@/lib/klo/servidor'
import { crearClienteServidor } from '@/lib/supabase/servidor'

const entrada = z.object({ id: z.uuid(), aceptar: z.boolean() })

/** Confirm / Cancel de lo que Klo dejó esperando: ejecuta exactamente lo guardado, sin volver a Claude. */
export async function POST(req: Request) {
  const leida = entrada.safeParse(await req.json().catch(() => null))
  if (!leida.success) return NextResponse.json({ mensaje: 'Check the details.' }, { status: 400 })
  const sb = await crearClienteServidor()
  const { data: claims } = await sb.auth.getClaims()
  if (!claims?.claims) return NextResponse.json({ mensaje: 'Sign in again.' }, { status: 401 })

  const { data: mensaje } = await sb.from('klo_mensajes').select('acciones, pendiente').eq('id', leida.data.id).maybeSingle()
  const pendientes = (mensaje?.pendiente ?? null) as Pendiente[] | null
  if (!mensaje || !pendientes?.length) return NextResponse.json({ mensaje: 'Nothing is waiting.' }, { status: 409 })

  // Se limpia primero: dos toques seguidos no ejecutan dos veces.
  const { data: tomado } = await sb.from('klo_mensajes').update({ pendiente: null }).eq('id', leida.data.id).not('pendiente', 'is', null).select('id')
  if (!tomado?.length) return NextResponse.json({ mensaje: 'Nothing is waiting.' }, { status: 409 })
  if (!leida.data.aceptar) return NextResponse.json({ acciones: [] })

  const { ctx } = await leerCtx(sb, claims.claims.sub)
  const nuevas: Accion[] = []
  const fallas: string[] = []
  for (const p of pendientes) {
    const hecho = await ejecutar(sb, ctx, p.nombre, p.input)
    if (hecho.error) fallas.push(hecho.texto)
    else nuevas.push({ nombre: p.nombre, resumen: hecho.resumen, deshacer: hecho.deshacer })
  }
  const acciones = [...((mensaje.acciones ?? []) as Accion[]), ...nuevas]
  await sb.from('klo_mensajes').update({ acciones: acciones as never }).eq('id', leida.data.id)
  if (fallas.length) console.error('klo: confirmar', fallas)
  return NextResponse.json({ acciones: nuevas.map((a) => a.resumen ?? a.nombre), fallas: fallas.length })
}
