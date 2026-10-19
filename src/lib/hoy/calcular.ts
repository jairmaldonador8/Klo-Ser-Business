import { fechaEn, sumarDias } from '@/lib/fechas'
import { hhmm, type Tarea } from '@/lib/tareas/esquema'

export type Contexto = { hoy: string; ahora: string; zona: string }

const porFechaYHora = (a: Tarea, b: Tarea) =>
  (a.fecha ?? '').localeCompare(b.fecha ?? '') || (hhmm(a.hora) ?? '99').localeCompare(hhmm(b.hora) ?? '99')

/** Cuenta para el medidor: no es junta y es de hoy o vencida. */
const cuenta = (x: Tarea, hoy: string) => x.clase !== 'junta' && x.fecha !== null && x.fecha <= hoy

export function calcularHoy(tareas: readonly Tarea[], { hoy, ahora, zona }: Contexto) {
  const pendientesLista = tareas.filter((x) => !x.completada_en && cuenta(x, hoy))
  const hechas = tareas.filter((x) => x.completada_en && x.clase !== 'junta' && fechaEn(new Date(x.completada_en), zona) === hoy).length

  const vencidas = pendientesLista.filter((x) => x.fecha! < hoy).sort(porFechaYHora)
  const hoySinHora = pendientesLista.filter((x) => x.fecha === hoy && !x.hora)
  const deUnToque = [...vencidas, ...hoySinHora]
  const tuDia = tareas.filter((x) => x.fecha === hoy && x.hora).sort(porFechaYHora)

  const porVenir = tuDia.find((x) => !x.completada_en && x.clase !== 'junta' && hhmm(x.hora)! >= ahora)
  return { pendientes: pendientesLista.length, hechas, siguiente: porVenir ?? deUnToque[0] ?? null, deUnToque, tuDia }
}

export function enRiesgo(tareas: readonly Tarea[], hoy: string): Tarea[] {
  const limite = sumarDias(hoy, 2)
  return tareas.filter((x) => x.clase === 'entrega' && !x.completada_en && x.fecha && x.fecha <= limite).sort(porFechaYHora)
}
