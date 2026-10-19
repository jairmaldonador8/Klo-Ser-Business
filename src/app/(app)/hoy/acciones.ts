'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { Resultado } from '@/app/(app)/tareas/acciones'
import { contextoAhora } from '@/lib/datos'
import { crearClienteServidor } from '@/lib/supabase/servidor'

const MAX_MICRO_WINS = 12
const nombre = z.string().trim().min(1, 'Name your micro win.').max(40, 'Too long: 40 characters max.')
const id = z.uuid()

function listo(nuevo?: string): Resultado {
  revalidatePath('/hoy')
  return { ok: true, id: nuevo }
}

export async function crearMicroWin(texto: string): Promise<Resultado> {
  const leido = nombre.safeParse(texto)
  if (!leido.success) return { ok: false, mensaje: leido.error.issues[0]?.message ?? 'Check the name.' }
  const supabase = await crearClienteServidor()
  const { count } = await supabase.from('micro_wins').select('id', { count: 'exact', head: true }).is('borrado_en', null)
  if ((count ?? 0) >= MAX_MICRO_WINS) return { ok: false, mensaje: `Up to ${MAX_MICRO_WINS} micro wins for now.` }
  const { data, error } = await supabase
    .from('micro_wins')
    .insert({ nombre: leido.data.replace(/\s+/g, ' '), orden: count ?? 0 })
    .select('id')
    .single()
  if (error || !data) {
    console.error('crearMicroWin', error)
    return { ok: false, mensaje: 'Couldn’t add it, try again.' }
  }
  return listo(data.id)
}

/** Borrado suave: la historia de días cumplidos se conserva. */
export async function borrarMicroWin(microWinId: string): Promise<Resultado> {
  if (!id.safeParse(microWinId).success) return { ok: false, mensaje: 'Check the details.' }
  const supabase = await crearClienteServidor()
  const { error } = await supabase.from('micro_wins').update({ borrado_en: new Date().toISOString() }).eq('id', microWinId)
  if (error) return { ok: false, mensaje: 'Couldn’t remove it, try again.' }
  return listo()
}

/** Palomea (o despalomea) un micro win en el día de hoy de tu zona: mañana amanece vacío. */
export async function marcarMicroWin(microWinId: string, hecho: boolean): Promise<Resultado> {
  if (!id.safeParse(microWinId).success) return { ok: false, mensaje: 'Check the details.' }
  const [supabase, { hoy }] = await Promise.all([crearClienteServidor(), contextoAhora()])
  const { error } = hecho
    ? await supabase.from('micro_wins_hechos').upsert({ micro_win_id: microWinId, fecha: hoy }, { onConflict: 'micro_win_id,fecha', ignoreDuplicates: true })
    : await supabase.from('micro_wins_hechos').delete().eq('micro_win_id', microWinId).eq('fecha', hoy)
  if (error) {
    console.error('marcarMicroWin', error)
    return { ok: false, mensaje: 'Couldn’t check it off, try again.' }
  }
  return listo()
}
