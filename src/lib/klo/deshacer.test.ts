import { describe, expect, it } from 'vitest'
import type { Cliente } from './acciones'
import { aplicarDeshacer } from './deshacer'

/** Cliente falso: anota tabla, operación, datos e id de cada llamada. */
function clienteFalso() {
  const llamadas: string[] = []
  const sb = {
    from: (tabla: string) => ({
      update: (datos: object) => ({ eq: async (_c: string, id: string) => (llamadas.push(`${tabla}.update ${JSON.stringify(datos).replace(/"20\d\d-\d\d-\d\dT[^"]+"/, '"T"')} ${id}`), { error: null }) }),
      delete: () => ({ eq: async (_c: string, id: string) => (llamadas.push(`${tabla}.delete ${id}`), { error: null }) }),
    }),
  }
  return { sb: sb as unknown as Cliente, llamadas }
}

describe('aplicarDeshacer', () => {
  it('revierte en orden inverso cada tipo de cambio', async () => {
    const { sb, llamadas } = clienteFalso()
    const fallas = await aplicarDeshacer(sb, [
      { tipo: 'borrar_tarea', id: 't1' },
      { tipo: 'restaurar_tarea', id: 't2', campos: { fecha: '2026-10-20', hora: '16:00:00' } },
      { tipo: 'borrar_nota', id: 'n1' },
      { tipo: 'borrar_aviso', id: 'a1' },
      { tipo: 'borrar_memoria', id: 'm1' },
    ])
    expect(fallas).toBe(0)
    expect(llamadas).toEqual([
      'klo_memoria.delete m1',
      'avisos.delete a1',
      'notas.update {"borrado_en":"T"} n1',
      'tareas.update {"fecha":"2026-10-20","hora":"16:00:00"} t2',
      'tareas.update {"borrado_en":"T"} t1',
    ])
  })
})
