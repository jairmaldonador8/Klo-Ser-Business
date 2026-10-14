import { describe, expect, it } from 'vitest'
import { MOSAICOS, SECCIONES } from './registro'
import { acomodarMosaicos, leerVista, mover, resolverLista, resolverVista } from './resolver'

const REGISTRO = [
  { id: 'a', obligatorio: true },
  { id: 'b' },
  { id: 'c' },
] as const

describe('resolverLista', () => {
  it('sin preferencias, todo visible en el orden del registro', () => {
    expect(resolverLista(REGISTRO, undefined).map((x) => [x.id, x.visible])).toEqual([
      ['a', true],
      ['b', true],
      ['c', true],
    ])
  })
  it('respeta el orden y lo oculto de las preferencias', () => {
    const r = resolverLista(REGISTRO, [
      { id: 'c', visible: true },
      { id: 'b', visible: false },
      { id: 'a', visible: true },
    ])
    expect(r.map((x) => [x.id, x.visible])).toEqual([
      ['c', true],
      ['b', false],
      ['a', true],
    ])
  })
  it('descarta ids desconocidos y repetidos', () => {
    const r = resolverLista(REGISTRO, [
      { id: 'zzz', visible: true },
      { id: 'b', visible: false },
      { id: 'b', visible: true },
    ])
    expect(r.map((x) => x.id)).toEqual(['b', 'a', 'c'])
    expect(r[0].visible).toBe(false)
  })
  it('lo que falta (algo nuevo del registro) se agrega al final, visible', () => {
    const r = resolverLista(REGISTRO, [{ id: 'b', visible: true }])
    expect(r.map((x) => [x.id, x.visible])).toEqual([
      ['b', true],
      ['a', true],
      ['c', true],
    ])
  })
  it('lo obligatorio siempre se ve', () => {
    expect(resolverLista(REGISTRO, [{ id: 'a', visible: false }]).find((x) => x.id === 'a')?.visible).toBe(true)
  })
})

describe('leerVista', () => {
  it('acepta la forma guardada', () => {
    expect(leerVista({ secciones: [{ id: 'hoy', visible: true }] })).toEqual({ secciones: [{ id: 'hoy', visible: true }] })
  })
  it('lo que no tiene forma se trata como vacío, sin romper', () => {
    expect(leerVista('basura')).toEqual({})
    expect(leerVista({ secciones: 'no' })).toEqual({})
    expect(leerVista(null)).toEqual({})
  })
})

describe('resolverVista', () => {
  it('Hoy y el medidor nunca se pueden ocultar', () => {
    const v = resolverVista({
      secciones: [{ id: 'hoy', visible: false }],
      mosaicos_hoy: [{ id: 'medidor', visible: false }],
    })
    expect(v.secciones.find((s) => s.id === 'hoy')?.visible).toBe(true)
    expect(v.mosaicos.find((m) => m.id === 'medidor')?.visible).toBe(true)
  })
  it('trae todas las secciones y mosaicos del registro', () => {
    const v = resolverVista({})
    expect(v.secciones.map((s) => s.id)).toEqual(SECCIONES.map((s) => s.id))
    expect(v.mosaicos.map((m) => m.id)).toEqual(MOSAICOS.map((m) => m.id))
  })
  it('Dinero no aparece en la v0.1', () => {
    expect(SECCIONES.some((s) => s.nombre === 'Dinero')).toBe(false)
  })
})

describe('mover', () => {
  const lista = [
    { id: 'a', visible: true },
    { id: 'b', visible: true },
    { id: 'c', visible: false },
  ]
  it('sube y baja un lugar', () => {
    expect(mover(lista, 'b', -1).map((x) => x.id)).toEqual(['b', 'a', 'c'])
    expect(mover(lista, 'b', 1).map((x) => x.id)).toEqual(['a', 'c', 'b'])
  })
  it('en las orillas no hace nada', () => {
    expect(mover(lista, 'a', -1)).toEqual(lista)
    expect(mover(lista, 'c', 1)).toEqual(lista)
  })
})

describe('acomodarMosaicos', () => {
  it('los visibles quedan en el orden arrastrado y los ocultos al final', () => {
    expect(acomodarMosaicos(['d', 'a', 'b'], ['c'])).toEqual([
      { id: 'd', visible: true },
      { id: 'a', visible: true },
      { id: 'b', visible: true },
      { id: 'c', visible: false },
    ])
  })
  it('ocultar uno lo manda al final como oculto', () => {
    expect(acomodarMosaicos(['a', 'd'], ['b', 'c']).map((x) => [x.id, x.visible])).toEqual([
      ['a', true],
      ['d', true],
      ['b', false],
      ['c', false],
    ])
  })
})
