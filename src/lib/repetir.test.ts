import { describe, expect, it } from 'vitest'
import { etiquetaRegla, fechasDe, opcionesPara, posicionEnMes } from './repetir'

// 2026-10-24 es sábado (4.º del mes).
const sab = '2026-10-24'

describe('fechasDe', () => {
  it('cada día y cada 3 días', () => {
    expect(fechasDe({ freq: 'dia', cada: 1 }, sab, '2026-10-27')).toEqual(['2026-10-24', '2026-10-25', '2026-10-26', '2026-10-27'])
    expect(fechasDe({ freq: 'dia', cada: 3 }, sab, '2026-11-02')).toEqual(['2026-10-24', '2026-10-27', '2026-10-30', '2026-11-02'])
  })

  it('semanas: un día, varios días, entre semana, cada 2', () => {
    expect(fechasDe({ freq: 'semana', cada: 1, dias: [5] }, sab, '2026-11-14')).toEqual(['2026-10-24', '2026-10-31', '2026-11-07', '2026-11-14'])
    expect(fechasDe({ freq: 'semana', cada: 2, dias: [5] }, sab, '2026-11-21')).toEqual(['2026-10-24', '2026-11-07', '2026-11-21'])
    // Entre semana empezando un miércoles: no incluye lunes ni martes anteriores.
    expect(fechasDe({ freq: 'semana', cada: 1, dias: [0, 1, 2, 3, 4] }, '2026-10-21', '2026-10-27')).toEqual(['2026-10-21', '2026-10-22', '2026-10-23', '2026-10-26', '2026-10-27'])
  })

  it('mes por número de día (salta los meses que no lo tienen) y por posición', () => {
    expect(fechasDe({ freq: 'mes', cada: 1, mes: 'dia' }, '2026-01-31', '2026-05-31')).toEqual(['2026-01-31', '2026-03-31', '2026-05-31'])
    expect(fechasDe({ freq: 'mes', cada: 1, mes: 'posicion' }, sab, '2027-01-31')).toEqual(['2026-10-24', '2026-11-28', '2026-12-26', '2027-01-23'])
    // 31 oct 2026 es el último sábado: sigue siendo «el último sábado».
    expect(posicionEnMes('2026-10-31')).toBe(-1)
    expect(fechasDe({ freq: 'mes', cada: 1, mes: 'posicion' }, '2026-10-31', '2026-12-31')).toEqual(['2026-10-31', '2026-11-28', '2026-12-26'])
  })

  it('año (29 de febrero solo en bisiestos)', () => {
    expect(fechasDe({ freq: 'anio', cada: 1 }, sab, '2028-12-31')).toEqual(['2026-10-24', '2027-10-24', '2028-10-24'])
    expect(fechasDe({ freq: 'anio', cada: 1 }, '2028-02-29', '2033-01-01')).toEqual(['2028-02-29', '2032-02-29'])
  })

  it('termina en una fecha o tras N veces; `desde` cuenta las anteriores sin devolverlas', () => {
    expect(fechasDe({ freq: 'dia', cada: 1 }, sab, '2027-01-01', { hasta: '2026-10-26', conteo: null })).toEqual(['2026-10-24', '2026-10-25', '2026-10-26'])
    expect(fechasDe({ freq: 'dia', cada: 1 }, sab, '2027-01-01', { hasta: null, conteo: 3 })).toEqual(['2026-10-24', '2026-10-25', '2026-10-26'])
    expect(fechasDe({ freq: 'dia', cada: 1 }, sab, '2027-01-01', { hasta: null, conteo: 3 }, '2026-10-26')).toEqual(['2026-10-26'])
  })
})

describe('etiquetas y opciones', () => {
  it('nombra cada regla como Notion', () => {
    expect(opcionesPara(sab).map((o) => o.etiqueta)).toEqual([
      'Every day',
      'Every weekend day',
      'Every week on Sat',
      'Every 2 weeks on Sat',
      'Every month on the 24th',
      'Every month on the 4th Sat',
      'Every year on Oct 24',
    ])
    expect(opcionesPara('2026-10-21')[1].etiqueta).toBe('Every weekday')
    expect(etiquetaRegla({ freq: 'semana', cada: 1, dias: [0, 2, 4] }, '2026-10-19')).toBe('Every week on Mon, Wed, Fri')
    expect(etiquetaRegla({ freq: 'dia', cada: 1 }, sab, { hasta: '2026-11-30', conteo: null })).toBe('Every day · until Nov 30')
    expect(etiquetaRegla({ freq: 'mes', cada: 1, mes: 'posicion' }, '2026-10-31', { hasta: null, conteo: 10 })).toBe('Every month on the last Sat · 10 times')
  })
})
