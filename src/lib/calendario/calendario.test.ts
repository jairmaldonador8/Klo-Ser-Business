import { describe, expect, it } from 'vitest'
import { acomodar, finEfectivo } from './disposicion'
import {
  aMinutos,
  ajustar,
  deMinutos,
  dentro,
  diaSemana,
  diasVista,
  horaCorta,
  inicioSemana,
  pasar,
  rangoCarga,
  rejillaMes,
  sumarMeses,
  tituloVista,
} from './fechas'

describe('fechas del calendario', () => {
  it('la semana empieza en lunes', () => {
    expect(diaSemana('2026-10-19')).toBe(0) // lunes
    expect(diaSemana('2026-10-25')).toBe(6) // domingo
    expect(inicioSemana('2026-10-25')).toBe('2026-10-19')
    expect(inicioSemana('2026-11-01')).toBe('2026-10-26')
  })

  it('la rejilla del mes son semanas completas que cubren el mes', () => {
    const r = rejillaMes('2026-10-19')
    expect(r[0]).toBe('2026-09-28')
    expect(r[r.length - 1]).toBe('2026-11-01')
    expect(r.length % 7).toBe(0)
    expect(r).toHaveLength(35)
  })

  it('días por vista', () => {
    expect(diasVista('dia', '2026-10-21')).toEqual(['2026-10-21'])
    expect(diasVista('3dias', '2026-10-31')).toEqual(['2026-10-31', '2026-11-01', '2026-11-02'])
    expect(diasVista('semana', '2026-10-21')[0]).toBe('2026-10-19')
    expect(diasVista('semana', '2026-10-21')).toHaveLength(7)
  })

  it('pasa de página según la vista', () => {
    expect(pasar('dia', '2026-10-19', 1)).toBe('2026-10-20')
    expect(pasar('3dias', '2026-10-19', -1)).toBe('2026-10-16')
    expect(pasar('semana', '2026-10-19', 1)).toBe('2026-10-26')
    expect(pasar('mes', '2026-01-31', 1)).toBe('2026-02-01')
    expect(sumarMeses('2026-12-15', 1)).toBe('2027-01-01')
  })

  it('el rango cargado cubre cualquier vista del mismo mes', () => {
    const r = rangoCarga('2026-10-19')
    for (const v of ['dia', '3dias', 'semana', 'mes'] as const) {
      for (const f of ['2026-10-01', '2026-10-19', '2026-10-31']) expect(dentro(diasVista(v, f), r)).toBe(true)
    }
    expect(dentro(diasVista('semana', '2026-12-01'), r)).toBe(false)
  })

  it('títulos', () => {
    expect(tituloVista('mes', '2026-10-19')).toBe('October 2026')
    expect(tituloVista('semana', '2026-10-19')).toBe('October 2026')
    expect(tituloVista('semana', '2026-10-28')).toBe('Oct – Nov 2026')
    expect(tituloVista('semana', '2026-12-30')).toBe('Dec 2026 – Jan 2027')
  })

  it('horas y minutos', () => {
    expect(aMinutos('09:30:00')).toBe(570)
    expect(deMinutos(570)).toBe('09:30')
    expect(deMinutos(-10)).toBe('00:00')
    expect(deMinutos(24 * 60 + 5)).toBe('23:59')
    expect(ajustar(68)).toBe(75)
    expect(horaCorta('00:00')).toBe('12 am')
    expect(horaCorta('12:00')).toBe('12 pm')
    expect(horaCorta('17:30')).toBe('5:30 pm')
  })
})

describe('acomodar eventos', () => {
  it('sin choques, cada uno a todo lo ancho', () => {
    const l = acomodar([
      { id: 'a', ini: 540, fin: 600 },
      { id: 'b', ini: 600, fin: 660 },
    ])
    expect(l.get('a')).toEqual({ col: 0, cols: 1 })
    expect(l.get('b')).toEqual({ col: 0, cols: 1 })
  })

  it('los encimados se reparten y comparten el número de columnas', () => {
    const l = acomodar([
      { id: 'a', ini: 540, fin: 660 },
      { id: 'b', ini: 570, fin: 600 },
      { id: 'c', ini: 600, fin: 630 }, // cabe en la columna de b
      { id: 'd', ini: 700, fin: 720 }, // otro grupo
    ])
    expect(l.get('a')).toEqual({ col: 0, cols: 2 })
    expect(l.get('b')).toEqual({ col: 1, cols: 2 })
    expect(l.get('c')).toEqual({ col: 1, cols: 2 })
    expect(l.get('d')).toEqual({ col: 0, cols: 1 })
  })

  it('un evento sin fin ocupa al menos media hora', () => {
    expect(finEfectivo(540, null)).toBe(570)
    expect(finEfectivo(540, 545)).toBe(555)
    expect(finEfectivo(540, 600)).toBe(600)
  })
})
