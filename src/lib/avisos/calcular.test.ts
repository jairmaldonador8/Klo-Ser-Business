import { describe, expect, it } from 'vitest'
import { textoAviso, textoResumen, tocaAviso, tocaResumen, type TareaAviso } from './calcular'

const zona = 'America/Monterrey' // UTC-6 en octubre
const junta: TareaAviso = { id: 't', titulo: 'Ana call', fecha: '2026-10-20', hora: '16:00:00', aviso_min: 10, zona }
const a = (hhmm: string) => new Date(`2026-10-20T${hhmm}:00-06:00`)

describe('tocaAviso', () => {
  it('avisa desde 10 min antes hasta 5 min después del inicio', () => {
    expect(tocaAviso(junta, a('15:49'))).toBe(false)
    expect(tocaAviso(junta, a('15:50'))).toBe(true)
    expect(tocaAviso(junta, a('16:04'))).toBe(true)
    expect(tocaAviso(junta, a('16:06'))).toBe(false)
  })
  it('con 0 avisa al inicio', () => {
    expect(tocaAviso({ ...junta, aviso_min: 0 }, a('15:59'))).toBe(false)
    expect(tocaAviso({ ...junta, aviso_min: 0 }, a('16:00'))).toBe(true)
  })
})

describe('textoAviso', () => {
  it('dice cuánto falta y la hora', () => {
    expect(textoAviso(junta, a('15:50'))).toBe('In 10 min · 4:00 PM')
    expect(textoAviso(junta, a('16:01'))).toBe('Now · 4:00 PM')
  })
})

describe('tocaResumen', () => {
  const p = { resumen_hora: '08:00:00', resumen_enviado: null, zona }
  it('toca desde la hora del resumen, una vez al día', () => {
    expect(tocaResumen(p, a('07:59'))).toBeNull()
    expect(tocaResumen(p, a('08:00'))).toBe('2026-10-20')
    expect(tocaResumen({ ...p, resumen_enviado: '2026-10-20' }, a('09:00'))).toBeNull()
  })
  it('no manda resumen viejo si ya pasó mucho (después de mediodía)', () => {
    expect(tocaResumen(p, a('12:30'))).toBeNull()
  })
  it('apagado no manda', () => {
    expect(tocaResumen({ ...p, resumen_hora: null }, a('08:00'))).toBeNull()
  })
})

describe('textoResumen', () => {
  it('cuenta y dice la primera', () => {
    expect(textoResumen([{ titulo: 'Gym', hora: '07:00:00' }, { titulo: 'Ana call', hora: '16:00:00' }, { titulo: 'Copy', hora: null }], '06:30')).toBe(
      '3 today · first at 7:00 AM: Gym',
    )
    expect(textoResumen([{ titulo: 'Copy', hora: null }], '08:00')).toBe('1 today: Copy')
    expect(textoResumen([], '08:00')).toBe('Nothing scheduled today. Plan it with Klo.')
  })
  it('la primera es la siguiente que no ha pasado', () => {
    expect(textoResumen([{ titulo: 'Gym', hora: '07:00:00' }, { titulo: 'Ana call', hora: '16:00:00' }], '08:00')).toBe('2 today · next at 4:00 PM: Ana call')
  })
})
