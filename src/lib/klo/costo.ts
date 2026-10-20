import type { Uso } from './conversar'

// Precio de claude-haiku-5-5 en dólares por millón de tokens (prompts de 100K o menos).
// La lectura de caché se estima en 0.1× la entrada; la escritura (5 min) cuesta 1.25×.
const PRECIO = { entrada: 0.1, salida: 0.5, cacheLeidos: 0.01, cacheEscritos: 0.125 }

export type Gasto = Uso & { mensajes: number }

type Fila = { tokens_entrada: number; tokens_salida: number; tokens_cache_leidos: number; tokens_cache_escritos: number }

/** Suma las respuestas de Klo. */
export function sumarUso(filas: Fila[]): Gasto {
  return filas.reduce<Gasto>(
    (g, f) => ({
      mensajes: g.mensajes + 1,
      entrada: g.entrada + f.tokens_entrada,
      salida: g.salida + f.tokens_salida,
      cacheLeidos: g.cacheLeidos + f.tokens_cache_leidos,
      cacheEscritos: g.cacheEscritos + f.tokens_cache_escritos,
    }),
    { mensajes: 0, entrada: 0, salida: 0, cacheLeidos: 0, cacheEscritos: 0 },
  )
}

export const tokensTotales = (u: Uso) => u.entrada + u.salida + u.cacheLeidos + u.cacheEscritos

/** Costo aproximado en dólares. */
export function costoUsd(u: Uso): number {
  return (u.entrada * PRECIO.entrada + u.salida * PRECIO.salida + u.cacheLeidos * PRECIO.cacheLeidos + u.cacheEscritos * PRECIO.cacheEscritos) / 1e6
}

/** «$0.04», o «<$0.01» cuando apenas empieza. */
export function formatoUsd(usd: number): string {
  if (usd === 0) return '$0.00'
  return usd < 0.01 ? '<$0.01' : `$${usd.toFixed(2)}`
}

/** «212K», «1.4M», «850». */
export function formatoTokens(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1e3) return `${Math.round(n / 1e3)}K`
  return String(n)
}
