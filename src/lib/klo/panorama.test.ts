import { describe, expect, it } from 'vitest'
import type { Tarea } from '@/lib/tareas/esquema'
import { armarPanorama, type DatosPanorama } from './panorama'

const t = (id: string, extra: Partial<Tarea>): Tarea => ({
  id, espacio_id: 'e1', titulo: `T ${id}`, clase: 'tarea', fecha: null, hora: null, hora_fin: null, fecha_fin: null,
  serie_id: null, color: null, proyecto_id: null, completada_en: null, ...extra,
})

const datos = (tareas: Tarea[]): DatosPanorama => ({
  ahora: new Date('2026-10-20T15:40:00Z'),
  zona: 'America/Monterrey',
  nombre: 'Jair',
  espacios: [{ id: 'e1', nombre: 'Klo-Ser', atajo: 'kloser' }, { id: 'e2', nombre: 'Top Digital', atajo: 'top' }],
  predeterminado: 'e1',
  proyectos: [{ id: 'p1', nombre: 'Lanzamiento', espacio_id: 'e2', fecha_meta: '2026-11-15' }],
  actividades: ['Amozurrutia'],
  tareas,
})

describe('armarPanorama', () => {
  it('dice la hora local, los spaces y proyectos con sus ids', () => {
    const p = armarPanorama(datos([]))
    expect(p).toContain('Now: Tue, Oct 20, 2026, 09:40 (America/Monterrey)')
    expect(p).toContain('[e1] Klo-Ser /kloser (default)')
    expect(p).toContain('[p1] Lanzamiento · Top Digital · goal 2026-11-15')
    expect(p).toContain('Amozurrutia')
  })

  it('marca vencidas, ordena y deja fuera hechas y lejanas', () => {
    const p = armarPanorama(datos([
      t('a', { fecha: '2026-10-22', hora: '16:00:00', hora_fin: '17:00:00', clase: 'junta' }),
      t('b', { fecha: '2026-10-18' }),
      t('c', {}),
      t('d', { fecha: '2026-10-21', completada_en: '2026-10-20T10:00:00Z' }),
      t('e', { fecha: '2026-12-30' }),
    ]))
    const lineas = p.split('\n').filter((l) => l.startsWith('- ['))
    const ids = lineas.map((l) => l.slice(3, 4))
    expect(ids).toEqual(['b', 'a', 'c'])
    expect(lineas[0]).toContain('OVERDUE')
    expect(lineas[1]).toContain('Thu Oct 22 16:00–17:00 · Meeting')
  })

  it('lista las notas marcadas como «Maybe task», cortas y con su id', () => {
    const p = armarPanorama({ ...datos([]), notasPosibles: [{ id: 'n1', espacio_id: 'e2', texto: 'Podcast con clientes\nidea larga' }] })
    expect(p).toContain('Notes flagged as maybe tasks')
    expect(p).toContain('- note [n1] Podcast con clientes idea larga · Top Digital')
    expect(armarPanorama(datos([]))).not.toContain('flagged')
  })

  it('tiene tope de 80 tasks', () => {
    const muchas = Array.from({ length: 100 }, (_, i) => t(`x${i}`, { fecha: '2026-10-21' }))
    expect(armarPanorama(datos(muchas)).split('\n').filter((l) => l.startsWith('- [')).length).toBe(80)
  })
})
