import { describe, expect, it } from 'vitest'
import type { Tarea } from '@/lib/tareas/esquema'
import { agruparPendientes, DIAS } from './agrupar'

const hoy = '2026-10-18'
let n = 0
const t = (p: Partial<Tarea>): Tarea => ({
  id: String(++n), espacio_id: 'a', titulo: `t${n}`, clase: 'tarea', fecha: hoy, hora: null, hora_fin: null,
  proyecto_id: null, completada_en: null, ...p,
})

describe('agruparPendientes', () => {
  it('sin tareas: solo los 7 días, libres, con hoy y mañana marcados', () => {
    const g = agruparPendientes([], hoy)
    expect(g).toHaveLength(DIAS)
    expect(g.map((x) => x.clave)).toEqual(['2026-10-18', '2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24'])
    expect(g[0].marca).toBe('hoy')
    expect(g[1].marca).toBe('mañana')
    expect(g[2].marca).toBeUndefined()
    expect(g.every((x) => x.tareas.length === 0)).toBe(true)
  })

  it('pone cada pendiente en su lugar y deja fuera las hechas', () => {
    const vencida = t({ fecha: '2026-10-15' })
    const tarde = t({ hora: '17:00' })
    const temprano = t({ hora: '09:00:00' })
    const sinHora = t({})
    const lejos = t({ fecha: '2026-11-02' })
    const sinFecha = t({ fecha: null })
    const hecha = t({ completada_en: '2026-10-18T10:00:00Z' })
    const g = agruparPendientes([tarde, lejos, vencida, sinHora, sinFecha, temprano, hecha], hoy)
    const de = (clave: string) => g.find((x) => x.clave === clave)!.tareas

    expect(g[0].clave).toBe('vencidas')
    expect(de('vencidas')).toEqual([vencida])
    // Con hora primero, en orden; las sin hora al final.
    expect(de(hoy)).toEqual([temprano, tarde, sinHora])
    expect(de('despues')).toEqual([lejos])
    expect(de('sin-fecha')).toEqual([sinFecha])
    expect(g.flatMap((x) => x.tareas)).not.toContain(hecha)
  })

  it('el último día de la semana entra a la semana; el siguiente, a «Más adelante»', () => {
    const g = agruparPendientes([t({ fecha: '2026-10-24' }), t({ fecha: '2026-10-25' })], hoy)
    expect(g.find((x) => x.clave === '2026-10-24')!.tareas).toHaveLength(1)
    expect(g.find((x) => x.clave === 'despues')!.tareas).toHaveLength(1)
  })
})
