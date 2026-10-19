import { diasEntre } from '@/lib/fechas'

export type ProyectoAvance = { modo_avance: 'hitos' | 'tareas' | 'manual'; cifra_actual?: number | null; cifra_meta?: number | null }
export type ConteoTareas = { total: number; hechas: number }

export function avance(p: ProyectoAvance, conteo: ConteoTareas): number {
  if (p.modo_avance === 'manual') return p.cifra_meta ? Math.min(1, Number(p.cifra_actual ?? 0) / Number(p.cifra_meta)) : 0
  if (p.modo_avance === 'tareas') return conteo.total ? conteo.hechas / conteo.total : 0
  return 0 // hitos: llegan en la siguiente parte
}

export const diasRestantes = (fechaMeta: string | null, hoy: string) => (fechaMeta ? diasEntre(fechaMeta, hoy) : null)
export const porcentaje = (x: number) => `${Math.floor(x * 100)} %`

/** «13 days left», «due today», «overdue by 2 days». */
export function textoFaltan(fechaMeta: string | null, hoy: string): string {
  const n = diasRestantes(fechaMeta, hoy)
  if (n === null) return 'no target date'
  if (n === 0) return 'due today'
  if (n === 1) return '1 day left'
  return n > 0 ? `${n} days left` : `overdue by ${-n} ${n === -1 ? 'day' : 'days'}`
}

const numero = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })

/** «2 of 3 tasks» o, por cifra, «12 of 60». */
export function cuenta(p: ProyectoAvance & ConteoTareas): string {
  if (p.modo_avance === 'manual') return `${numero.format(Number(p.cifra_actual ?? 0))} of ${numero.format(Number(p.cifra_meta ?? 0))}`
  if (p.total === 0) return 'no tasks yet'
  return `${p.hechas} of ${p.total} ${p.total === 1 ? 'task' : 'tasks'}`
}
