import { SECCIONES, type IdSeccion } from './vista/registro'

export type Icono = IdSeccion

/** La ruta de la sección donde estoy (para marcarla en el riel), o null fuera de ellas. */
export function seccionActiva(pathname: string): string | null {
  const seccion = SECCIONES.find((s) => pathname === s.ruta || pathname.startsWith(`${s.ruta}/`))
  return seccion?.ruta ?? null
}
