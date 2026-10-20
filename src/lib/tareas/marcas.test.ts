import { describe, expect, it } from 'vitest'
import { diferencia, marcar, soltar } from './marcas'

describe('marcas en vivo', () => {
  it('cuenta lo marcado y desmarcado contra lo del servidor', () => {
    const tareas = [
      { id: 'a', hecha: false },
      { id: 'b', hecha: true },
      { id: 'c', hecha: false },
    ]
    expect(diferencia(tareas)).toBe(0)
    marcar('a', true)
    marcar('b', false)
    marcar('c', true)
    expect(diferencia(tareas)).toBe(1)
    // Una marca igual a lo del servidor no cuenta.
    marcar('b', true)
    expect(diferencia(tareas)).toBe(2)
    for (const id of ['a', 'b', 'c']) soltar(id)
    expect(diferencia(tareas)).toBe(0)
  })
})
