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
  nombre: z.string().trim().min(1, 'Ponle nombre al proyecto.').max(80, 'El nombre es muy largo: máximo 80 letras.'),
  meta: z.string().trim().max(200, 'La meta es muy larga: máximo 200 letras.').default(''),
  fecha_meta: z.preprocess(vacioANulo, z.iso.date({ error: 'Revisa la fecha meta.' }).nullable()),
  modo_avance: z.enum(['tareas', 'manual']),
  cifra_meta: z.preprocess(
    (v) => aNumero(vacioANulo(v)),
    z.number({ error: 'La cifra meta va en número.' }).positive('La cifra meta va arriba de cero.').max(1e9, 'Esa cifra es demasiado grande.').nullable(),
  ),
}

const cifraSiManual = <T extends { modo_avance: string; cifra_meta: number | null }>(p: T) => p.modo_avance !== 'manual' || p.cifra_meta !== null
const avisoCifra = { message: 'Ponle una cifra meta para medir el avance.', path: ['cifra_meta'] }

const esquemaProyecto = z
  .object({
    espacio_id: z.uuid({ error: 'Elige un frente.' }),
    ...campos,
    cifra_actual: z.preprocess((v) => aNumero(vacioANulo(v) ?? 0), z.number({ error: 'Lo que llevas va en número.' }).min(0, 'Lo que llevas no puede ser negativo.')),
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

const primerAviso = (e: z.ZodError) => e.issues[0]?.message ?? 'Revisa los datos.'

export async function crearProyecto(datos: unknown): Promise<Resultado> {
  const leido = esquemaProyecto.safeParse(datos)
  if (!leido.success) return { ok: false, mensaje: primerAviso(leido.error) }
  // El inicio es hoy en tu zona (la base usaría su propio día).
  const { hoy } = await contextoAhora()
  if (leido.data.fecha_meta && leido.data.fecha_meta < hoy) return { ok: false, mensaje: 'La fecha meta no puede ser antes de hoy.' }
  const supabase = await crearClienteServidor()
  const { data, error } = await supabase
    .from('proyectos')
    .insert({ ...leido.data, fecha_inicio: hoy })
    .select('id')
    .single()
  if (error || !data) {
    console.error('crearProyecto', error)
    return { ok: false, mensaje: 'No pude crear el proyecto, inténtalo otra vez.' }
  }
  return listo(data.id)
}

export async function editarProyecto(proyectoId: string, datos: unknown): Promise<Resultado> {
  const leido = esquemaEdicion.safeParse(datos)
  if (!id.safeParse(proyectoId).success) return { ok: false, mensaje: 'No encontré ese proyecto.' }
  if (!leido.success) return { ok: false, mensaje: primerAviso(leido.error) }
  const supabase = await crearClienteServidor()
  const { error } = await supabase.from('proyectos').update(leido.data).eq('id', proyectoId)
  if (error) {
    // 23514: la fecha meta quedó antes del inicio (la cifra ya la revisó zod).
    if (error.code === '23514') return { ok: false, mensaje: 'La fecha meta va después del inicio del proyecto.' }
    console.error('editarProyecto', error)
    return { ok: false, mensaje: 'No pude guardar los cambios, inténtalo otra vez.' }
  }
  return listo()
}

/** Suma (o resta) a la cifra del proyecto manual; nunca baja de cero. */
export async function sumarCifra(proyectoId: string, delta: number): Promise<Resultado> {
  if (!id.safeParse(proyectoId).success || !Number.isFinite(delta)) return { ok: false, mensaje: 'Revisa los datos.' }
  const supabase = await crearClienteServidor()
  const { data, error: errorLeer } = await supabase.from('proyectos').select('cifra_actual').eq('id', proyectoId).single()
  if (errorLeer || !data) return { ok: false, mensaje: 'No encontré ese proyecto.' }
  const { error } = await supabase
    .from('proyectos')
    .update({ cifra_actual: Math.max(0, Number(data.cifra_actual) + delta) })
    .eq('id', proyectoId)
  if (error) return { ok: false, mensaje: 'No pude sumarlo, inténtalo otra vez.' }
  return listo()
}

/** «Archivar» = cerrado: no se borra, se guarda aparte. */
export async function cambiarEstado(proyectoId: string, estado: string): Promise<Resultado> {
  const leido = ESTADOS.safeParse(estado)
  if (!id.safeParse(proyectoId).success || !leido.success) return { ok: false, mensaje: 'Revisa los datos.' }
  const supabase = await crearClienteServidor()
  const { error } = await supabase.from('proyectos').update({ estado: leido.data }).eq('id', proyectoId)
  if (error) return { ok: false, mensaje: 'No pude cambiarlo, inténtalo otra vez.' }
  return listo()
}
