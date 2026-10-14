import { describe, expect, it } from 'vitest'
import { seccionActiva } from './navegacion'

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
