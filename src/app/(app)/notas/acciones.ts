'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { crearClienteServidor } from '@/lib/supabase/servidor'

export type Resultado = { ok: true; id?: string } | { ok: false; mensaje: string }

const esquemaTexto = z
  .string()
  .trim()
  .min(1, 'Escribe algo en la nota.')
  .max(4000, 'La nota es muy larga: máximo 4000 letras.')

function listo(id?: string): Resultado {
  revalidatePath('/', 'layout')
  return { ok: true, id }
}

export async function crearNota(espacioId: string, texto: string): Promise<Resultado> {
  const leido = esquemaTexto.safeParse(texto)
  if (!leido.success) return { ok: false, mensaje: leido.error.issues[0]?.message ?? 'Revisa la nota.' }
  const supabase = await crearClienteServidor()
  const { data, error } = await supabase.from('notas').insert({ espacio_id: espacioId, texto: leido.data }).select('id').single()
  if (error || !data) {
    console.error('crearNota', error)
    return { ok: false, mensaje: 'No pude guardar la nota, inténtalo otra vez.' }
  }
  return listo(data.id)
}

export async function editarNota(id: string, texto: string): Promise<Resultado> {
  const leido = esquemaTexto.safeParse(texto)
  if (!leido.success) return { ok: false, mensaje: leido.error.issues[0]?.message ?? 'Revisa la nota.' }
  const supabase = await crearClienteServidor()
  const { error } = await supabase.from('notas').update({ texto: leido.data }).eq('id', id)
  if (error) return { ok: false, mensaje: 'No pude guardar los cambios, inténtalo otra vez.' }
  return listo()
}

/** Borrado suave; con `borrar = false` la restaura (el «Deshacer»). */
export async function borrarNota(id: string, borrar = true): Promise<Resultado> {
  const supabase = await crearClienteServidor()
  const { error } = await supabase.from('notas').update({ borrado_en: borrar ? new Date().toISOString() : null }).eq('id', id)
  if (error) return { ok: false, mensaje: borrar ? 'No pude borrarla, inténtalo otra vez.' : 'No pude deshacerlo, inténtalo otra vez.' }
  return listo()
}
