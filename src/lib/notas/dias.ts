import { sumarDias } from '@/lib/fechas'

// Las notas como bitácora: una sección por día (en tu zona), para no perder el hilo de lo que vas haciendo.

export type GrupoDia<T> = { dia: string; etiqueta: string; notas: T[] }

/** «Today», «Yesterday», «Sun, Oct 18»; con año si no es este. */
export function etiquetaDiaNota(fecha: string, hoy: string): string {
  if (fecha === hoy) return 'Today'
  if (fecha === sumarDias(hoy, -1)) return 'Yesterday'
  const opciones: Intl.DateTimeFormatOptions = { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric' }
  if (fecha.slice(0, 4) !== hoy.slice(0, 4)) opciones.year = 'numeric'
  return new Intl.DateTimeFormat('en-US', opciones).format(new Date(`${fecha}T12:00:00Z`))
}

/** Junta por día notas que ya vienen de la más nueva a la más vieja (con su día calculado en tu zona). */
export function agruparPorDia<T extends { dia: string; etiqueta: string }>(notas: readonly T[]): GrupoDia<T>[] {
  const grupos: GrupoDia<T>[] = []
  for (const n of notas) {
    const ultimo = grupos.at(-1)
    if (ultimo?.dia === n.dia) ultimo.notas.push(n)
    else grupos.push({ dia: n.dia, etiqueta: n.etiqueta, notas: [n] })
  }
  return grupos
}
