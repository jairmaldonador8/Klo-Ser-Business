import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { leerMisTareas } from '@/lib/datos'
import { ejecutar } from '@/lib/klo/acciones'
import { conversar, type Conversacion } from '@/lib/klo/conversar'
import { armarPanorama } from '@/lib/klo/panorama'
import { describirPendientes, leerCtx } from '@/lib/klo/servidor'
import { armarSistema } from '@/lib/klo/sistema'
import { crearClienteServidor } from '@/lib/supabase/servidor'

export const maxDuration = 30

const entrada = z.object({ texto: z.string().trim().min(1).max(4000), sesion: z.uuid() })
const HISTORIA = 20

/** Lo que el panel recibe de cada mensaje de Klo. */
export type RespuestaKlo = { id: string | null; respuesta: string; acciones: string[]; pendientes: string[]; caida?: boolean }

export async function POST(req: Request) {
  const leida = entrada.safeParse(await req.json().catch(() => null))
  if (!leida.success) return NextResponse.json({ mensaje: 'Write something for Klo.' }, { status: 400 })
  const { texto, sesion } = leida.data

  const sb = await crearClienteServidor()
  const { data: claims } = await sb.auth.getClaims()
  if (!claims?.claims) return NextResponse.json({ mensaje: 'Sign in again.' }, { status: 401 })
  const userId = claims.claims.sub

  const [{ ctx, perfil, espacios }, { data: proyectos }, tareas, { data: memoria }, { data: notasPosibles }, { data: previos }] = await Promise.all([
    leerCtx(sb, userId),
    sb.from('proyectos').select('id, nombre, espacio_id, fecha_meta').eq('estado', 'activo').order('nombre'),
    leerMisTareas(),
    sb.from('klo_memoria').select('texto').order('creado_en'),
    sb.from('notas').select('id, espacio_id, texto').eq('posible_tarea', true).is('borrado_en', null).is('convertida_en_tarea_id', null).order('creado_en', { ascending: false }).limit(15),
    sb.from('klo_mensajes').select('rol, texto').eq('sesion', sesion).order('creado_en', { ascending: false }).limit(HISTORIA),
  ])

  await sb.from('klo_mensajes').insert({ sesion, rol: 'usuario', texto })

  // La historia debe empezar con el usuario y alternar; se omiten huecos (un mensaje sin respuesta).
  const historia: Anthropic.MessageParam[] = []
  for (const m of (previos ?? []).reverse()) {
    const role = m.rol === 'usuario' ? 'user' : 'assistant'
    if (historia.at(-1)?.role === role || (!historia.length && role === 'assistant')) continue
    historia.push({ role, content: m.texto })
  }
  if (historia.at(-1)?.role === 'user') historia.pop()

  let r: Conversacion
  if (!process.env.ANTHROPIC_API_KEY) {
    r = { respuesta: '', acciones: [], pendientes: [], uso: { entrada: 0, salida: 0, cacheLeidos: 0, cacheEscritos: 0 }, error: 'sin_llave' }
  } else {
    r = await conversar({
      cliente: new Anthropic(),
      sistema: armarSistema({ brief: perfil?.klo_brief ?? null, memoria: (memoria ?? []).map((m) => m.texto) }),
      panorama: armarPanorama({
        ahora: new Date(),
        zona: ctx.zona,
        nombre: perfil?.nombre ?? null,
        espacios,
        predeterminado: ctx.predeterminado,
        proyectos: proyectos ?? [],
        actividades: perfil?.actividades ?? [],
        tareas,
        notasPosibles: notasPosibles ?? [],
      }),
      historia,
      texto,
      ejecutar: (nombre, input) => ejecutar(sb, ctx, nombre, input),
    })
  }

  let respuesta = r.respuesta
  let caida = false
  if (r.error) {
    if (r.acciones.length) {
      respuesta = 'Something went wrong after that — check the rest.'
    } else {
      // Nada se pierde: el texto queda como nota en tu space predeterminado.
      caida = true
      const nota = ctx.predeterminado ? await sb.from('notas').insert({ espacio_id: ctx.predeterminado, texto }) : { error: true }
      respuesta = nota.error
        ? 'I couldn’t take that right now — try again in a moment.'
        : r.error === 'sin_llave'
          ? 'Klo is offline — I saved it in Notes.'
          : 'I didn’t quite get that — saved it in Notes.'
    }
  }

  const pendientes = r.pendientes.length ? await describirPendientes(sb, r.pendientes) : []
  const { data: guardado, error } = await sb
    .from('klo_mensajes')
    .insert({
      sesion,
      rol: 'klo',
      texto: respuesta,
      acciones: r.acciones as never,
      pendiente: r.pendientes.length ? (r.pendientes as never) : null,
      tokens_entrada: r.uso.entrada,
      tokens_salida: r.uso.salida,
      tokens_cache_leidos: r.uso.cacheLeidos,
      tokens_cache_escritos: r.uso.cacheEscritos,
    })
    .select('id')
    .single()
  if (error) console.error('klo: guardar respuesta', error)

  const cuerpo: RespuestaKlo = {
    id: guardado?.id ?? null,
    respuesta,
    acciones: r.acciones.map((a) => a.resumen ?? a.nombre),
    pendientes,
    caida,
  }
  return NextResponse.json(cuerpo)
}
