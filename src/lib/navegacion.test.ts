import { describe, expect, it } from 'vitest'
import { SECCIONES, SECCIONES_TELEFONO, seccionActiva } from './navegacion'

describe('seccionActiva', () => {
  it('reconoce la ruta exacta', () => {
    expect(seccionActiva('/hoy')).toBe('/hoy')
  })
  it('reconoce subrutas', () => {
    expect(seccionActiva('/proyectos/123')).toBe('/proyectos')
  })
  it('no confunde prefijos parecidos', () => {
    expect(seccionActiva('/hoyx')).toBeNull()
  })
  it('devuelve null fuera de las secciones', () => {
    expect(seccionActiva('/ajustes')).toBeNull()
  })
})

describe('secciones', () => {
  it('el teléfono muestra cuatro secciones (el + va en medio)', () => {
    expect(SECCIONES_TELEFONO.map((s) => s.ruta)).toEqual(['/hoy', '/semana', '/proyectos', '/clientes'])
  })
  it('Dinero no aparece en la v0.1', () => {
    expect(SECCIONES.some((s) => s.nombre === 'Dinero')).toBe(false)
  })
})
