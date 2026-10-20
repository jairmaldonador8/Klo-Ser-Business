import { describe, expect, it } from 'vitest'
import { decidir, ESQUEMAS, HERRAMIENTAS } from './herramientas'

describe('decidir', () => {
  it('hace 3 cambios solos y retiene el 4.º', () => {
    expect([0, 1, 2, 3].map((n) => decidir('crear_task', n))).toEqual(['ejecutar', 'ejecutar', 'ejecutar', 'retener'])
  })
  it('borrar siempre espera confirmación; buscar nunca', () => {
    expect(decidir('borrar_task', 0)).toBe('retener')
    expect(decidir('buscar', 99)).toBe('ejecutar')
  })
})

describe('esquemas', () => {
  it('valida fechas y horas', () => {
    expect(ESQUEMAS.crear_task.safeParse({ titulo: 'Junta', fecha: '2026-10-22', hora: '16:00' }).success).toBe(true)
    expect(ESQUEMAS.crear_task.safeParse({ titulo: 'Junta', fecha: 'jueves' }).success).toBe(false)
    expect(ESQUEMAS.cambiar_task.safeParse({ id: 'x', hora: null }).success).toBe(true)
  })
  it('valida la repetición y los proyectos', () => {
    const gym = { titulo: 'Gym', fecha: '2026-10-21', hora: '07:00', repetir: { freq: 'semana', cada: 1, dias: [0, 2, 4] } }
    expect(ESQUEMAS.crear_task.safeParse(gym).success).toBe(true)
    expect(ESQUEMAS.crear_task.safeParse({ ...gym, repetir: { freq: 'diario', cada: 1 } }).success).toBe(false)
    expect(ESQUEMAS.crear_proyecto.safeParse({ nombre: 'Lanzar Klo-Ser' }).success).toBe(true)
    expect(ESQUEMAS.cambiar_proyecto.safeParse({ id: 'p', estado: 'borrado' }).success).toBe(false)
  })
  it('manda JSON schema limpio a Claude', () => {
    const crear = HERRAMIENTAS.find((h) => h.name === 'crear_task')!
    expect(crear.input_schema.type).toBe('object')
    expect(crear.input_schema).not.toHaveProperty('$schema')
    expect((crear.input_schema as { required?: string[] }).required).toEqual(['titulo'])
  })
})
