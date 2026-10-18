import { z } from 'zod'

export const CLASES = ['tarea', 'entrega', 'junta', 'profundo'] as const
export type Clase = (typeof CLASES)[number]
export const NOMBRE_CLASE: Record<Clase, string> = { tarea: 'Tarea', entrega: 'Entrega', junta: 'Junta', profundo: 'Trabajo profundo' }

/** Lo que la app usa de una tarea (fila de `tareas` ya filtrada de borradas). */
export type Tarea = {
  id: string
  espacio_id: string
  titulo: string
  clase: Clase
  fecha: string | null
  hora: string | null // 'HH:MM' o 'HH:MM:SS' tal como llega de Postgres
  hora_fin: string | null
  proyecto_id: string | null
  completada_en: string | null
}

const vacioANulo = (v: unknown) => (v === '' || v === undefined ? null : v)
const hora = z.preprocess(vacioANulo, z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).nullable())

export const esquemaTarea = z
  .object({
    id: z.preprocess(vacioANulo, z.uuid().nullable()),
    espacio_id: z.uuid({ error: 'Elige un frente.' }),
    titulo: z.string().trim().min(1, 'Escribe qué hay que hacer.').max(200),
    clase: z.enum(CLASES),
    fecha: z.preprocess(vacioANulo, z.iso.date().nullable()),
    hora,
    hora_fin: hora,
    proyecto_id: z.preprocess(vacioANulo, z.uuid().nullable()),
  })
  .refine((t) => !t.hora || t.fecha, { message: 'Para ponerle hora, ponle fecha.', path: ['hora'] })
  .refine((t) => !t.hora_fin || (t.hora && t.hora_fin > t.hora), { message: 'La hora de fin va después de la de inicio.', path: ['hora_fin'] })
  .refine((t) => t.clase !== 'junta' || t.hora, { message: 'Una junta necesita hora.', path: ['hora'] })

export type DatosTarea = z.infer<typeof esquemaTarea>

/** «09:00:00» → «09:00». */
export const hhmm = (h: string | null) => (h ? h.slice(0, 5) : null)
