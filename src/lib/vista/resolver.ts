import { z } from 'zod'
import { MOSAICOS, SECCIONES } from './registro'

const preferencia = z.object({ id: z.string().max(40), visible: z.boolean() })
export const esquemaVista = z.object({
  secciones: z.array(preferencia).max(40).optional(),
  mosaicos_hoy: z.array(preferencia).max(40).optional(),
})

export type Preferencia = z.infer<typeof preferencia>
export type Vista = z.infer<typeof esquemaVista>

/** Lo guardado en `perfiles.vista`; si no tiene forma, se trata como vacío. */
export function leerVista(json: unknown): Vista {
  const r = esquemaVista.safeParse(json)
  return r.success ? r.data : {}
}

/** Cruza el registro con las preferencias: descarta lo desconocido y lo repetido, agrega al final
 *  lo que falte (visible) y fuerza visible lo obligatorio. */
export function resolverLista<T extends { id: string; obligatorio?: boolean }>(
  registro: readonly T[],
  preferencias: readonly Preferencia[] | undefined,
): (T & { visible: boolean })[] {
  const porId = new Map(registro.map((x) => [x.id, x]))
  const vistos = new Set<string>()
  const lista: (T & { visible: boolean })[] = []
  for (const p of preferencias ?? []) {
    const item = porId.get(p.id)
    if (!item || vistos.has(p.id)) continue
    vistos.add(p.id)
    lista.push({ ...item, visible: p.visible || !!item.obligatorio })
  }
  for (const item of registro) if (!vistos.has(item.id)) lista.push({ ...item, visible: true })
  return lista
}

export function resolverVista(json: unknown) {
  const vista = leerVista(json)
  return {
    secciones: resolverLista(SECCIONES, vista.secciones),
    mosaicos: resolverLista(MOSAICOS, vista.mosaicos_hoy),
  }
}

/** Sube (-1) o baja (+1) un elemento un lugar; en las orillas no hace nada. */
export function mover<T extends { id: string }>(lista: readonly T[], id: string, direccion: -1 | 1): T[] {
  const i = lista.findIndex((x) => x.id === id)
  const j = i + direccion
  if (i < 0 || j < 0 || j >= lista.length) return [...lista]
  const copia = [...lista]
  ;[copia[i], copia[j]] = [copia[j], copia[i]]
  return copia
}
