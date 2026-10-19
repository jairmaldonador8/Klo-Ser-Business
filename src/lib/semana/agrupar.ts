import { nombreDia, sumarDias } from '@/lib/fechas'
import { hhmm, type Tarea } from '@/lib/tareas/esquema'

export type Grupo = {
  clave: string
  titulo: string
  /** «today», «tomorrow» o vacío: lo que va junto al título. */
  marca?: string
  tareas: Tarea[]
}

/** Días de la semana que siempre se muestran, aunque estén libres. */
export const DIAS = 7

const porHora = (a: Tarea, b: Tarea) => (hhmm(a.hora) ?? '99').localeCompare(hhmm(b.hora) ?? '99')
const porFechaYHora = (a: Tarea, b: Tarea) => (a.fecha ?? '').localeCompare(b.fecha ?? '') || porHora(a, b)

/**
 * Tus pendientes por fecha: vencidas, los próximos 7 días (hoy primero, aunque estén libres),
 * lo que viene después y lo que no tiene fecha. Solo lo que falta por hacer.
 */
export function agruparPendientes(tareas: readonly Tarea[], hoy: string): Grupo[] {
  const pendientes = tareas.filter((t) => !t.completada_en)
  const fin = sumarDias(hoy, DIAS - 1)
  const grupos: Grupo[] = []

  const vencidas = pendientes.filter((t) => t.fecha !== null && t.fecha < hoy).sort(porFechaYHora)
  if (vencidas.length) grupos.push({ clave: 'vencidas', titulo: 'Overdue', tareas: vencidas })

  for (let n = 0; n < DIAS; n++) {
    const dia = sumarDias(hoy, n)
    grupos.push({
      clave: dia,
      titulo: nombreDia(dia),
      marca: n === 0 ? 'today' : n === 1 ? 'tomorrow' : undefined,
      tareas: pendientes.filter((t) => t.fecha === dia).sort(porHora),
    })
  }

  const despues = pendientes.filter((t) => t.fecha !== null && t.fecha > fin).sort(porFechaYHora)
  if (despues.length) grupos.push({ clave: 'despues', titulo: 'Later', tareas: despues })

  const sinFecha = pendientes.filter((t) => t.fecha === null)
  if (sinFecha.length) grupos.push({ clave: 'sin-fecha', titulo: 'No date', tareas: sinFecha })

  return grupos
}
