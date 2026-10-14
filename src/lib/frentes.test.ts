import { describe, expect, it } from 'vitest'
import { atajoDesdeNombre, inicialDesdeNombre, MAX_FRENTES, prepararFrentes } from './frentes'

describe('atajoDesdeNombre', () => {
  it('toma la primera palabra en minúsculas', () => {
    expect(atajoDesdeNombre('Top Digital')).toBe('top')
    expect(atajoDesdeNombre('Marca personal')).toBe('marca')
  })
  it('quita guiones, acentos y signos', () => {
    expect(atajoDesdeNombre('Klo-Ser')).toBe('kloser')
    expect(atajoDesdeNombre('Ñandú Café')).toBe('nandu')
    expect(atajoDesdeNombre('¡Hola!')).toBe('hola')
  })
  it('máximo 12 caracteres', () => {
    expect(atajoDesdeNombre('Supercalifragilístico')).toBe('supercalifra')
  })
  it('sin letras usa «frente»', () => {
    expect(atajoDesdeNombre('   ')).toBe('frente')
    expect(atajoDesdeNombre('—')).toBe('frente')
  })
})

describe('inicialDesdeNombre', () => {
  it('primera letra o número en mayúscula', () => {
    expect(inicialDesdeNombre('Klo-Ser')).toBe('K')
    expect(inicialDesdeNombre('¡ojo')).toBe('O')
    expect(inicialDesdeNombre('Ñandú')).toBe('N')
  })
  it('sin letras usa F', () => {
    expect(inicialDesdeNombre('')).toBe('F')
  })
})

describe('prepararFrentes', () => {
  it('limpia espacios y descarta vacíos', () => {
    const r = prepararFrentes(['  Top   Digital ', '', '   '])
    expect(r).toEqual({ ok: true, frentes: [{ nombre: 'Top Digital', inicial: 'T', atajo: 'top' }] })
  })
  it('no repite atajos', () => {
    const r = prepararFrentes(['Marca A', 'Marca B'])
    expect(r.ok && r.frentes.map((f) => f.atajo)).toEqual(['marca', 'marca2'])
  })
  it('respeta atajos ya ocupados', () => {
    const r = prepararFrentes(['Top'], ['top'])
    expect(r.ok && r.frentes[0].atajo).toBe('top2')
  })
  it('pide al menos uno', () => {
    expect(prepararFrentes(['', ' '])).toEqual({ ok: false, mensaje: 'Escribe al menos un frente.' })
  })
  it('pone tope', () => {
    const muchos = Array.from({ length: MAX_FRENTES + 1 }, (_, i) => `Frente ${i}`)
    expect(prepararFrentes(muchos).ok).toBe(false)
  })
  it('rechaza nombres de más de 40 letras', () => {
    expect(prepararFrentes(['x'.repeat(41)]).ok).toBe(false)
  })
})
