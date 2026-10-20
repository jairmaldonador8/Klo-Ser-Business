import { useEffect, useSyncExternalStore } from 'react'

// Marcas en vivo: al palomear una task, todos sus renglones (agenda, Tasks, At risk…) y los contadores
// cambian al momento, sin esperar al servidor. Cuando el servidor ya trae ese mismo estado, la marca se suelta.

const marcas = new Map<string, boolean>()
const oyentes = new Set<() => void>()
let version = 0

function avisar() {
  version++
  oyentes.forEach((o) => o())
}
function suscribir(o: () => void) {
  oyentes.add(o)
  return () => oyentes.delete(o)
}
const leerVersion = () => version

/** Marca (o desmarca) la task en todos lados ya. */
export function marcar(id: string, hecha: boolean) {
  marcas.set(id, hecha)
  avisar()
}

/** Quita la marca local: manda otra vez lo que diga el servidor (también si falló). */
export function soltar(id: string) {
  if (marcas.delete(id)) avisar()
}

/** ¿Está hecha? La marca local si hay; si no, lo del servidor. */
export function useHecha(id: string, servidor: boolean): boolean {
  useSyncExternalStore(suscribir, leerVersion, leerVersion)
  const local = marcas.get(id)
  // El servidor ya se puso al día: la marca sobra.
  useEffect(() => {
    if (local !== undefined && local === servidor) soltar(id)
  }, [id, local, servidor])
  return local ?? servidor
}

/** Cuántas cambiaron respecto a lo que trajo el servidor (+1 por cada marcada, −1 por cada desmarcada). */
export function diferencia(tareas: readonly { id: string; hecha: boolean }[]): number {
  let d = 0
  for (const t of tareas) {
    const local = marcas.get(t.id)
    if (local !== undefined && local !== t.hecha) d += local ? 1 : -1
  }
  return d
}

/** `diferencia` que se recalcula con cada marca. */
export function useDiferencia(tareas: readonly { id: string; hecha: boolean }[]): number {
  useSyncExternalStore(suscribir, leerVersion, leerVersion)
  return diferencia(tareas)
}
