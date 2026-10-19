import { describe, expect, it } from 'vitest'
import { etiquetaDia, fechaEn, horaMinEn, nombreDia, sumarDias } from './fechas'

const zona = 'America/Monterrey' // UTC-6 en octubre

describe('fechas', () => {
  it('da el día en la zona, no en UTC', () => {
    expect(fechaEn(new Date('2026-10-19T03:00:00Z'), zona)).toBe('2026-10-18')
  })
  it('da la hora HH:MM en la zona', () => {
    expect(horaMinEn(new Date('2026-10-18T15:05:00Z'), zona)).toBe('09:05')
  })
  it('suma días cruzando el fin de mes', () => {
    expect(sumarDias('2026-10-31', 1)).toBe('2026-11-01')
    expect(sumarDias('2026-10-01', -1)).toBe('2026-09-30')
  })
  it('nombra el día relativo a hoy', () => {
    expect(etiquetaDia('2026-10-18', '2026-10-18')).toBe('today')
    expect(etiquetaDia('2026-10-19', '2026-10-18')).toBe('tomorrow')
    expect(etiquetaDia('2026-10-17', '2026-10-18')).toBe('yesterday')
    expect(etiquetaDia('2026-10-20', '2026-10-18')).toBe('in 2 days')
    expect(etiquetaDia('2026-10-14', '2026-10-18')).toBe('4 days ago')
  })
})

describe('nombreDia', () => {
  it('nombra el día para la agenda', () => {
    expect(nombreDia('2026-10-20')).toBe('Tuesday, Oct 20')
    expect(nombreDia('2026-12-31')).toBe('Thursday, Dec 31')
  })
})
