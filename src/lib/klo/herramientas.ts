import type Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'

// Las herramientas de Klo: esquema zod (se valida en el servidor) → JSON schema para Claude.

const fecha = z.iso.date().describe('YYYY-MM-DD, in the user’s time zone')
const hora = z.string().regex(/^\d{2}:\d{2}$/).describe('HH:MM, 24h, in the user’s time zone')
const id = z.string().describe('An id exactly as it appears in the context or a buscar result')

export const ESQUEMAS = {
  buscar: z.object({
    texto: z.string().optional().describe('Words in the title'),
    desde: fecha.optional(),
    hasta: fecha.optional(),
    incluir_hechas: z.boolean().optional(),
  }),
  crear_task: z.object({
    titulo: z.string().min(1).max(200),
    espacio_id: id.optional().describe('Space id; omit to use the default space'),
    fecha: fecha.optional(),
    fecha_fin: fecha.optional().describe('Only if it ends on a later day'),
    hora: hora.optional(),
    hora_fin: hora.optional(),
    clase: z.string().optional().describe('Activity: tarea (Task), junta (Meeting, needs a time), entreno (Workout), entrega (Delivery), profundo (Deep work), or a custom activity name'),
    proyecto_id: id.optional(),
    aviso_min: z.number().int().min(0).max(1440).optional().describe('Push alert minutes before; default 10'),
    repetir: z
      .object({
        freq: z.enum(['dia', 'semana', 'mes', 'anio']).describe('dia = daily, semana = weekly, mes = monthly, anio = yearly'),
        cada: z.number().int().min(1).max(99).describe('Every N units: 1 = every week, 2 = every other week'),
        dias: z.array(z.number().int().min(0).max(6)).min(1).max(7).optional().describe('Weekly only: weekdays, 0 = Monday … 6 = Sunday'),
        mes: z.enum(['dia', 'posicion']).optional().describe('Monthly only: dia = same day number (the 24th), posicion = same weekday position (4th Saturday)'),
      })
      .optional()
      .describe('Makes it repeat starting on fecha (fecha is required). Omit for a one-time task.'),
    repetir_hasta: fecha.optional().describe('Last date it can repeat; omit to repeat with no end'),
    repetir_veces: z.number().int().min(1).max(1000).optional().describe('Or: stop after N occurrences'),
  }),
  cambiar_task: z.object({
    id,
    titulo: z.string().min(1).max(200).optional(),
    espacio_id: id.optional(),
    fecha: fecha.nullable().optional().describe('null removes the date'),
    fecha_fin: fecha.nullable().optional(),
    hora: hora.nullable().optional().describe('null removes the time'),
    hora_fin: hora.nullable().optional(),
    clase: z.string().optional(),
    proyecto_id: id.nullable().optional(),
    aviso_min: z.number().int().min(0).max(1440).nullable().optional(),
  }),
  completar_task: z.object({ id, hecha: z.boolean().optional().describe('false to un-check; default true') }),
  borrar_task: z.object({
    id,
    toda_la_serie: z.boolean().optional().describe('Repeating task only: true deletes this and every following pending occurrence, so it stops repeating'),
  }),
  crear_nota: z.object({ texto: z.string().min(1).max(4000), espacio_id: id.optional() }),
  programar_aviso: z.object({
    texto: z.string().min(1).max(200).describe('What the push will say'),
    fecha,
    hora,
    tarea_id: id.optional(),
  }),
  crear_proyecto: z.object({
    nombre: z.string().trim().min(1).max(80),
    espacio_id: id.optional().describe('Space id; omit to use the default space'),
    meta: z.string().trim().max(200).optional().describe('The goal in one sentence'),
    fecha_meta: fecha.optional().describe('Target date, today or later'),
  }),
  cambiar_proyecto: z.object({
    id,
    nombre: z.string().trim().min(1).max(80).optional(),
    meta: z.string().trim().max(200).optional(),
    fecha_meta: fecha.nullable().optional().describe('null removes the target date'),
    estado: z.enum(['activo', 'pausado', 'cerrado']).optional().describe('activo = active, pausado = paused, cerrado = archived'),
  }),
  recordar: z.object({ texto: z.string().min(1).max(300).describe('A short durable fact about the user, their people or how they work') }),
} as const

export type NombreHerramienta = keyof typeof ESQUEMAS
export const esHerramienta = (n: string): n is NombreHerramienta => n in ESQUEMAS

const DESCRIPCIONES: Record<NombreHerramienta, string> = {
  buscar: 'Find tasks (and notes/projects) by title words and/or date range when they are not in the context.',
  crear_task: 'Create a task, meeting or event. With repetir it repeats (every day, every Mon/Wed/Fri, every month on the 4th Sat…).',
  cambiar_task: 'Move or edit a task: send only the fields that change. For a repeating task, changes only this occurrence.',
  completar_task: 'Check a task off (or un-check it).',
  borrar_task: 'Delete a task (or, with toda_la_serie, stop a repeating one from that day on). Always needs the user’s confirmation; the server holds it until they confirm.',
  crear_nota: 'Save a note (an idea or information that is not a task).',
  programar_aviso: 'Schedule a push notification to the user’s phone at a date and time ("remind me…").',
  crear_proyecto: 'Create a project (progress is tracked by its tasks). Use the returned id as proyecto_id to add tasks to it.',
  cambiar_proyecto: 'Rename a project, change its goal or target date, or pause, archive or reactivate it.',
  recordar: 'Remember a durable fact for future conversations (people, preferences, priorities). Do not store one-off tasks.',
}

function aJsonSchema(esquema: z.ZodType): Anthropic.Tool.InputSchema {
  const { $schema: _s, ...resto } = z.toJSONSchema(esquema, { io: 'input' }) as Record<string, unknown>
  void _s
  return resto as Anthropic.Tool.InputSchema
}

export const HERRAMIENTAS: Anthropic.Tool[] = (Object.keys(ESQUEMAS) as NombreHerramienta[]).map((nombre) => ({
  name: nombre,
  description: DESCRIPCIONES[nombre],
  input_schema: aJsonSchema(ESQUEMAS[nombre]),
}))

/** Hasta 3 cambios por mensaje se hacen solos; del 4.º en adelante, y cualquier borrar, esperan tu OK. */
export const MAX_CAMBIOS_SOLOS = 3
export function decidir(nombre: NombreHerramienta, cambiosHechos: number): 'ejecutar' | 'retener' {
  if (nombre === 'buscar') return 'ejecutar'
  if (nombre === 'borrar_task') return 'retener'
  return cambiosHechos < MAX_CAMBIOS_SOLOS ? 'ejecutar' : 'retener'
}
