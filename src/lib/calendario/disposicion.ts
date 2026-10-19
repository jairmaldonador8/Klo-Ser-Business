// Cómo se acomodan los eventos con hora dentro de un día: los que se enciman se reparten en columnas.

export type Bloque = { id: string; ini: number; fin: number }
export type Lugar = { col: number; cols: number }

/** Duración mínima que se pinta (min): un evento sin fin ocupa al menos esto. */
export const DURACION_MINIMA = 30

/** Fin efectivo de un evento: su hora de fin, o el mínimo si no tiene. */
export const finEfectivo = (ini: number, fin: number | null) => Math.max(fin ?? ini + DURACION_MINIMA, ini + 15)

/**
 * Reparte bloques en columnas: cada grupo de encimados (cadena de choques) comparte el número de
 * columnas, y cada bloque toma la primera columna libre. Estable: mismo orden, mismo acomodo.
 */
export function acomodar(bloques: readonly Bloque[]): Map<string, Lugar> {
  const orden = [...bloques].sort((a, b) => a.ini - b.ini || b.fin - a.fin || a.id.localeCompare(b.id))
  const lugares = new Map<string, Lugar>()
  let grupo: { id: string; col: number }[] = []
  let finGrupo = -1
  let columnas: number[] = [] // fin de lo último puesto en cada columna

  const cerrar = () => {
    for (const g of grupo) lugares.set(g.id, { col: g.col, cols: columnas.length })
    grupo = []
    columnas = []
  }

  for (const b of orden) {
    if (b.ini >= finGrupo) cerrar()
    let col = columnas.findIndex((fin) => fin <= b.ini)
    if (col < 0) {
      col = columnas.length
      columnas.push(b.fin)
    } else columnas[col] = b.fin
    grupo.push({ id: b.id, col })
    finGrupo = Math.max(finGrupo, b.fin)
  }
  cerrar()
  return lugares
}
