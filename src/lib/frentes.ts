export type FrenteNuevo = { nombre: string; inicial: string; atajo: string }

export const MAX_FRENTES = 8
const MAX_NOMBRE = 40
const MAX_ATAJO = 12

function sinAcentos(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/** «Top Digital» → «top», «Klo-Ser» → «kloser». Es el `/atajo` de Klo. */
export function atajoDesdeNombre(nombre: string): string {
  const primera = sinAcentos(nombre).trim().split(/\s+/)[0] ?? ''
  const limpio = primera.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, MAX_ATAJO)
  return limpio || 'frente'
}

export function inicialDesdeNombre(nombre: string): string {
  const letra = sinAcentos(nombre).match(/[a-z0-9]/i)?.[0]
  return letra ? letra.toUpperCase() : 'F'
}

export function prepararFrentes(
  nombres: string[],
  ocupados: string[] = [],
): { ok: true; frentes: FrenteNuevo[] } | { ok: false; mensaje: string } {
  const limpios = nombres.map((n) => n.trim().replace(/\s+/g, ' ')).filter(Boolean)
  if (limpios.length === 0) return { ok: false, mensaje: 'Escribe al menos un frente.' }
  if (limpios.length > MAX_FRENTES) return { ok: false, mensaje: `Por ahora caben hasta ${MAX_FRENTES} frentes.` }
  const largo = limpios.find((n) => n.length > MAX_NOMBRE)
  if (largo) return { ok: false, mensaje: `«${largo.slice(0, 20)}…» es muy largo: máximo ${MAX_NOMBRE} letras.` }

  const usados = new Set(ocupados)
  const frentes = limpios.map((nombre) => {
    const base = atajoDesdeNombre(nombre)
    let atajo = base
    for (let n = 2; usados.has(atajo); n++) atajo = `${base.slice(0, MAX_ATAJO - 1)}${n}`
    usados.add(atajo)
    return { nombre, inicial: inicialDesdeNombre(nombre), atajo }
  })
  return { ok: true, frentes }
}
