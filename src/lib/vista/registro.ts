/** Lo que la app sabe pintar. Agregar una sección o un mosaico aquí lo hace aparecer para todos
 *  (al final y visible) sin romper la vista guardada de nadie: ver resolver.ts. */

export type IdSeccion = 'hoy' | 'calendario' | 'proyectos' | 'semana' | 'clientes' | 'notas'
export type IdMosaico = 'medidor' | 'klo' | 'en_riesgo' | 'meta' | 'de_un_toque' | 'tu_dia' | 'proyectos'

export type Seccion = { id: IdSeccion; nombre: string; ruta: string; obligatorio?: boolean }
export type Mosaico = { id: IdMosaico; nombre: string; descripcion: string; obligatorio?: boolean }

export const SECCIONES: readonly Seccion[] = [
  { id: 'hoy', nombre: 'Today', ruta: '/hoy', obligatorio: true },
  { id: 'calendario', nombre: 'Calendar', ruta: '/calendario' },
  { id: 'proyectos', nombre: 'Projects', ruta: '/proyectos' },
  { id: 'semana', nombre: 'Week', ruta: '/semana' },
  { id: 'clientes', nombre: 'Clients', ruta: '/clientes' },
  { id: 'notas', nombre: 'Notes', ruta: '/notas' },
]

export const MOSAICOS: readonly Mosaico[] = [
  { id: 'medidor', nombre: 'Your day', descripcion: 'How much is on your plate today and what’s next', obligatorio: true },
  { id: 'klo', nombre: 'Klo', descripcion: 'What Klo tells you and where to talk to it' },
  { id: 'en_riesgo', nombre: 'At risk', descripcion: 'Deliveries overdue or due in the next 2 days' },
  { id: 'meta', nombre: 'Goal', descripcion: 'Your spotlight project' },
  { id: 'de_un_toque', nombre: 'Quick wins', descripcion: 'Untimed to-dos to check off' },
  { id: 'tu_dia', nombre: 'Today’s agenda', descripcion: 'What has a time today, with “Now”' },
  { id: 'proyectos', nombre: 'Projects', descripcion: 'Active ones closest to their target date' },
]
