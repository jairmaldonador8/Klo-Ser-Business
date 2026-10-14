const PUBLICAS = ['/entrar', '/auth/', '/~offline']

export function esRutaPublica(pathname: string): boolean {
  return PUBLICAS.some((ruta) => (ruta.endsWith('/') ? pathname.startsWith(ruta) : pathname === ruta))
}

/** Solo rutas internas: evita redirigir a otro dominio tras entrar. */
export function destinoSeguro(destino: string | null): string {
  if (!destino || !destino.startsWith('/') || destino.startsWith('//') || destino.startsWith('/\\')) return '/hoy'
  return destino
}

/** Conserva el frente abierto (`?frente=`) al navegar entre vistas. */
export function conFrente(ruta: string, atajo: string | null | undefined): string {
  if (!atajo) return ruta
  return `${ruta}${ruta.includes('?') ? '&' : '?'}frente=${encodeURIComponent(atajo)}`
}
