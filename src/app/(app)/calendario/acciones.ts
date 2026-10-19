'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { Resultado } from '@/app/(app)/tareas/acciones'
import { crearClienteServidor } from '@/lib/supabase/servidor'

const hora = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).nullable()
const esquemaMovida = z
  .object({ id: z.uuid(), fecha: z.iso.date().nullable(), hora, hora_fin: hora })
  .refine((m) => !m.hora || m.fecha, { message: 'Para ponerle hora, ponle fecha.' })
  .refine((m) => !m.hora_fin || (m.hora && m.hora_fin > m.hora), { message: 'La hora de fin va después de la de inicio.' })

/** Mover o estirar una tarea en el calendario: solo cambia fecha y horas (sin fecha = deshacer un calendarizar). */
export async function reprogramarTarea(datos: unknown): Promise<Resultado> {
  const leida = esquemaMovida.safeParse(datos)
  if (!leida.success) return { ok: false, mensaje: leida.error.issues[0]?.message ?? 'Revisa la hora.' }
  const { id, ...campos } = leida.data
  const supabase = await crearClienteServidor()
  const { error } = await supabase.from('tareas').update(campos).eq('id', id)
  if (error) {
    console.error('reprogramarTarea', error)
    return { ok: false, mensaje: 'No pude moverla, inténtalo otra vez.' }
  }
  revalidatePath('/', 'layout')
  return { ok: true, id }
}

/** Cambiar la fecha meta de un proyecto arrastrando su bandera. */
export async function moverMeta(id: string, fecha: string): Promise<Resultado> {
  const leida = z.object({ id: z.uuid(), fecha: z.iso.date() }).safeParse({ id, fecha })
  if (!leida.success) return { ok: false, mensaje: 'Esa fecha no se entiende.' }
  const supabase = await crearClienteServidor()
  const { data: proyecto } = await supabase.from('proyectos').select('fecha_inicio').eq('id', id).single()
  if (proyecto && fecha < proyecto.fecha_inicio) return { ok: false, mensaje: 'La meta no puede ir antes de que empiece el proyecto.' }
  const { error } = await supabase.from('proyectos').update({ fecha_meta: fecha }).eq('id', id)
  if (error) {
    console.error('moverMeta', error)
    return { ok: false, mensaje: 'No pude mover la meta, inténtalo otra vez.' }
  }
  revalidatePath('/', 'layout')
  return { ok: true, id }
}
