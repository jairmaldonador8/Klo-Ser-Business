'use server'

import { revalidatePath } from 'next/cache'
import { esColor } from '@/lib/frentes'
import { crearClienteServidor } from '@/lib/supabase/servidor'
import { enviarA } from '@/lib/avisos/enviar'
import { MAX_BRIEF } from '@/lib/klo/sistema'
import { limpiarActividades } from '@/lib/tareas/esquema'
import { MOSAICOS, SECCIONES } from '@/lib/vista/registro'
import { esquemaVista, leerVista, resolverLista } from '@/lib/vista/resolver'

export type Resultado = { ok: true } | { ok: false; mensaje: string }

export async function guardarVista(vista: unknown): Promise<Resultado> {
  const leida = esquemaVista.safeParse(vista)
  if (!leida.success) return { ok: false, mensaje: 'I didn’t get that change, reload the page.' }

  // Se guarda ya resuelta: sin ids ajenos y con lo obligatorio visible.
  const limpia = {
    secciones: resolverLista(SECCIONES, leida.data.secciones).map(({ id, visible }) => ({ id, visible })),
    mosaicos_hoy: resolverLista(MOSAICOS, leida.data.mosaicos_hoy).map(({ id, visible }) => ({ id, visible })),
  }
  const supabase = await crearClienteServidor()
  const { data } = await supabase.auth.getClaims()
  if (!data?.claims) return { ok: false, mensaje: 'Your session ended; sign in again.' }

  const { error } = await supabase.from('perfiles').update({ vista: limpia }).eq('user_id', data.claims.sub)
  if (error) {
    console.error('guardarVista', error)
    return { ok: false, mensaje: 'Couldn’t save, try again.' }
  }
  revalidatePath('/', 'layout')
  return { ok: true }
}

/** Lo que deja el modo Personalizar de Hoy: solo cambia los mosaicos y respeta las secciones. */
export async function guardarMosaicos(mosaicos: unknown): Promise<Resultado> {
  const supabase = await crearClienteServidor()
  const { data } = await supabase.auth.getClaims()
  if (!data?.claims) return { ok: false, mensaje: 'Your session ended; sign in again.' }
  const { data: perfil } = await supabase.from('perfiles').select('vista').eq('user_id', data.claims.sub).single()
  return guardarVista({ ...leerVista(perfil?.vista), mosaicos_hoy: mosaicos })
}

export async function guardarFrente(id: string, cambios: { nombre?: string; color?: string }): Promise<Resultado> {
  const datos: { nombre?: string; color?: string } = {}
  if (cambios.nombre !== undefined) {
    const nombre = cambios.nombre.trim().replace(/\s+/g, ' ')
    if (!nombre || nombre.length > 40) return { ok: false, mensaje: 'The name must be 1 to 40 characters.' }
    datos.nombre = nombre
  }
  if (cambios.color !== undefined) {
    if (!esColor(cambios.color)) return { ok: false, mensaje: 'That color isn’t in the palette.' }
    datos.color = cambios.color
  }

  const supabase = await crearClienteServidor()
  // RLS deja actualizar solo a dueños; si no hay fila de vuelta, no era dueño.
  const { data, error } = await supabase.from('espacios').update(datos).eq('id', id).select('id')
  if (error || !data?.length) {
    if (error) console.error('guardarFrente', error)
    return { ok: false, mensaje: 'Only the space owner can change it.' }
  }
  revalidatePath('/', 'layout')
  return { ok: true }
}

/** Guarda el orden de los frentes tal como quedó tras las flechas ↑ ↓. */
export async function ordenarFrentes(ids: string[]): Promise<Resultado> {
  const supabase = await crearClienteServidor()
  const resultados = await Promise.all(
    ids.map((id, orden) => supabase.from('espacios').update({ orden }).eq('id', id).select('id')),
  )
  if (resultados.some((r) => r.error || !r.data?.length)) {
    return { ok: false, mensaje: 'Only the owner of the spaces can reorder them.' }
  }
  revalidatePath('/', 'layout')
  return { ok: true }
}

/** Tus actividades propias (además de las de siempre). Las tareas que ya las usan conservan su nombre. */
export async function guardarActividades(lista: unknown): Promise<Resultado> {
  if (!Array.isArray(lista) || lista.some((x) => typeof x !== 'string')) return { ok: false, mensaje: 'I didn’t get that change, reload the page.' }
  const supabase = await crearClienteServidor()
  const { data } = await supabase.auth.getClaims()
  if (!data?.claims) return { ok: false, mensaje: 'Your session ended; sign in again.' }
  const { error } = await supabase.from('perfiles').update({ actividades: limpiarActividades(lista) }).eq('user_id', data.claims.sub)
  if (error) {
    console.error('guardarActividades', error)
    return { ok: false, mensaje: 'Couldn’t save, try again.' }
  }
  revalidatePath('/', 'layout')
  return { ok: true }
}

/** Klo's brief: lo que Jair le cuenta a Klo de sí mismo (va en cada conversación). */
export async function guardarBrief(texto: string): Promise<Resultado> {
  if (typeof texto !== 'string' || texto.length > MAX_BRIEF) return { ok: false, mensaje: `Keep it under ${MAX_BRIEF} characters.` }
  const supabase = await crearClienteServidor()
  const { data } = await supabase.auth.getClaims()
  if (!data?.claims) return { ok: false, mensaje: 'Your session ended; sign in again.' }
  const { error } = await supabase.from('perfiles').update({ klo_brief: texto.trim() || null }).eq('user_id', data.claims.sub)
  if (error) {
    console.error('guardarBrief', error)
    return { ok: false, mensaje: 'Couldn’t save, try again.' }
  }
  return { ok: true }
}

/** Olvidar algo que Klo recordó. */
export async function borrarMemoria(id: string): Promise<Resultado> {
  const supabase = await crearClienteServidor()
  const { error } = await supabase.from('klo_memoria').delete().eq('id', id)
  if (error) {
    console.error('borrarMemoria', error)
    return { ok: false, mensaje: 'Couldn’t forget it, try again.' }
  }
  return { ok: true }
}

/** «Send a test»: un push a todos tus dispositivos ahora mismo. */
export async function enviarPrueba(): Promise<Resultado> {
  const supabase = await crearClienteServidor()
  const { data } = await supabase.auth.getClaims()
  if (!data?.claims) return { ok: false, mensaje: 'Your session ended; sign in again.' }
  const llegaron = await enviarA(supabase, data.claims.sub, { titulo: 'Klo', cuerpo: 'Notifications are on. I’ll tap you before what matters.', url: '/hoy', tag: 'prueba' })
  return llegaron ? { ok: true } : { ok: false, mensaje: 'No device got it. Turn notifications on again on this phone.' }
}

/** Hora del resumen de la mañana («HH:MM») o null para apagarlo. */
export async function guardarResumen(hora: string | null): Promise<Resultado> {
  if (hora !== null && !/^\d{2}:\d{2}$/.test(hora)) return { ok: false, mensaje: 'Pick a time.' }
  const supabase = await crearClienteServidor()
  const { data } = await supabase.auth.getClaims()
  if (!data?.claims) return { ok: false, mensaje: 'Your session ended; sign in again.' }
  const { error } = await supabase.from('perfiles').update({ resumen_hora: hora }).eq('user_id', data.claims.sub)
  if (error) {
    console.error('guardarResumen', error)
    return { ok: false, mensaje: 'Couldn’t save, try again.' }
  }
  return { ok: true }
}
