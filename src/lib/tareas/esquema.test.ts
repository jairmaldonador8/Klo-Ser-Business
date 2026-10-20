import { describe, expect, it } from 'vitest'
import { esquemaTarea, hhmm, limpiarActividades, nombreClase } from './esquema'

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
    expect(mensaje(esquemaTarea.safeParse({ ...base(), titulo: '   ' }))).toBe('Write what needs to be done.')
  })
  it('rechaza hora sin fecha', () => {
    expect(mensaje(esquemaTarea.safeParse({ ...base(), hora: '09:00' }))).toBe('To set a time, set a date.')
  })
  it('rechaza hora_fin igual o anterior a hora', () => {
    const b = { ...base(), fecha: '2026-10-18', hora: '10:00' }
    expect(mensaje(esquemaTarea.safeParse({ ...b, hora_fin: '10:00' }))).toBe('The end time must be after the start.')
    expect(mensaje(esquemaTarea.safeParse({ ...b, hora_fin: '09:00' }))).toBe('The end time must be after the start.')
    expect(esquemaTarea.safeParse({ ...b, hora_fin: '11:00' }).success).toBe(true)
  })
  it('rechaza una junta sin hora', () => {
    expect(mensaje(esquemaTarea.safeParse({ ...base(), clase: 'junta', fecha: '2026-10-18' }))).toBe('A meeting needs a time.')
  })
})

describe('hhmm', () => {
  it('recorta los segundos', () => {
    expect(hhmm('09:00:00')).toBe('09:00')
    expect(hhmm(null)).toBeNull()
  })
})

describe('actividades', () => {
  it('las de siempre se nombran en inglés; las propias, tal cual', () => {
    expect(nombreClase('entreno')).toBe('Workout')
    expect(nombreClase('profundo')).toBe('Deep work')
    expect(nombreClase('Amozurrutia')).toBe('Amozurrutia')
  })
  it('acepta una actividad propia en la tarea', () => {
    expect(esquemaTarea.safeParse({ ...base(), clase: 'Amozurrutia' }).success).toBe(true)
    expect(esquemaTarea.safeParse({ ...base(), clase: ' ' }).success).toBe(false)
  })
  it('limpia la lista: sin vacías, repetidas ni choques con las de siempre', () => {
    expect(limpiarActividades(['  Amozurrutia ', 'amozurrutia', '', 'Meeting', 'junta', 'Pádel  semanal'])).toEqual(['Amozurrutia', 'Pádel semanal'])
  })
})

describe('aviso_min', () => {
  const base = { id: '', espacio_id: '6f9619ff-8b86-4011-b42d-00c04fc964ff', titulo: 'Junta', clase: 'tarea', fecha: '2026-10-20', hora: '16:00', hora_fin: '', proyecto_id: '' }
  it('es opcional: sin el campo no se manda', () => {
    expect('aviso_min' in esquemaTarea.parse(base)).toBe(false)
  })
  it('acepta minutos y null (sin aviso)', () => {
    expect(esquemaTarea.parse({ ...base, aviso_min: '30' }).aviso_min).toBe(30)
    expect(esquemaTarea.parse({ ...base, aviso_min: null }).aviso_min).toBeNull()
  })
  it('no pasa de un día', () => {
    expect(esquemaTarea.safeParse({ ...base, aviso_min: 2000 }).success).toBe(false)
  })
})
