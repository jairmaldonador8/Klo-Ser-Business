import { describe, expect, it } from 'vitest'
import { absoluto, campos, deAbsoluto, diasDe, extremos, tramos } from './tramos'

describe('eventos de varios días', () => {
  const lun5pm = absoluto('2026-10-19', 17 * 60)
  const mar4pm = absoluto('2026-10-20', 16 * 60)

  it('ida y vuelta de minutos absolutos', () => {
    expect(deAbsoluto(lun5pm)).toEqual({ fecha: '2026-10-19', min: 1020 })
    expect(mar4pm - lun5pm).toBe(23 * 60)
  })

  it('lunes 5 pm → martes 4 pm son dos tramos', () => {
    expect(tramos(lun5pm, mar4pm)).toEqual([
      { dia: '2026-10-19', ini: 1020, fin: 1440, tipo: 'inicio' },
      { dia: '2026-10-20', ini: 0, fin: 960, tipo: 'fin' },
    ])
    expect(tramos(absoluto('2026-10-19', 540), absoluto('2026-10-19', 600))).toEqual([{ dia: '2026-10-19', ini: 540, fin: 600, tipo: 'unico' }])
    expect(tramos(lun5pm, absoluto('2026-10-21', 60)).map((t) => t.tipo)).toEqual(['inicio', 'medio', 'fin'])
  })

  it('campos: con fecha_fin solo si termina otro día; medianoche cierra el día anterior', () => {
    expect(campos(lun5pm, mar4pm)).toEqual({ fecha: '2026-10-19', hora: '17:00', fecha_fin: '2026-10-20', hora_fin: '16:00' })
    expect(campos(absoluto('2026-10-19', 540), absoluto('2026-10-19', 600))).toEqual({ fecha: '2026-10-19', hora: '09:00', fecha_fin: null, hora_fin: '10:00' })
    expect(campos(absoluto('2026-10-19', 1380), absoluto('2026-10-20', 0))).toEqual({ fecha: '2026-10-19', hora: '23:00', fecha_fin: null, hora_fin: '23:59' })
  })

  it('extremos de una task (sin fin: 30 min)', () => {
    expect(extremos({ fecha: '2026-10-19', hora: '17:00:00', fecha_fin: '2026-10-20', hora_fin: '16:00:00' })).toEqual({ ini: lun5pm, fin: mar4pm })
    expect(extremos({ fecha: '2026-10-19', hora: '17:00', fecha_fin: null, hora_fin: null })).toEqual({ ini: lun5pm, fin: lun5pm + 30 })
  })

  it('días que toca', () => {
    expect(diasDe({ fecha: '2026-10-30', fecha_fin: '2026-11-01' })).toEqual(['2026-10-30', '2026-10-31', '2026-11-01'])
    expect(diasDe({ fecha: '2026-10-30', fecha_fin: null })).toEqual(['2026-10-30'])
  })
})
