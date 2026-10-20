import { zonaValida } from './saludo'

/** «2026-10-18»: el día calendario de ese instante en la zona del usuario. */
export function fechaEn(instante: Date, zona: string): string {
  // en-CA da AAAA-MM-DD.
  return new Intl.DateTimeFormat('en-CA', { timeZone: zonaValida(zona), year: 'numeric', month: '2-digit', day: '2-digit' }).format(instante)
}

/** «09:05» en la zona del usuario. */
export function horaMinEn(instante: Date, zona: string): string {
  return new Intl.DateTimeFormat('en-GB', { timeZone: zonaValida(zona), hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(instante)
}

export function sumarDias(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().slice(0, 10)
}

function diferencia(fecha: string, hoy: string): number {
  return Math.round((Date.parse(`${fecha}T12:00:00Z`) - Date.parse(`${hoy}T12:00:00Z`)) / 86_400_000)
}

export function etiquetaDia(fecha: string, hoy: string): string {
  const n = diferencia(fecha, hoy)
  if (n === 0) return 'today'
  if (n === 1) return 'tomorrow'
  if (n === -1) return 'yesterday'
  return n > 0 ? `in ${n} days` : `${-n} days ago`
}

/** «Tuesday, Oct 20»: para encabezar un día de la agenda. */
export function nombreDia(fecha: string): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'short' }).format(new Date(`${fecha}T12:00:00Z`))
}

export { diferencia as diasEntre }

/** Cuánto le lleva esa zona a UTC (ms) en ese instante. */
function desfase(instante: Date, zona: string): number {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: zonaValida(zona), hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(instante)
  const n = (t: string) => Number(partes.find((p) => p.type === t)?.value)
  return Date.UTC(n('year'), n('month') - 1, n('day'), n('hour'), n('minute'), n('second')) - instante.getTime()
}

/** «2026-10-20» + «16:00» leídos en la zona del usuario → el instante real (para avisos). */
export function instanteEn(fecha: string, hora: string, zona: string): Date {
  const comoUtc = Date.parse(`${fecha}T${hora.slice(0, 5)}:00Z`)
  // Dos pasadas: la segunda corrige si el desfase cambia entre la suposición y la hora real (horario de verano).
  const primero = comoUtc - desfase(new Date(comoUtc), zona)
  return new Date(comoUtc - desfase(new Date(primero), zona))
}
