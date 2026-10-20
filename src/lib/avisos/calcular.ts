import { fechaEn, horaMinEn, instanteEn } from '@/lib/fechas'

// Qué avisos tocan en esta pasada del cron. Puro: recibe la hora actual.

export type TareaAviso = { id: string; titulo: string; fecha: string; hora: string; aviso_min: number; zona: string }

/** Margen después del inicio: si el cron se atrasa un poco, el aviso todavía sale. */
const GRACIA_MS = 5 * 60_000
/** El resumen solo sale en la mañana; si el cron estuvo caído, no llega a las 3 pm. */
const RESUMEN_HASTA_HORAS = 4

export function tocaAviso(t: TareaAviso, ahora: Date): boolean {
  const inicio = instanteEn(t.fecha, t.hora, t.zona).getTime()
  const desde = inicio - t.aviso_min * 60_000
  return ahora.getTime() >= desde && ahora.getTime() < inicio + GRACIA_MS
}

/** «4:00 PM». */
export function hora12(hora: string): string {
  const [h, m] = hora.split(':').map(Number)
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}

/** El cuerpo del push; el título es el de la task. */
export function textoAviso(t: TareaAviso, ahora: Date): string {
  const faltan = Math.round((instanteEn(t.fecha, t.hora, t.zona).getTime() - ahora.getTime()) / 60_000)
  return `${faltan > 0 ? `In ${faltan} min` : 'Now'} · ${hora12(t.hora)}`
}

/** La fecha local si toca mandar el resumen ahora; null si no. */
export function tocaResumen(p: { resumen_hora: string | null; resumen_enviado: string | null; zona: string }, ahora: Date): string | null {
  if (!p.resumen_hora) return null
  const hoy = fechaEn(ahora, p.zona)
  if (p.resumen_enviado === hoy) return null
  const [h, m] = horaMinEn(ahora, p.zona).split(':').map(Number)
  const [rh, rm] = p.resumen_hora.split(':').map(Number)
  const minutos = h * 60 + m - (rh * 60 + rm)
  return minutos >= 0 && minutos < RESUMEN_HASTA_HORAS * 60 ? hoy : null
}

export function textoResumen(tareas: { titulo: string; hora: string | null }[], ahoraLocal: string): string {
  if (!tareas.length) return 'Nothing scheduled today. Plan it with Klo.'
  const conHora = tareas.filter((t) => t.hora).sort((a, b) => a.hora!.localeCompare(b.hora!))
  const siguiente = conHora.find((t) => t.hora!.slice(0, 5) >= ahoraLocal)
  const n = `${tareas.length} today`
  if (siguiente) return `${n} · ${siguiente === conHora[0] ? 'first' : 'next'} at ${hora12(siguiente.hora!)}: ${siguiente.titulo}`
  return `${n}: ${tareas.find((t) => !t.hora)?.titulo ?? tareas[0].titulo}`
}
