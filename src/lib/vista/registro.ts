/** Lo que la app sabe pintar. Agregar una sección o un mosaico aquí lo hace aparecer para todos
 *  (al final y visible) sin romper la vista guardada de nadie: ver resolver.ts. */

export type IdSeccion = 'hoy' | 'calendario' | 'proyectos' | 'semana' | 'clientes' | 'notas'
export type IdMosaico = 'medidor' | 'klo' | 'frentes' | 'en_riesgo' | 'meta' | 'de_un_toque' | 'tu_dia' | 'proyectos'

export type Seccion = { id: IdSeccion; nombre: string; ruta: string; obligatorio?: boolean }
export type Mosaico = { id: IdMosaico; nombre: string; descripcion: string; obligatorio?: boolean }

export const SECCIONES: readonly Seccion[] = [
  { id: 'hoy', nombre: 'Hoy', ruta: '/hoy', obligatorio: true },
  { id: 'calendario', nombre: 'Calendario', ruta: '/calendario' },
  { id: 'proyectos', nombre: 'Proyectos', ruta: '/proyectos' },
  { id: 'semana', nombre: 'Semana', ruta: '/semana' },
  { id: 'clientes', nombre: 'Clientes', ruta: '/clientes' },
  { id: 'notas', nombre: 'Notas', ruta: '/notas' },
]

export const MOSAICOS: readonly Mosaico[] = [
  { id: 'medidor', nombre: 'Tu día', descripcion: 'Cuántas cosas te tocan hoy y cuál sigue', obligatorio: true },
  { id: 'klo', nombre: 'Klo', descripcion: 'Lo que Klo te dice y la entrada para hablarle' },
  { id: 'frentes', nombre: 'Tus frentes', descripcion: 'Un mosaico de color por frente' },
  { id: 'en_riesgo', nombre: 'En riesgo', descripcion: 'Entregas vencidas o de los próximos 2 días' },
  { id: 'meta', nombre: 'La meta', descripcion: 'Tu proyecto destacado' },
  { id: 'de_un_toque', nombre: 'De un toque', descripcion: 'Pendientes sin hora para palomear' },
  { id: 'tu_dia', nombre: 'Agenda de hoy', descripcion: 'Lo que tiene hora hoy, con «Ahora»' },
  { id: 'proyectos', nombre: 'Proyectos', descripcion: 'Los activos más cerca de su fecha meta' },
]
