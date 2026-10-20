import type { SupabaseClient } from '@supabase/supabase-js'
import { diasEntre, sumarDias } from '@/lib/fechas'
import { fechasDe, HORIZONTE, type Fin, type Regla } from '@/lib/repetir'
import type { Database } from '@/lib/supabase/tipos'

// Lo que comparten la hoja de la task y Klo para crear series: cada repetición es una task real con `serie_id`.

export const CAMPOS_PLANTILLA = 'espacio_id, titulo, clase, fecha, hora, hora_fin, fecha_fin, color, proyecto_id, responsable_id'
export type Plantilla = {
  espacio_id: string
  titulo: string
  clase: string
  fecha: string | null
  hora: string | null
  hora_fin: string | null
  fecha_fin: string | null
  color: string | null
  proyecto_id: string | null
  responsable_id: string
}

/** Filas nuevas copiando la plantilla en cada fecha (si la plantilla dura varios días, cada copia también). */
export function copias(p: Plantilla, fechas: string[], serieId: string) {
  const dias = p.fecha && p.fecha_fin ? diasEntre(p.fecha_fin, p.fecha) : 0
  return fechas.map((fecha) => ({
    espacio_id: p.espacio_id,
    titulo: p.titulo,
    clase: p.clase,
    fecha,
    hora: p.hora,
    hora_fin: p.hora_fin,
    fecha_fin: dias > 0 ? sumarDias(fecha, dias) : null,
    color: p.color,
    proyecto_id: p.proyecto_id,
    responsable_id: p.responsable_id,
    serie_id: serieId,
  }))
}

/** Crea la serie que empieza en la task `p` (ya guardada o por guardar) y regresa sus fechas hasta el horizonte. */
export async function nacerSerie(supabase: SupabaseClient<Database>, p: Plantilla, regla: Regla, fin: Fin, hoy: string) {
  const inicio = p.fecha!
  const tope = sumarDias(inicio > hoy ? inicio : hoy, HORIZONTE)
  const generado = fin.hasta && fin.hasta < tope ? fin.hasta : tope
  const { data: serie, error } = await supabase
    .from('series')
    .insert({ espacio_id: p.espacio_id, regla, inicio, hasta: fin.hasta, conteo: fin.conteo, generado_hasta: generado })
    .select('id')
    .single()
  if (error || !serie) return { error, serieId: null, fechas: [] as string[] }
  return { error: null, serieId: serie.id as string, fechas: fechasDe(regla, inicio, tope, fin) }
}
