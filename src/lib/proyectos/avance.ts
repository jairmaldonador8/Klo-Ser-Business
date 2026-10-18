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
