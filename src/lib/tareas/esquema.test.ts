import { describe, expect, it } from 'vitest'
import { esquemaTarea, hhmm } from './esquema'

const base = () => ({
  id: '',
  espacio_id: crypto.randomUUID(),
  titulo: 'Mandar cotización',
  clase: 'tarea',
  fecha: '',
  hora: '',
  hora_fin: '',
  proyecto_id: '',
})

const mensaje = (r: ReturnType<typeof esquemaTarea.safeParse>) => (r.success ? null : r.error.issues[0].message)

describe('esquemaTarea', () => {
  it('acepta la tarea mínima y vuelve nulos los vacíos', () => {
    const r = esquemaTarea.safeParse(base())
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.id).toBeNull()
      expect(r.data.fecha).toBeNull()
      expect(r.data.hora).toBeNull()
      expect(r.data.hora_fin).toBeNull()
      expect(r.data.proyecto_id).toBeNull()
    }
  })
  it('rechaza el título vacío', () => {
    expect(mensaje(esquemaTarea.safeParse({ ...base(), titulo: '   ' }))).toBe('Escribe qué hay que hacer.')
  })
  it('rechaza hora sin fecha', () => {
    expect(mensaje(esquemaTarea.safeParse({ ...base(), hora: '09:00' }))).toBe('Para ponerle hora, ponle fecha.')
  })
  it('rechaza hora_fin igual o anterior a hora', () => {
    const b = { ...base(), fecha: '2026-10-18', hora: '10:00' }
    expect(mensaje(esquemaTarea.safeParse({ ...b, hora_fin: '10:00' }))).toBe('La hora de fin va después de la de inicio.')
    expect(mensaje(esquemaTarea.safeParse({ ...b, hora_fin: '09:00' }))).toBe('La hora de fin va después de la de inicio.')
    expect(esquemaTarea.safeParse({ ...b, hora_fin: '11:00' }).success).toBe(true)
  })
  it('rechaza una junta sin hora', () => {
    expect(mensaje(esquemaTarea.safeParse({ ...base(), clase: 'junta', fecha: '2026-10-18' }))).toBe('Una junta necesita hora.')
  })
})

describe('hhmm', () => {
  it('recorta los segundos', () => {
    expect(hhmm('09:00:00')).toBe('09:00')
    expect(hhmm(null)).toBeNull()
  })
})
