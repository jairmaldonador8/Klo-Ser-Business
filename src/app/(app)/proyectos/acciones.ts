'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { contextoAhora } from '@/lib/datos'
import { crearClienteServidor } from '@/lib/supabase/servidor'

export type Resultado = { ok: true; id?: string } | { ok: false; mensaje: string }

const vacioANulo = (v: unknown) => (v === '' || v === undefined || v === null ? null : v)
const aNumero = (v: unknown) => (typeof v === 'string' ? Number(v.replace(',', '.')) : v)

// Hitos llegan después: hoy solo «por tareas» y «por cifra».
const campos = {
  nombre: z.string().trim().min(1, 'Give the project a name.').max(80, 'The name is too long: 80 characters max.'),
  meta: z.string().trim().max(200, 'The goal is too long: 200 characters max.').default(''),
  fecha_meta: z.preprocess(vacioANulo, z.iso.date({ error: 'Check the target date.' }).nullable()),
  modo_avance: z.enum(['tareas', 'manual']),
  cifra_meta: z.preprocess(
    (v) => aNumero(vacioANulo(v)),
    z.number({ error: 'The target must be a number.' }).positive('The target must be above zero.').max(1e9, 'That number is too big.').nullable(),
  ),
}

const cifraSiManual = <T extends { modo_avance: string; cifra_meta: number | null }>(p: T) => p.modo_avance !== 'manual' || p.cifra_meta !== null
const avisoCifra = { message: 'Set a target number to track progress.', path: ['cifra_meta'] }

const esquemaProyecto = z
  .object({
    espacio_id: z.uuid({ error: 'Pick a space.' }),
    ...campos,
    cifra_actual: z.preprocess((v) => aNumero(vacioANulo(v) ?? 0), z.number({ error: 'Your current count must be a number.' }).min(0, 'Your current count can’t be negative.')),
  })
  .refine(cifraSiManual, avisoCifra)

// Al editar no se cambia de frente (sus tareas son de ese frente) ni la cifra actual (esa va con +1).
const esquemaEdicion = z.object(campos).refine(cifraSiManual, avisoCifra)

const id = z.uuid()
const ESTADOS = z.enum(['activo', 'pausado', 'cerrado'])

function listo(nuevo?: string): Resultado {
  // El layout también lee los proyectos activos (el selector de la hoja).
  revalidatePath('/', 'layout')
  return { ok: true, id: nuevo }
}

const primerAviso = (e: z.ZodError) => e.issues[0]?.message ?? 'Check the details.'

export async function crearProyecto(datos: unknown): Promise<Resultado> {
  const leido = esquemaProyecto.safeParse(datos)
  if (!leido.success) return { ok: false, mensaje: primerAviso(leido.error) }
  // El inicio es hoy en tu zona (la base usaría su propio día).
  const { hoy } = await contextoAhora()
  if (leido.data.fecha_meta && leido.data.fecha_meta < hoy) return { ok: false, mensaje: 'The target date can’t be before today.' }
  const supabase = await crearClienteServidor()
  const { data, error } = await supabase
    .from('proyectos')
    .insert({ ...leido.data, fecha_inicio: hoy })
    .select('id')
    .single()
  if (error || !data) {
    console.error('crearProyecto', error)
    return { ok: false, mensaje: 'Couldn’t create the project, try again.' }
  }
  return listo(data.id)
}

export async function editarProyecto(proyectoId: string, datos: unknown): Promise<Resultado> {
  const leido = esquemaEdicion.safeParse(datos)
  if (!id.safeParse(proyectoId).success) return { ok: false, mensaje: 'Couldn’t find that project.' }
  if (!leido.success) return { ok: false, mensaje: primerAviso(leido.error) }
  const supabase = await crearClienteServidor()
  const { error } = await supabase.from('proyectos').update(leido.data).eq('id', proyectoId)
  if (error) {
    // 23514: la fecha meta quedó antes del inicio (la cifra ya la revisó zod).
    if (error.code === '23514') return { ok: false, mensaje: 'The target date must be after the project start.' }
    console.error('editarProyecto', error)
    return { ok: false, mensaje: 'Couldn’t save the changes, try again.' }
  }
  return listo()
}

/** Suma (o resta) a la cifra del proyecto manual; nunca baja de cero. */
export async function sumarCifra(proyectoId: string, delta: number): Promise<Resultado> {
  if (!id.safeParse(proyectoId).success || !Number.isFinite(delta)) return { ok: false, mensaje: 'Check the details.' }
  const supabase = await crearClienteServidor()
  // Suma en la base, en una sola orden: varios toques rápidos no se pisan.
  const { error } = await supabase.rpc('sumar_cifra', { p_id: proyectoId, p_delta: delta })
  if (error) return { ok: false, mensaje: 'Couldn’t add it, try again.' }
  return listo()
}

/** «Archivar» = cerrado: no se borra, se guarda aparte. */
export async function cambiarEstado(proyectoId: string, estado: string): Promise<Resultado> {
  const leido = ESTADOS.safeParse(estado)
  if (!id.safeParse(proyectoId).success || !leido.success) return { ok: false, mensaje: 'Check the details.' }
  const supabase = await crearClienteServidor()
  const { error } = await supabase.from('proyectos').update({ estado: leido.data }).eq('id', proyectoId)
  if (error) return { ok: false, mensaje: 'Couldn’t change it, try again.' }
  return listo()
}
