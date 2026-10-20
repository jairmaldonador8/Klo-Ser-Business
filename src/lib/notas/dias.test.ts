import { describe, expect, it } from 'vitest'
import { agruparPorDia, etiquetaDiaNota } from './dias'

describe('etiquetaDiaNota', () => {
  it('nombra los días con amabilidad', () => {
    expect(etiquetaDiaNota('2026-10-20', '2026-10-20')).toBe('Today')
    expect(etiquetaDiaNota('2026-10-19', '2026-10-20')).toBe('Yesterday')
    expect(etiquetaDiaNota('2026-10-18', '2026-10-20')).toBe('Sun, Oct 18')
    expect(etiquetaDiaNota('2025-12-31', '2026-10-20')).toBe('Wed, Dec 31, 2025')
  })
})

describe('agruparPorDia', () => {
  it('junta las notas de cada día, en el orden en que llegan', () => {
    const n = (id: string, dia: string) => ({ id, dia, etiqueta: dia })
    const grupos = agruparPorDia([n('a', '2026-10-20'), n('b', '2026-10-20'), n('c', '2026-10-18')])
    expect(grupos.map((g) => [g.dia, g.notas.map((x) => x.id)])).toEqual([
      ['2026-10-20', ['a', 'b']],
      ['2026-10-18', ['c']],
    ])
  })
})
