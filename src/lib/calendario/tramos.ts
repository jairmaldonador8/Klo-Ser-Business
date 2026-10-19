import { sumarDias } from '@/lib/fechas'
import type { Tarea } from '@/lib/tareas/esquema'
import { aMinutos, deMinutos } from './fechas'

// Eventos que cruzan días: cada instante es «minutos absolutos» (días desde 1970 × 1440 + minuto del día),
// así mover, estirar y seleccionar entre días es pura resta.

const DIA = 1440
const diaN = (fecha: string) => Math.floor(Date.parse(`${fecha}T00:00:00Z`) / 86_400_000)

export const absoluto = (fecha: string, min: number) => diaN(fecha) * DIA + min

export function deAbsoluto(abs: number): { fecha: string; min: number } {
  const n = Math.floor(abs / DIA)
  return { fecha: new Date(n * 86_400_000 + 43_200_000).toISOString().slice(0, 10), min: abs - n * DIA }
}

/** Duración que se pinta para un evento sin hora de fin. */
export const SIN_FIN = 30

/** Inicio y fin absolutos de una task con hora. Sin hora de fin: dura 30 min. */
export function extremos(t: Pick<Tarea, 'fecha' | 'hora' | 'hora_fin' | 'fecha_fin'>): { ini: number; fin: number } {
  const ini = absoluto(t.fecha!, aMinutos(t.hora!))
  if (!t.hora_fin) return { ini, fin: ini + SIN_FIN }
  return { ini, fin: absoluto(t.fecha_fin ?? t.fecha!, aMinutos(t.hora_fin)) }
}

/** Campos de una task para el rango [a, b) en minutos absolutos. Si termina otro día, lleva fecha_fin. */
export function campos(a: number, b: number): { fecha: string; hora: string; fecha_fin: string | null; hora_fin: string } {
  const i = deAbsoluto(a)
  const f = deAbsoluto(b)
  // Terminar justo a medianoche cuenta como el final del día anterior (23:59), no como otro día vacío.
  const fin = f.min === 0 && f.fecha > i.fecha ? { fecha: sumarDias(f.fecha, -1), min: DIA - 1 } : f
  return { fecha: i.fecha, hora: deMinutos(i.min), fecha_fin: fin.fecha === i.fecha ? null : fin.fecha, hora_fin: deMinutos(fin.min) }
}

export type Tramo = { dia: string; ini: number; fin: number; tipo: 'unico' | 'inicio' | 'medio' | 'fin' }

/** Los pedazos de un rango absoluto que caen en cada día (lunes 5 pm → martes 4 pm: dos tramos). */
export function tramos(a: number, b: number): Tramo[] {
  const salida: Tramo[] = []
  const primero = Math.floor(a / DIA)
  const ultimo = Math.floor((b - 1) / DIA)
  for (let n = primero; n <= ultimo; n++) {
    const ini = Math.max(a, n * DIA) - n * DIA
    const fin = Math.min(b, (n + 1) * DIA) - n * DIA
    if (fin <= ini) continue
    const tipo = primero === ultimo ? 'unico' : n === primero ? 'inicio' : n === ultimo ? 'fin' : 'medio'
    salida.push({ dia: deAbsoluto(n * DIA).fecha, ini, fin, tipo })
  }
  return salida
}

/** Los días que toca una task (de su fecha a su fecha_fin), para el mes y el renglón «todo el día». */
export function diasDe(t: Pick<Tarea, 'fecha' | 'fecha_fin'>): string[] {
  if (!t.fecha) return []
  const dias = [t.fecha]
  for (let d = t.fecha; t.fecha_fin && d < t.fecha_fin; ) {
    d = sumarDias(d, 1)
    dias.push(d)
  }
  return dias
}

const diaCortoUTC = (fecha: string) => new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'short' }).format(new Date(`${fecha}T12:00:00Z`))

/** «5 pm – 6:30 pm» o, si cruza días, «Mon 5 pm – Tue 4 pm». */
export function etiquetaRango(a: number, b: number, horaCorta: (h: string) => string): string {
  const i = deAbsoluto(a)
  const f = deAbsoluto(b)
  if (i.fecha === f.fecha || (f.min === 0 && b - a <= DIA)) return `${horaCorta(deMinutos(i.min))} – ${horaCorta(deMinutos(f.min === 0 && f.fecha > i.fecha ? DIA - 1 : f.min))}`
  return `${diaCortoUTC(i.fecha)} ${horaCorta(deMinutos(i.min))} – ${diaCortoUTC(f.fecha)} ${horaCorta(deMinutos(f.min))}`
}
