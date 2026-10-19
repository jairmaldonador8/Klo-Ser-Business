'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { crearClienteServidor } from '@/lib/supabase/servidor'
import { esquemaTarea } from '@/lib/tareas/esquema'

export type Resultado = { ok: true; id?: string } | { ok: false; mensaje: string }

function listo(id?: string): Resultado {
  revalidatePath('/', 'layout')
  return { ok: true, id }
}

export async function guardarTarea(datos: unknown, notaId?: string): Promise<Resultado> {
  const leida = esquemaTarea.safeParse(datos)
  if (!leida.success) return { ok: false, mensaje: leida.error.issues[0]?.message ?? 'Check the details.' }
  const { id, ...campos } = leida.data
  const supabase = await crearClienteServidor()
  const consulta = id
    ? supabase.from('tareas').update(campos).eq('id', id).select('id').single()
    : supabase.from('tareas').insert(campos).select('id').single()
  const { data, error } = await consulta
  if (error || !data) {
    console.error('guardarTarea', error)
    return { ok: false, mensaje: 'Couldn’t save the task, try again.' }
  }
  if (notaId) {
    // Liga la nota solo si sigue suelta: si no se puede, la tarea se borra (suave) para no dejar
    // la idea duplicada (nota visible + tarea nueva). El trigger exige el mismo frente.
    const { data: nota, error: errorNota } = await supabase
      .from('notas')
      .update({ convertida_en_tarea_id: data.id })
      .eq('id', notaId)
      .is('convertida_en_tarea_id', null)
      .is('borrado_en', null)
      .select('id')
      .single()
    if (errorNota || !nota) {
      console.error('guardarTarea: ligar nota', errorNota)
      if (!id) await supabase.from('tareas').update({ borrado_en: new Date().toISOString() }).eq('id', data.id)
      return { ok: false, mensaje: 'Couldn’t turn the note into a task: reload and try again.' }
    }
  }
  return listo(data.id)
}

export async function completarTarea(id: string, hecha: boolean): Promise<Resultado> {
  const supabase = await crearClienteServidor()
  const { error } = await supabase.from('tareas').update({ completada_en: hecha ? new Date().toISOString() : null }).eq('id', id)
  if (error) return { ok: false, mensaje: 'Couldn’t check it off, try again.' }
  return listo()
}

/** Borrado suave; con `borrar = false` la restaura (el «Deshacer»). */
export async function borrarTarea(id: string, borrar = true): Promise<Resultado> {
  const supabase = await crearClienteServidor()
  const { error } = await supabase.from('tareas').update({ borrado_en: borrar ? new Date().toISOString() : null }).eq('id', id)
  if (error) return { ok: false, mensaje: borrar ? 'Couldn’t delete it, try again.' : 'Couldn’t undo it, try again.' }
  // Si venía de una nota, la nota regresa a la lista para no perder la idea.
  if (borrar) {
    const { error: errorNota } = await supabase.from('notas').update({ convertida_en_tarea_id: null }).eq('convertida_en_tarea_id', id)
    if (errorNota) console.error('borrarTarea: soltar nota', errorNota)
  }
  return listo()
}

/** Calendarizar con ⇧/⌘: la misma task en varios días, a la misma hora; una fila independiente por día, todo o nada. */
export async function crearEnVariosDias(datos: unknown, fechas: unknown): Promise<Resultado> {
  const dias = z.array(z.iso.date()).min(1).max(31).safeParse(fechas)
  if (!dias.success) return { ok: false, mensaje: 'Check the days.' }
  const unicos = [...new Set(dias.data)].sort()
  // Cada copia vive en su día: sin fecha de fin.
  const leida = esquemaTarea.safeParse({ ...(datos as object), id: '', fecha: unicos[0], fecha_fin: null })
  if (!leida.success) return { ok: false, mensaje: leida.error.issues[0]?.message ?? 'Check the details.' }
  const { id, ...campos } = leida.data
  void id
  const supabase = await crearClienteServidor()
  const { error } = await supabase.from('tareas').insert(unicos.map((fecha) => ({ ...campos, fecha })))
  if (error) {
    console.error('crearEnVariosDias', error)
    return { ok: false, mensaje: 'Couldn’t create the tasks, try again.' }
  }
  return listo()
}
