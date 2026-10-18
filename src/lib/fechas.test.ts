import { describe, expect, it } from 'vitest'
import { etiquetaDia, fechaEn, horaMinEn, sumarDias } from './fechas'

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
    expect(etiquetaDia('2026-10-18', '2026-10-18')).toBe('hoy')
    expect(etiquetaDia('2026-10-19', '2026-10-18')).toBe('mañana')
    expect(etiquetaDia('2026-10-17', '2026-10-18')).toBe('ayer')
    expect(etiquetaDia('2026-10-20', '2026-10-18')).toBe('en 2 días')
    expect(etiquetaDia('2026-10-14', '2026-10-18')).toBe('hace 4 días')
  })
})
