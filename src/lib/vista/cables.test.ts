import { describe, expect, it } from 'vitest'
import { ALTO_PUERTO, cablesEntre } from './cables'

describe('cablesEntre', () => {
  it('sin mosaicos o con uno solo no hay cables', () => {
    expect(cablesEntre([])).toEqual([])
    expect(cablesEntre([{ x: 0, y: 0, w: 100, h: 100 }])).toEqual([])
  })

  it('une el puerto derecho de uno con el izquierdo del siguiente', () => {
    const [c] = cablesEntre([
      { x: 0, y: 0, w: 100, h: 100 },
      { x: 120, y: 0, w: 100, h: 100 },
    ])
    expect(c.a).toEqual({ x: 100, y: ALTO_PUERTO })
    expect(c.b).toEqual({ x: 120, y: ALTO_PUERTO })
    expect(c.d).toBe(`M100,${ALTO_PUERTO} C160,${ALTO_PUERTO} 60,${ALTO_PUERTO} 120,${ALTO_PUERTO}`)
  })

  it('alterna cables con brasa y grises', () => {
    const cajas = [0, 1, 2, 3].map((n) => ({ x: n * 120, y: 0, w: 100, h: 100 }))
    expect(cablesEntre(cajas).map((c) => c.brasa)).toEqual([true, false, true])
  })

  it('no conecta hacia atrás: el que baja a la siguiente fila queda sin cable', () => {
    const cables = cablesEntre([
      { x: 0, y: 0, w: 100, h: 100 },
      { x: 120, y: 0, w: 100, h: 100 },
      { x: 0, y: 120, w: 100, h: 100 },
      { x: 120, y: 120, w: 100, h: 100 },
    ])
    expect(cables.map((c) => [c.a.y, c.brasa])).toEqual([
      [30, true],
      [150, false],
    ])
  })
})
