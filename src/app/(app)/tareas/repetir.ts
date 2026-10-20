'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { Resultado } from '@/app/(app)/tareas/acciones'
import { contextoAhora } from '@/lib/datos'
import { sumarDias } from '@/lib/fechas'
import { EXTENDER_SI_FALTAN, esquemaFin, esquemaRegla, fechasDe, HORIZONTE, type Fin, type Regla } from '@/lib/repetir'
import { crearClienteServidor } from '@/lib/supabase/servidor'
import { esquemaTarea } from '@/lib/tareas/esquema'
import { CAMPOS_PLANTILLA, copias, nacerSerie, type Plantilla } from '@/lib/tareas/series'

// Series: cada repetición es una task real con `serie_id`. La serie guarda la regla y hasta dónde se generó.
// La plantilla de las repeticiones nuevas es la última task de la serie (así «this and following» se hereda).

type Supabase = Awaited<ReturnType<typeof crearClienteServidor>>

const id = z.uuid()
const listo = (): Resultado => {
  revalidatePath('/', 'layout')
  return { ok: true }
}

/** Nueva task que se repite: la serie y todas sus repeticiones hasta el horizonte (todo o nada). */
export async function crearRepetida(datos: unknown, reglaCruda: unknown, finCrudo: unknown): Promise<Resultado> {
  const leida = esquemaTarea.safeParse({ ...(datos as object), id: '' })
  const regla = esquemaRegla.safeParse(reglaCruda)
  const fin = esquemaFin.safeParse(finCrudo ?? {})
  if (!leida.success) return { ok: false, mensaje: leida.error.issues[0]?.message ?? 'Check the details.' }
  if (!regla.success || !fin.success) return { ok: false, mensaje: 'Check the repeat options.' }
  if (!leida.data.fecha) return { ok: false, mensaje: 'To repeat it, give it a date.' }
  const [supabase, { hoy }] = await Promise.all([crearClienteServidor(), contextoAhora()])
  const { data: sesion } = await supabase.auth.getClaims()
  const { id: _sinId, ...campos } = leida.data
  void _sinId
  const plantilla: Plantilla = { ...campos, responsable_id: sesion!.claims.sub }
  const { error, serieId, fechas } = await nacerSerie(supabase, plantilla, regla.data, fin.data, hoy)
  if (error || !serieId) {
    console.error('crearRepetida: serie', error)
    return { ok: false, mensaje: 'Couldn’t create the repeating task, try again.' }
  }
  const { error: e2 } = await supabase.from('tareas').insert(copias(plantilla, fechas, serieId))
  if (e2) {
    console.error('crearRepetida: tareas', e2)
    await supabase.from('series').update({ borrado_en: new Date().toISOString() }).eq('id', serieId)
    return { ok: false, mensaje: 'Couldn’t create the repeating task, try again.' }
  }
  return listo()
}

/** La regla de una serie, para mostrarla en la hoja. */
export async function leerSerie(serieId: string): Promise<{ regla: Regla; fin: Fin; inicio: string } | null> {
  if (!id.safeParse(serieId).success) return null
  const supabase = await crearClienteServidor()
  const { data } = await supabase.from('series').select('regla, inicio, hasta, conteo').eq('id', serieId).single()
  const regla = esquemaRegla.safeParse(data?.regla)
  if (!data || !regla.success) return null
  return { regla: regla.data, fin: { hasta: data.hasta, conteo: data.conteo }, inicio: data.inicio }
}

/**
 * Mantiene las series vivas: si a alguna le quedan menos de 90 días generados, genera hasta 180 días adelante
 * copiando su última task. Se llama al cargar Today y Calendar; no revalida (corre durante el render).
 */
export async function extenderSeries(): Promise<void> {
  const [supabase, { hoy }] = await Promise.all([crearClienteServidor(), contextoAhora()])
  const limite = sumarDias(hoy, EXTENDER_SI_FALTAN)
  const { data: series } = await supabase.from('series').select('id, regla, inicio, hasta, conteo, generado_hasta').is('borrado_en', null).lt('generado_hasta', limite)
  for (const s of series ?? []) {
    if (s.hasta && s.generado_hasta >= s.hasta) continue
    const regla = esquemaRegla.safeParse(s.regla)
    if (!regla.success) continue
    const tope = sumarDias(hoy, HORIZONTE)
    const { data: ultima } = await supabase.from('tareas').select(CAMPOS_PLANTILLA).eq('serie_id', s.id).is('borrado_en', null).order('fecha', { ascending: false }).limit(1).maybeSingle()
    const nuevas = ultima ? fechasDe(regla.data, s.inicio, tope, { hasta: s.hasta, conteo: s.conteo }, sumarDias(s.generado_hasta, 1)) : []
    if (nuevas.length) {
      const { error } = await supabase.from('tareas').insert(copias(ultima as Plantilla, nuevas, s.id))
      if (error) {
        console.error('extenderSeries', error)
        continue
      }
    }
    await supabase.from('series').update({ generado_hasta: s.hasta && s.hasta < tope ? s.hasta : tope }).eq('id', s.id)
  }
}

/** La task y su serie (para editar o borrar «this and following»). */
async function tareaYSerie(supabase: Supabase, tareaId: string) {
  const { data: t } = await supabase.from('tareas').select(`id, serie_id, ${CAMPOS_PLANTILLA}`).eq('id', tareaId).single()
  if (!t) return null
  const { data: s } = t.serie_id ? await supabase.from('series').select('id, inicio').eq('id', t.serie_id).single() : { data: null }
  return { t, s }
}

/** Corta la serie justo antes de `fecha`: las repeticiones pendientes desde ahí se borran (suave). */
async function cortarDesde(supabase: Supabase, serie: { id: string; inicio: string }, fecha: string, incluyeLaFecha: boolean) {
  const borrar = supabase.from('tareas').update({ borrado_en: new Date().toISOString() }).eq('serie_id', serie.id).is('borrado_en', null).is('completada_en', null)
  const { error } = await (incluyeLaFecha ? borrar.gte('fecha', fecha) : borrar.gt('fecha', fecha))
  if (error) return error
  const ultimoDia = incluyeLaFecha ? sumarDias(fecha, -1) : fecha
  const cambios = ultimoDia < serie.inicio ? { borrado_en: new Date().toISOString() } : { hasta: ultimoDia, generado_hasta: ultimoDia }
  const { error: e2 } = await supabase.from('series').update(cambios).eq('id', serie.id)
  return e2
}

/**
 * Editar una task que se repite (o volverla repetible), aplicando a esta y las siguientes.
 * `regla` null = deja de repetirse desde aquí. Esta task se guarda con `datos` y es la plantilla de las siguientes.
 */
export async function cambiarDesdeAqui(tareaId: string, datos: unknown, reglaCruda: unknown, finCrudo: unknown): Promise<Resultado> {
  if (!id.safeParse(tareaId).success) return { ok: false, mensaje: 'Check the details.' }
  const leida = esquemaTarea.safeParse({ ...(datos as object), id: tareaId })
  if (!leida.success) return { ok: false, mensaje: leida.error.issues[0]?.message ?? 'Check the details.' }
  const regla = reglaCruda === null ? null : esquemaRegla.safeParse(reglaCruda)
  const fin = esquemaFin.safeParse(finCrudo ?? {})
  if ((regla && !regla.success) || !fin.success) return { ok: false, mensaje: 'Check the repeat options.' }
  const [supabase, { hoy }] = await Promise.all([crearClienteServidor(), contextoAhora()])
  const actual = await tareaYSerie(supabase, tareaId)
  if (!actual) return { ok: false, mensaje: 'Couldn’t find that task.' }

  // Las que ya palomeaste después de esta se respetan: no se vuelven a crear y pasan a la serie nueva.
  const { data: hechas } = actual.s
    ? await supabase.from('tareas').select('id, fecha').eq('serie_id', actual.s.id).is('borrado_en', null).not('completada_en', 'is', null).gt('fecha', actual.t.fecha!)
    : { data: [] as { id: string; fecha: string | null }[] }
  // 1) Lo que venía después de esta se va (las pendientes); la serie vieja termina aquí.
  if (actual.s) {
    const e = await cortarDesde(supabase, actual.s, actual.t.fecha!, false)
    if (e) {
      console.error('cambiarDesdeAqui: cortar', e)
      return { ok: false, mensaje: 'Couldn’t update the series, try again.' }
    }
  }
  // 2) Esta task con sus datos nuevos, fuera de la serie vieja.
  const { id: _i, ...campos } = leida.data
  void _i
  const { error: e1 } = await supabase.from('tareas').update({ ...campos, serie_id: null }).eq('id', tareaId)
  if (e1) {
    console.error('cambiarDesdeAqui: tarea', e1)
    return { ok: false, mensaje: 'Couldn’t save the task, try again.' }
  }
  // 3) Si sigue repitiéndose, nace una serie desde esta task y se generan las siguientes.
  if (regla?.success) {
    if (!campos.fecha) return { ok: false, mensaje: 'To repeat it, give it a date.' }
    const plantilla: Plantilla = { ...campos, responsable_id: actual.t.responsable_id }
    const { error, serieId, fechas } = await nacerSerie(supabase, plantilla, regla.data, fin.data, hoy)
    if (error || !serieId) return { ok: false, mensaje: 'Couldn’t update the series, try again.' }
    await supabase.from('tareas').update({ serie_id: serieId }).eq('id', tareaId)
    const ocupadas = new Set((hechas ?? []).map((h) => h.fecha))
    const siguientes = fechas.filter((f) => f > campos.fecha! && !ocupadas.has(f))
    if (hechas?.length) await supabase.from('tareas').update({ serie_id: serieId }).in('id', hechas.map((h) => h.id))
    if (siguientes.length) {
      const { error: e3 } = await supabase.from('tareas').insert(copias(plantilla, siguientes, serieId))
      if (e3) console.error('cambiarDesdeAqui: copias', e3)
    }
  }
  return listo()
}

/** Editar solo esta repetición: se guarda normal y sigue en su serie (si cambia de space, sale de ella). */
export async function soloEsta(tareaId: string, datos: unknown): Promise<Resultado> {
  if (!id.safeParse(tareaId).success) return { ok: false, mensaje: 'Check the details.' }
  const leida = esquemaTarea.safeParse({ ...(datos as object), id: tareaId })
  if (!leida.success) return { ok: false, mensaje: leida.error.issues[0]?.message ?? 'Check the details.' }
  const supabase = await crearClienteServidor()
  const actual = await tareaYSerie(supabase, tareaId)
  if (!actual) return { ok: false, mensaje: 'Couldn’t find that task.' }
  const { id: _i, ...campos } = leida.data
  void _i
  const salir = campos.espacio_id !== actual.t.espacio_id ? { serie_id: null } : {}
  const { error } = await supabase.from('tareas').update({ ...campos, ...salir }).eq('id', tareaId)
  if (error) {
    console.error('soloEsta', error)
    return { ok: false, mensaje: 'Couldn’t save the task, try again.' }
  }
  return listo()
}

/** Borrar esta repetición y las siguientes pendientes; la serie termina antes de esta. */
export async function borrarDesdeAqui(tareaId: string): Promise<Resultado> {
  if (!id.safeParse(tareaId).success) return { ok: false, mensaje: 'Check the details.' }
  const supabase = await crearClienteServidor()
  const actual = await tareaYSerie(supabase, tareaId)
  if (!actual?.s) return { ok: false, mensaje: 'Couldn’t find that series.' }
  const e = await cortarDesde(supabase, actual.s, actual.t.fecha!, true)
  if (e) {
    console.error('borrarDesdeAqui', e)
    return { ok: false, mensaje: 'Couldn’t delete them, try again.' }
  }
  // Si esta ya estaba hecha, igual se borra: la pediste borrar.
  await supabase.from('tareas').update({ borrado_en: new Date().toISOString() }).eq('id', tareaId)
  return listo()
}

/**
 * Calendarizar con ⇧/⌘: la misma task en varios días seguidos, una independiente por día. Quedan ligadas
 * como una serie «cada día» del primero al último, así editarlas pregunta Only this / All como las que se repiten.
 */
export async function crearEnVariosDias(datos: unknown, fechas: unknown): Promise<Resultado> {
  const dias = z.array(z.iso.date()).min(1).max(31).safeParse(fechas)
  if (!dias.success) return { ok: false, mensaje: 'Check the days.' }
  const unicos = [...new Set(dias.data)].sort()
  const leida = esquemaTarea.safeParse({ ...(datos as object), id: '', fecha: unicos[0], fecha_fin: null })
  if (!leida.success) return { ok: false, mensaje: leida.error.issues[0]?.message ?? 'Check the details.' }
  const supabase = await crearClienteServidor()
  const { data: sesion } = await supabase.auth.getClaims()
  const { id: _i, ...campos } = leida.data
  void _i
  const ultimo = unicos[unicos.length - 1]
  const { data: serie, error } = await supabase
    .from('series')
    .insert({ espacio_id: campos.espacio_id, regla: { freq: 'dia', cada: 1 }, inicio: unicos[0], hasta: ultimo, generado_hasta: ultimo })
    .select('id')
    .single()
  if (error || !serie) {
    console.error('crearEnVariosDias: serie', error)
    return { ok: false, mensaje: 'Couldn’t create the tasks, try again.' }
  }
  const plantilla: Plantilla = { ...campos, responsable_id: sesion!.claims.sub }
  const { error: e2 } = await supabase.from('tareas').insert(copias(plantilla, unicos, serie.id))
  if (e2) {
    console.error('crearEnVariosDias: tareas', e2)
    await supabase.from('series').update({ borrado_en: new Date().toISOString() }).eq('id', serie.id)
    return { ok: false, mensaje: 'Couldn’t create the tasks, try again.' }
  }
  return listo()
}

/**
 * «All»: los cambios de esta task (título, actividad, color, horas, proyecto, space) a todas las de su serie,
 * incluidas las pasadas. La fecha solo cambia en esta.
 */
export async function cambiarTodas(tareaId: string, datos: unknown): Promise<Resultado> {
  if (!id.safeParse(tareaId).success) return { ok: false, mensaje: 'Check the details.' }
  const leida = esquemaTarea.safeParse({ ...(datos as object), id: tareaId })
  if (!leida.success) return { ok: false, mensaje: leida.error.issues[0]?.message ?? 'Check the details.' }
  const supabase = await crearClienteServidor()
  const actual = await tareaYSerie(supabase, tareaId)
  if (!actual?.s) return { ok: false, mensaje: 'Couldn’t find that series.' }
  const { id: _i, ...campos } = leida.data
  void _i
  if (campos.espacio_id !== actual.t.espacio_id) {
    const { error } = await supabase.from('series').update({ espacio_id: campos.espacio_id }).eq('id', actual.s.id)
    if (error) return { ok: false, mensaje: 'Couldn’t move the series, try again.' }
  }
  const comunes = { titulo: campos.titulo, clase: campos.clase, color: campos.color, hora: campos.hora, hora_fin: campos.hora_fin, proyecto_id: campos.proyecto_id, espacio_id: campos.espacio_id }
  const { error: e1 } = await supabase.from('tareas').update(comunes).eq('serie_id', actual.s.id).is('borrado_en', null).neq('id', tareaId)
  const { error: e2 } = await supabase.from('tareas').update(campos).eq('id', tareaId)
  if (e1 || e2) {
    console.error('cambiarTodas', e1 ?? e2)
    return { ok: false, mensaje: 'Couldn’t update them all, try again.' }
  }
  return listo()
}

/** «All» al borrar: toda la serie (también las pasadas) y la serie misma. */
export async function borrarTodas(tareaId: string): Promise<Resultado> {
  if (!id.safeParse(tareaId).success) return { ok: false, mensaje: 'Check the details.' }
  const supabase = await crearClienteServidor()
  const actual = await tareaYSerie(supabase, tareaId)
  if (!actual?.s) return { ok: false, mensaje: 'Couldn’t find that series.' }
  const ahora = new Date().toISOString()
  const { error } = await supabase.from('tareas').update({ borrado_en: ahora }).eq('serie_id', actual.s.id).is('borrado_en', null)
  if (error) {
    console.error('borrarTodas', error)
    return { ok: false, mensaje: 'Couldn’t delete them, try again.' }
  }
  await supabase.from('series').update({ borrado_en: ahora }).eq('id', actual.s.id)
  return listo()
}

/**
 * Cambiar solo cómo termina la calendarización (Never / On date / After N) aplica a toda la serie: si se alarga,
 * se generan las que faltan (hasta el horizonte); si se acorta, se quitan las pendientes que sobran.
 */
export async function cambiarFin(tareaId: string, finCrudo: unknown): Promise<Resultado> {
  const fin = esquemaFin.safeParse(finCrudo ?? {})
  if (!id.safeParse(tareaId).success || !fin.success) return { ok: false, mensaje: 'Check the repeat options.' }
  const [supabase, { hoy }] = await Promise.all([crearClienteServidor(), contextoAhora()])
  const actual = await tareaYSerie(supabase, tareaId)
  if (!actual?.s) return { ok: false, mensaje: 'Couldn’t find that series.' }
  const { data: s } = await supabase.from('series').select('id, regla, inicio, generado_hasta').eq('id', actual.s.id).single()
  const regla = esquemaRegla.safeParse(s?.regla)
  if (!s || !regla.success) return { ok: false, mensaje: 'Couldn’t read the series.' }
  if (fin.data.hasta && fin.data.hasta < s.inicio) return { ok: false, mensaje: 'It can’t end before it starts.' }

  const tope = sumarDias(hoy > s.inicio ? hoy : s.inicio, HORIZONTE)
  // Las fechas que la serie debe tener con el final nuevo (hasta el horizonte).
  const validas = new Set(fechasDe(regla.data, s.inicio, tope, fin.data))
  const ultimaValida = [...validas].pop() ?? s.inicio

  // Se acorta: fuera las pendientes que ya no caben.
  const { data: actuales } = await supabase.from('tareas').select('id, fecha, completada_en').eq('serie_id', s.id).is('borrado_en', null)
  const sobran = (actuales ?? []).filter((t) => t.fecha && !t.completada_en && !validas.has(t.fecha)).map((t) => t.id)
  if (sobran.length) {
    const { error } = await supabase.from('tareas').update({ borrado_en: new Date().toISOString() }).in('id', sobran)
    if (error) return { ok: false, mensaje: 'Couldn’t update the series, try again.' }
  }
  // Se alarga: las que faltan, copiando la última.
  const tiene = new Set((actuales ?? []).map((t) => t.fecha))
  const faltan = [...validas].filter((f) => !tiene.has(f))
  if (faltan.length) {
    const { data: ultima } = await supabase.from('tareas').select(CAMPOS_PLANTILLA).eq('serie_id', s.id).is('borrado_en', null).order('fecha', { ascending: false }).limit(1).maybeSingle()
    if (ultima) {
      const { error } = await supabase.from('tareas').insert(copias(ultima as Plantilla, faltan, s.id))
      if (error) {
        console.error('cambiarFin: copias', error)
        return { ok: false, mensaje: 'Couldn’t extend the series, try again.' }
      }
    }
  }
  const generado = fin.data.hasta || fin.data.conteo ? ultimaValida : tope
  const { error } = await supabase.from('series').update({ hasta: fin.data.hasta, conteo: fin.data.conteo, generado_hasta: generado }).eq('id', s.id)
  if (error) return { ok: false, mensaje: 'Couldn’t update the series, try again.' }
  return listo()
}
