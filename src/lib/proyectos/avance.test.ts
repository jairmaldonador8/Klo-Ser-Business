import { describe, expect, it } from 'vitest'
import { avance, cuenta, diasRestantes, porcentaje, textoFaltan } from './avance'

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

describe('textoFaltan', () => {
  it('dice cuánto falta o cuánto lleva vencida', () => {
    expect(textoFaltan(null, '2026-10-18')).toBe('sin fecha meta')
    expect(textoFaltan('2026-10-18', '2026-10-18')).toBe('la meta es hoy')
    expect(textoFaltan('2026-10-19', '2026-10-18')).toBe('falta 1 día')
    expect(textoFaltan('2026-10-31', '2026-10-18')).toBe('faltan 13 días')
    expect(textoFaltan('2026-10-17', '2026-10-18')).toBe('meta vencida hace 1 día')
    expect(textoFaltan('2026-10-15', '2026-10-18')).toBe('meta vencida hace 3 días')
  })
})

describe('cuenta', () => {
  it('por tareas cuenta hechas de total; por cifra, la cifra', () => {
    expect(cuenta({ modo_avance: 'tareas', total: 3, hechas: 1 })).toBe('1 de 3 tareas')
    expect(cuenta({ modo_avance: 'tareas', total: 1, hechas: 0 })).toBe('0 de 1 tarea')
    expect(cuenta({ modo_avance: 'tareas', total: 0, hechas: 0 })).toBe('sin tareas todavía')
    expect(cuenta({ modo_avance: 'manual', cifra_actual: 12, cifra_meta: 60, total: 0, hechas: 0 })).toBe('12 de 60')
  })
})
