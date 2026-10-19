'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { crearClienteServidor } from '@/lib/supabase/servidor'

export type Resultado = { ok: true; id?: string } | { ok: false; mensaje: string }

const esquemaTexto = z
  .string()
  .trim()
  .min(1, 'Write something in the note.')
  .max(4000, 'The note is too long: 4000 characters max.')

function listo(id?: string): Resultado {
  revalidatePath('/', 'layout')
  return { ok: true, id }
}

export async function crearNota(espacioId: string, texto: string): Promise<Resultado> {
  const leido = esquemaTexto.safeParse(texto)
  if (!leido.success) return { ok: false, mensaje: leido.error.issues[0]?.message ?? 'Check the note.' }
  const supabase = await crearClienteServidor()
  const { data, error } = await supabase.from('notas').insert({ espacio_id: espacioId, texto: leido.data }).select('id').single()
  if (error || !data) {
    console.error('crearNota', error)
    return { ok: false, mensaje: 'Couldn’t save the note, try again.' }
  }
  return listo(data.id)
}

export async function editarNota(id: string, texto: string): Promise<Resultado> {
  const leido = esquemaTexto.safeParse(texto)
  if (!leido.success) return { ok: false, mensaje: leido.error.issues[0]?.message ?? 'Check the note.' }
  const supabase = await crearClienteServidor()
  const { error } = await supabase.from('notas').update({ texto: leido.data }).eq('id', id)
  if (error) return { ok: false, mensaje: 'Couldn’t save the changes, try again.' }
  return listo()
}

/** Borrado suave; con `borrar = false` la restaura (el «Deshacer»). */
export async function borrarNota(id: string, borrar = true): Promise<Resultado> {
  const supabase = await crearClienteServidor()
  const { error } = await supabase.from('notas').update({ borrado_en: borrar ? new Date().toISOString() : null }).eq('id', id)
  if (error) return { ok: false, mensaje: borrar ? 'Couldn’t delete it, try again.' : 'Couldn’t undo it, try again.' }
  return listo()
}
