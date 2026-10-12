export type Icono = 'hoy' | 'proyectos' | 'semana' | 'clientes' | 'notas'

export type Seccion = { ruta: string; nombre: string; icono: Icono }

export const SECCIONES: readonly Seccion[] = [
  { ruta: '/hoy', nombre: 'Hoy', icono: 'hoy' },
  { ruta: '/proyectos', nombre: 'Proyectos', icono: 'proyectos' },
  { ruta: '/semana', nombre: 'Semana', icono: 'semana' },
  { ruta: '/clientes', nombre: 'Clientes', icono: 'clientes' },
  { ruta: '/notas', nombre: 'Notas', icono: 'notas' },
]

const RUTAS_TELEFONO = ['/hoy', '/semana', '/proyectos', '/clientes']

/** En el teléfono, Notas se abre desde Hoy y desde el +. */
export const SECCIONES_TELEFONO: readonly Seccion[] = RUTAS_TELEFONO.map(
  (ruta) => SECCIONES.find((s) => s.ruta === ruta)!,
)

export function seccionActiva(pathname: string): string | null {
  const seccion = SECCIONES.find((s) => pathname === s.ruta || pathname.startsWith(`${s.ruta}/`))
  return seccion?.ruta ?? null
}
