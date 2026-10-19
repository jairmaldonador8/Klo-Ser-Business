import { describe, expect, it } from 'vitest'
import { fechaLarga, horaEn, saludoPorHora } from './saludo'

describe('saludoPorHora', () => {
  it('mañana, tarde y noche', () => {
    expect(saludoPorHora(8)).toBe('Good morning')
    expect(saludoPorHora(12)).toBe('Good afternoon')
    expect(saludoPorHora(19)).toBe('Good evening')
  })
  it('agrega el nombre si lo hay', () => {
    expect(saludoPorHora(8, 'Ana')).toBe('Good morning, Ana')
    expect(saludoPorHora(8, '  ')).toBe('Good morning')
  })
})

describe('zona horaria', () => {
  const instante = new Date('2026-10-12T15:30:00Z') // 9:30 en Monterrey
  it('horaEn usa la zona del usuario', () => {
    expect(horaEn(instante, 'America/Monterrey')).toBe(9)
  })
  it('fechaLarga en inglés: «Monday, October 12»', () => {
    expect(fechaLarga(instante, 'America/Monterrey')).toBe('Monday, October 12')
  })
  it('una zona inválida cae a Monterrey en vez de romper', () => {
    expect(horaEn(instante, 'Marte/Olympus')).toBe(9)
  })
  it('el día cambia según la zona', () => {
    const tarde = new Date('2026-10-13T04:00:00Z') // 23:00 del 12 en Monterrey
    expect(fechaLarga(tarde, 'America/Monterrey')).toBe('Monday, October 12')
  })
})
