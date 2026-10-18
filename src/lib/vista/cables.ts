// Cables entre mosaicos, como un editor de nodos: cada mosaico se conecta con el
// siguiente, del puerto derecho de uno al puerto izquierdo del otro. Solo hacia
// adelante: si el siguiente queda abajo a la izquierda, no hay cable (cruzaría la pantalla).

export type Caja = { x: number; y: number; w: number; h: number }
export type Punto = { x: number; y: number }
export type Cable = { d: string; a: Punto; b: Punto; brasa: boolean }

/** Altura del puerto: a la línea del título, como el encabezado de un nodo. */
export const ALTO_PUERTO = 30

export function cablesEntre(cajas: Caja[]): Cable[] {
  const cables: Cable[] = []
  for (let i = 0; i < cajas.length - 1; i++) {
    const A = cajas[i]
    const B = cajas[i + 1]
    if (B.x < A.x + A.w) continue
    const a = { x: A.x + A.w, y: A.y + ALTO_PUERTO }
    const b = { x: B.x, y: B.y + ALTO_PUERTO }
    // La curva sale recta del puerto y entra recta al otro.
    const tiro = Math.max(60, Math.abs(b.x - a.x) / 2)
    cables.push({
      d: `M${a.x},${a.y} C${a.x + tiro},${a.y} ${b.x - tiro},${b.y} ${b.x},${b.y}`,
      a,
      b,
      // Uno sí, uno no: los que llevan brasa son los que brillan.
      brasa: cables.length % 2 === 0,
    })
  }
  return cables
}
