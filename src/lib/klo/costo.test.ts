import { describe, expect, it } from 'vitest'
import { costoUsd, formatoTokens, formatoUsd, sumarUso, tokensTotales } from './costo'

describe('costo de Klo', () => {
  it('suma las respuestas y calcula el costo', () => {
    const g = sumarUso([
      { tokens_entrada: 1_000_000, tokens_salida: 0, tokens_cache_leidos: 0, tokens_cache_escritos: 0 },
      { tokens_entrada: 0, tokens_salida: 1_000_000, tokens_cache_leidos: 1_000_000, tokens_cache_escritos: 1_000_000 },
    ])
    expect(g.mensajes).toBe(2)
    expect(tokensTotales(g)).toBe(4_000_000)
    expect(costoUsd(g)).toBeCloseTo(0.1 + 0.5 + 0.01 + 0.125)
  })

  it('formatea para la pantalla', () => {
    expect(formatoUsd(0)).toBe('$0.00')
    expect(formatoUsd(0.004)).toBe('<$0.01')
    expect(formatoUsd(1.234)).toBe('$1.23')
    expect(formatoTokens(850)).toBe('850')
    expect(formatoTokens(212_400)).toBe('212K')
    expect(formatoTokens(1_400_000)).toBe('1.4M')
    expect(formatoTokens(2_000_000)).toBe('2M')
  })
})
