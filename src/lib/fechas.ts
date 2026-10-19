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
