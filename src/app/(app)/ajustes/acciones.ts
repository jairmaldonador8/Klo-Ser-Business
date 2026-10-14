'use server'

import { revalidatePath } from 'next/cache'
import { esColor } from '@/lib/frentes'
import { crearClienteServidor } from '@/lib/supabase/servidor'
import { MOSAICOS, SECCIONES } from '@/lib/vista/registro'
import { esquemaVista, leerVista, resolverLista } from '@/lib/vista/resolver'

export type Resultado = { ok: true } | { ok: false; mensaje: string }

export async function guardarVista(vista: unknown): Promise<Resultado> {
  const leida = esquemaVista.safeParse(vista)
  if (!leida.success) return { ok: false, mensaje: 'No entendí ese cambio, recarga la página.' }

  // Se guarda ya resuelta: sin ids ajenos y con lo obligatorio visible.
  const limpia = {
    secciones: resolverLista(SECCIONES, leida.data.secciones).map(({ id, visible }) => ({ id, visible })),
    mosaicos_hoy: resolverLista(MOSAICOS, leida.data.mosaicos_hoy).map(({ id, visible }) => ({ id, visible })),
  }
  const supabase = await crearClienteServidor()
  const { data } = await supabase.auth.getClaims()
  if (!data?.claims) return { ok: false, mensaje: 'Tu sesión terminó; vuelve a entrar.' }

  const { error } = await supabase.from('perfiles').update({ vista: limpia }).eq('user_id', data.claims.sub)
  if (error) {
    console.error('guardarVista', error)
    return { ok: false, mensaje: 'No pude guardar, inténtalo otra vez.' }
  }
  revalidatePath('/', 'layout')
  return { ok: true }
}

/** Lo que deja el modo Personalizar de Hoy: solo cambia los mosaicos y respeta las secciones. */
export async function guardarMosaicos(mosaicos: unknown): Promise<Resultado> {
  const supabase = await crearClienteServidor()
  const { data } = await supabase.auth.getClaims()
  if (!data?.claims) return { ok: false, mensaje: 'Tu sesión terminó; vuelve a entrar.' }
  const { data: perfil } = await supabase.from('perfiles').select('vista').eq('user_id', data.claims.sub).single()
  return guardarVista({ ...leerVista(perfil?.vista), mosaicos_hoy: mosaicos })
}

export async function guardarFrente(id: string, cambios: { nombre?: string; color?: string }): Promise<Resultado> {
  const datos: { nombre?: string; color?: string } = {}
  if (cambios.nombre !== undefined) {
    const nombre = cambios.nombre.trim().replace(/\s+/g, ' ')
    if (!nombre || nombre.length > 40) return { ok: false, mensaje: 'El nombre va de 1 a 40 letras.' }
    datos.nombre = nombre
  }
  if (cambios.color !== undefined) {
    if (!esColor(cambios.color)) return { ok: false, mensaje: 'Ese color no está en la paleta.' }
    datos.color = cambios.color
  }

  const supabase = await crearClienteServidor()
  // RLS deja actualizar solo a dueños; si no hay fila de vuelta, no era dueño.
  const { data, error } = await supabase.from('espacios').update(datos).eq('id', id).select('id')
  if (error || !data?.length) {
    if (error) console.error('guardarFrente', error)
    return { ok: false, mensaje: 'Solo quien es dueño del frente puede cambiarlo.' }
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
    return { ok: false, mensaje: 'Solo quien es dueño de los frentes puede reordenarlos.' }
  }
  revalidatePath('/', 'layout')
  return { ok: true }
}
