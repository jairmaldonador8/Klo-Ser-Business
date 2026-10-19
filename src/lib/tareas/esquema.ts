import { z } from 'zod'

/** Las actividades de siempre (clave en la base → nombre). Cada quien suma las suyas (`perfiles.actividades`),
 *  y una tarea con actividad propia guarda su nombre tal cual en `clase`. */
export const CLASES = ['tarea', 'junta', 'entreno', 'entrega', 'profundo'] as const
export type ClaseBase = (typeof CLASES)[number]
export type Clase = string
export const NOMBRE_CLASE: Record<ClaseBase, string> = { tarea: 'Task', junta: 'Meeting', entreno: 'Workout', entrega: 'Delivery', profundo: 'Deep work' }
export const esClaseBase = (c: string): c is ClaseBase => (CLASES as readonly string[]).includes(c)
/** El nombre que se muestra: el de la base, o el propio tal cual. */
export const nombreClase = (c: string) => (esClaseBase(c) ? NOMBRE_CLASE[c] : c)
export const MAX_ACTIVIDAD = 30
export const MAX_ACTIVIDADES = 20

/** Limpia la lista de actividades propias: sin vacías, sin repetidas y sin chocar con las de siempre. */
export function limpiarActividades(lista: readonly string[]): string[] {
  const vistas = new Set<string>(CLASES.flatMap((c) => [c, NOMBRE_CLASE[c].toLowerCase()]))
  const salida: string[] = []
  for (const crudo of lista) {
    const nombre = crudo.trim().replace(/\s+/g, ' ').slice(0, MAX_ACTIVIDAD)
    if (!nombre || vistas.has(nombre.toLowerCase())) continue
    vistas.add(nombre.toLowerCase())
    salida.push(nombre)
  }
  return salida.slice(0, MAX_ACTIVIDADES)
}

/** Lo que la app usa de una tarea (fila de `tareas` ya filtrada de borradas). */
export type Tarea = {
  id: string
  espacio_id: string
  titulo: string
  clase: Clase
  fecha: string | null
  hora: string | null // 'HH:MM' o 'HH:MM:SS' tal como llega de Postgres
  hora_fin: string | null
  /** Si termina otro día (lunes 5 pm → martes 4 pm); null = el mismo día. */
  fecha_fin: string | null
  /** Si se repite: su serie (cada repetición es una task propia). */
  serie_id: string | null
  proyecto_id: string | null
  completada_en: string | null
}

const vacioANulo = (v: unknown) => (v === '' || v === undefined ? null : v)
const hora = z.preprocess(vacioANulo, z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).nullable())

export const esquemaTarea = z
  .object({
    id: z.preprocess(vacioANulo, z.uuid().nullable()),
    espacio_id: z.uuid({ error: 'Pick a space.' }),
    titulo: z.string().trim().min(1, 'Write what needs to be done.').max(200),
    clase: z.string().trim().min(1, 'Pick an activity.').max(MAX_ACTIVIDAD),
    fecha: z.preprocess(vacioANulo, z.iso.date().nullable()),
    hora,
    hora_fin: hora,
    fecha_fin: z.preprocess(vacioANulo, z.iso.date().nullable()).optional().transform((v) => v ?? null),
    proyecto_id: z.preprocess(vacioANulo, z.uuid().nullable()),
  })
  .refine((t) => !t.hora || t.fecha, { message: 'To set a time, set a date.', path: ['hora'] })
  .refine((t) => !t.fecha_fin || (t.fecha && t.fecha_fin > t.fecha), { message: 'The end date must be after the start date.', path: ['fecha_fin'] })
  .refine((t) => !t.hora_fin || (t.hora && (t.fecha_fin || t.hora_fin > t.hora)), { message: 'The end time must be after the start.', path: ['hora_fin'] })
  .refine((t) => t.clase !== 'junta' || t.hora, { message: 'A meeting needs a time.', path: ['hora'] })

export type DatosTarea = z.infer<typeof esquemaTarea>

/** «09:00:00» → «09:00». */
export const hhmm = (h: string | null) => (h ? h.slice(0, 5) : null)
