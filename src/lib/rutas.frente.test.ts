import { describe, expect, it } from 'vitest'
import { conFrente } from './rutas'

describe('conFrente', () => {
  it('agrega el frente abierto a la ruta', () => {
    expect(conFrente('/proyectos', 'top')).toBe('/proyectos?frente=top')
  })
  it('sin frente, la ruta queda igual', () => {
    expect(conFrente('/proyectos', null)).toBe('/proyectos')
  })
  it('respeta lo que la ruta ya traía', () => {
    expect(conFrente('/semana?dia=3', 'top')).toBe('/semana?dia=3&frente=top')
  })
})
