'use server'

import { revalidatePath } from 'next/cache'
import { crearClienteServidor } from '@/lib/supabase/servidor'
import { esquemaTarea } from '@/lib/tareas/esquema'

export type Resultado = { ok: true; id?: string } | { ok: false; mensaje: string }

function listo(id?: string): Resultado {
  revalidatePath('/', 'layout')
  return { ok: true, id }
}

export async function guardarTarea(datos: unknown, notaId?: string): Promise<Resultado> {
  const leida = esquemaTarea.safeParse(datos)
  if (!leida.success) return { ok: false, mensaje: leida.error.issues[0]?.message ?? 'Revisa los datos.' }
  const { id, ...campos } = leida.data
  const supabase = await crearClienteServidor()
  const consulta = id
    ? supabase.from('tareas').update(campos).eq('id', id).select('id').single()
    : supabase.from('tareas').insert(campos).select('id').single()
  const { data, error } = await consulta
  if (error || !data) {
    console.error('guardarTarea', error)
    return { ok: false, mensaje: 'No pude guardar la tarea, inténtalo otra vez.' }
  }
  if (notaId) await supabase.from('notas').update({ convertida_en_tarea_id: data.id }).eq('id', notaId)
  return listo(data.id)
}

export async function completarTarea(id: string, hecha: boolean): Promise<Resultado> {
  const supabase = await crearClienteServidor()
  const { error } = await supabase.from('tareas').update({ completada_en: hecha ? new Date().toISOString() : null }).eq('id', id)
  if (error) return { ok: false, mensaje: 'No pude marcarla, inténtalo otra vez.' }
  return listo()
}

/** Borrado suave; con `borrar = false` la restaura (el «Deshacer»). */
export async function borrarTarea(id: string, borrar = true): Promise<Resultado> {
  const supabase = await crearClienteServidor()
  const { error } = await supabase.from('tareas').update({ borrado_en: borrar ? new Date().toISOString() : null }).eq('id', id)
  if (error) return { ok: false, mensaje: 'No pude borrarla, inténtalo otra vez.' }
  return listo()
}
