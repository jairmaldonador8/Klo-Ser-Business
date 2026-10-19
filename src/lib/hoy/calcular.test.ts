import { describe, expect, it } from 'vitest'
import type { Tarea } from '@/lib/tareas/esquema'
import { calcularHoy, enRiesgo } from './calcular'

const hoy = '2026-10-18'
let n = 0
const t = (p: Partial<Tarea>): Tarea => ({
  id: String(++n), espacio_id: 'a', titulo: `t${n}`, clase: 'tarea', fecha: hoy, hora: null, hora_fin: null,
  proyecto_id: null, completada_en: null, ...p,
})
const ctx = { hoy, ahora: '11:00', zona: 'America/Monterrey' }

describe('calcularHoy', () => {
  it('cuenta pendientes de hoy y vencidas, sin juntas ni futuras', () => {
    const r = calcularHoy([t({}), t({ fecha: '2026-10-16' }), t({ clase: 'junta', hora: '12:00' }), t({ fecha: '2026-10-20' }), t({ fecha: null })], ctx)
    expect(r.pendientes).toBe(2)
  })
  it('cuenta hechas hoy por su completada_en en la zona', () => {
    const r = calcularHoy([t({ completada_en: '2026-10-18T17:00:00Z' }), t({ completada_en: '2026-10-17T17:00:00Z', fecha: '2026-10-17' }), t({})], ctx)
    expect(r.hechas).toBe(1)
    expect(r.pendientes).toBe(1)
  })
  it('lo siguiente es la próxima con hora ≥ ahora', () => {
    const r = calcularHoy([t({ titulo: 'temprano', hora: '09:00' }), t({ titulo: 'luego', hora: '13:00' }), t({ titulo: 'antes', hora: '12:00' })], ctx)
    expect(r.siguiente?.titulo).toBe('antes')
  })
  it('sin horas por venir, lo siguiente es la primera de De un toque (vencidas primero, la más vieja)', () => {
    const r = calcularHoy([t({ titulo: 'hoy' }), t({ titulo: 'vieja', fecha: '2026-10-10' }), t({ titulo: 'ayer', fecha: '2026-10-17' })], ctx)
    expect(r.deUnToque.map((x) => x.titulo)).toEqual(['vieja', 'ayer', 'hoy'])
    expect(r.siguiente?.titulo).toBe('vieja')
  })
  it('De un toque: hoy sin hora + todas las vencidas; Tu día: hoy con hora en orden', () => {
    const r = calcularHoy([t({ titulo: 'a', hora: '15:00' }), t({ titulo: 'b', hora: '09:00', completada_en: '2026-10-18T15:30:00Z' }), t({ titulo: 'c' }), t({ titulo: 'd', fecha: '2026-10-17', hora: '10:00' })], ctx)
    expect(r.deUnToque.map((x) => x.titulo)).toEqual(['d', 'c'])
    expect(r.tuDia.map((x) => x.titulo)).toEqual(['b', 'a'])
  })
})

describe('enRiesgo', () => {
  it('entregas no hechas a ≤ 2 días, vencidas primero', () => {
    const r = enRiesgo([t({ clase: 'entrega', titulo: 'x', fecha: '2026-10-20' }), t({ clase: 'entrega', titulo: 'y', fecha: '2026-10-15' }), t({ clase: 'entrega', fecha: '2026-10-21' }), t({ titulo: 'no entrega', fecha: '2026-10-15' })], hoy)
    expect(r.map((x) => x.titulo)).toEqual(['y', 'x'])
  })
})

describe('tareasHoy', () => {
  it('lo vencido pendiente primero, luego lo de hoy; lo hecho hoy se queda y lo de otro día no; sin juntas', () => {
    const vencida = t({ fecha: '2026-10-16' })
    const vencidaHechaAyer = t({ fecha: '2026-10-16', completada_en: '2026-10-17T18:00:00Z' })
    const hoyTarde = t({ hora: '17:00' })
    const hoyHecha = t({ completada_en: '2026-10-18T16:00:00Z' })
    const junta = t({ clase: 'junta', hora: '12:00' })
    const manana = t({ fecha: '2026-10-19' })
    const r = calcularHoy([hoyTarde, manana, junta, hoyHecha, vencidaHechaAyer, vencida], ctx)
    expect(r.tareasHoy).toEqual([vencida, hoyTarde, hoyHecha])
  })
})
