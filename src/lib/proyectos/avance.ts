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

/** «faltan 13 días», «la meta es hoy», «meta vencida hace 2 días». */
export function textoFaltan(fechaMeta: string | null, hoy: string): string {
  const n = diasRestantes(fechaMeta, hoy)
  if (n === null) return 'sin fecha meta'
  if (n === 0) return 'la meta es hoy'
  if (n === 1) return 'falta 1 día'
  return n > 0 ? `faltan ${n} días` : `meta vencida hace ${-n} ${n === -1 ? 'día' : 'días'}`
}

const numero = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 })

/** «2 de 3 tareas» o, por cifra, «12 de 60». */
export function cuenta(p: ProyectoAvance & ConteoTareas): string {
  if (p.modo_avance === 'manual') return `${numero.format(Number(p.cifra_actual ?? 0))} de ${numero.format(Number(p.cifra_meta ?? 0))}`
  if (p.total === 0) return 'sin tareas todavía'
  return `${p.hechas} de ${p.total} ${p.total === 1 ? 'tarea' : 'tareas'}`
}
