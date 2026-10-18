import { describe, expect, it } from 'vitest'
import { avance, diasRestantes, porcentaje } from './avance'

const conteo = { total: 4, hechas: 1 }

describe('avance', () => {
  it('por tareas: hechas entre total, 0 si no hay tareas', () => {
    expect(avance({ modo_avance: 'tareas' }, conteo)).toBe(0.25)
    expect(avance({ modo_avance: 'tareas' }, { total: 0, hechas: 0 })).toBe(0)
  })
  it('manual: cifra actual entre meta, tope en 1', () => {
    expect(avance({ modo_avance: 'manual', cifra_actual: 30, cifra_meta: 60 }, conteo)).toBe(0.5)
    expect(avance({ modo_avance: 'manual', cifra_actual: 90, cifra_meta: 60 }, conteo)).toBe(1)
  })
  it('hitos: 0 por ahora', () => {
    expect(avance({ modo_avance: 'hitos' }, conteo)).toBe(0)
  })
})

describe('diasRestantes', () => {
  it('cuenta los días a la fecha meta', () => {
    expect(diasRestantes('2026-10-31', '2026-10-18')).toBe(13)
    expect(diasRestantes(null, '2026-10-18')).toBeNull()
  })
})

describe('porcentaje', () => {
  it('redondea hacia abajo con espacio antes del %', () => {
    expect(porcentaje(0.554)).toBe('55 %')
  })
})
