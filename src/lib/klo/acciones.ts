import type { SupabaseClient } from '@supabase/supabase-js'
import { fechaEn, instanteEn, sumarDias } from '@/lib/fechas'
import { esquemaRegla, etiquetaRegla } from '@/lib/repetir'
import type { Database } from '@/lib/supabase/tipos'
import { esquemaTarea, hhmm } from '@/lib/tareas/esquema'
import { copias, nacerSerie } from '@/lib/tareas/series'
import { ESQUEMAS, type NombreHerramienta } from './herramientas'

// Lo que Klo hace de verdad. Recibe el cliente de la sesión: RLS decide qué puede tocar.

export type Cliente = SupabaseClient<Database>
type CambiosTarea = Database['public']['Tables']['tareas']['Update']
type CambiosProyecto = Database['public']['Tables']['proyectos']['Update']
type CambiosSerie = Database['public']['Tables']['series']['Update']
export type Ctx = { usuario: string; espacios: Set<string>; predeterminado: string | null; zona: string }

export type Deshacer =
  | { tipo: 'borrar_tarea'; id: string }
  | { tipo: 'restaurar_tarea'; id: string; campos: CambiosTarea }
  | { tipo: 'borrar_nota'; id: string }
  | { tipo: 'borrar_aviso'; id: string }
  | { tipo: 'borrar_memoria'; id: string }
  | { tipo: 'borrar_serie'; id: string }
  | { tipo: 'restaurar_serie'; id: string; campos: CambiosSerie; tareas: string[] }
  | { tipo: 'borrar_proyecto'; id: string }
  | { tipo: 'restaurar_proyecto'; id: string; campos: CambiosProyecto }

/** `texto` va de regreso a Claude; `resumen` es el chip que ve Jair. */
export type Hecho = { texto: string; resumen?: string; deshacer?: Deshacer; error?: boolean }

const MAX_MEMORIA = 100
const CAMPOS_TAREA = 'id, espacio_id, titulo, clase, fecha, hora, hora_fin, fecha_fin, color, proyecto_id, aviso_min, serie_id, completada_en, borrado_en'

const falla = (texto: string): Hecho => ({ texto, error: true })

/** «Thu Oct 22, 4:00 PM» para los chips. */
export function cuando(fecha: string | null, hora: string | null): string {
  if (!fecha) return 'no date'
  const dia = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(`${fecha}T12:00:00Z`))
  if (!hora) return dia
  const [h, m] = hora.split(':').map(Number)
  return `${dia}, ${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}

function espacioValido(ctx: Ctx, espacio?: string | null): string | null {
  if (espacio && ctx.espacios.has(espacio)) return espacio
  return ctx.predeterminado ?? [...ctx.espacios][0] ?? null
}

export async function ejecutar(sb: Cliente, ctx: Ctx, nombre: NombreHerramienta, crudo: unknown): Promise<Hecho> {
  const leido = ESQUEMAS[nombre].safeParse(crudo)
  if (!leido.success) return falla(`Invalid input: ${leido.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join('; ')}`)
  const input = leido.data as Record<string, unknown>

  switch (nombre) {
    case 'buscar':
      return buscar(sb, input as { texto?: string; desde?: string; hasta?: string; incluir_hechas?: boolean })

    case 'crear_task': {
      const { repetir, repetir_hasta, repetir_veces, ...resto } = input
      const espacio_id = espacioValido(ctx, resto.espacio_id as string | undefined)
      if (!espacio_id) return falla('The user has no spaces.')
      const datos = esquemaTarea.safeParse({ id: null, clase: 'tarea', proyecto_id: null, hora_fin: null, ...resto, espacio_id })
      if (!datos.success) return falla(datos.error.issues[0]?.message ?? 'Invalid task.')
      const { id: _i, ...campos } = datos.data
      void _i
      if (repetir) return crearSerie(sb, ctx, campos, repetir, (repetir_hasta as string | undefined) ?? null, (repetir_veces as number | undefined) ?? null)
      const { data, error } = await sb.from('tareas').insert({ ...campos, origen: 'klo' }).select('id').single()
      if (error || !data) return falla(`Could not create it (${error?.message ?? 'unknown'}).`)
      return {
        texto: `Created task ${data.id}.`,
        resumen: `Added · ${campos.titulo} · ${cuando(campos.fecha, campos.hora)}`,
        deshacer: { tipo: 'borrar_tarea', id: data.id },
      }
    }

    case 'cambiar_task': {
      const { id, ...cambios } = input as { id: string } & Record<string, unknown>
      const { data: actual } = await sb.from('tareas').select(CAMPOS_TAREA).eq('id', id).is('borrado_en', null).maybeSingle()
      if (!actual) return falla(`Unknown task id ${id}. Use buscar to find it.`)
      if (cambios.espacio_id !== undefined) cambios.espacio_id = espacioValido(ctx, cambios.espacio_id as string)
      const junto = { ...actual, ...cambios }
      const datos = esquemaTarea.safeParse(junto)
      if (!datos.success) return falla(datos.error.issues[0]?.message ?? 'Invalid change.')
      const claves = Object.keys(cambios).filter((k) => cambios[k] !== undefined) as (keyof typeof actual)[]
      if (!claves.length) return falla('Nothing to change.')
      const nuevo: CambiosTarea = Object.fromEntries(claves.map((k) => [k, (datos.data as Record<string, unknown>)[k] ?? null]))
      const antes: CambiosTarea = Object.fromEntries(claves.map((k) => [k, actual[k]]))
      // Como «Only this» de la hoja: si cambia de space, sale de su serie.
      if (actual.serie_id && nuevo.espacio_id && nuevo.espacio_id !== actual.espacio_id) {
        nuevo.serie_id = null
        antes.serie_id = actual.serie_id
      }
      const { error } = await sb.from('tareas').update(nuevo).eq('id', id)
      if (error) return falla(`Could not change it (${error.message}).`)
      const movida = 'fecha' in nuevo || 'hora' in nuevo
      return {
        texto: `Updated task ${id}.`,
        resumen: movida ? `Moved · ${datos.data.titulo} → ${cuando(datos.data.fecha, datos.data.hora)}` : `Edited · ${datos.data.titulo}`,
        deshacer: { tipo: 'restaurar_tarea', id, campos: antes },
      }
    }

    case 'completar_task': {
      const { id, hecha = true } = input as { id: string; hecha?: boolean }
      const { data: actual } = await sb.from('tareas').select('titulo, completada_en').eq('id', id).is('borrado_en', null).maybeSingle()
      if (!actual) return falla(`Unknown task id ${id}.`)
      const { error } = await sb.from('tareas').update({ completada_en: hecha ? new Date().toISOString() : null }).eq('id', id)
      if (error) return falla(`Could not check it off (${error.message}).`)
      return {
        texto: hecha ? `Checked off ${id}.` : `Un-checked ${id}.`,
        resumen: `${hecha ? 'Done' : 'Reopened'} · ${actual.titulo}`,
        deshacer: { tipo: 'restaurar_tarea', id, campos: { completada_en: actual.completada_en } },
      }
    }

    case 'borrar_task': {
      const { id, toda_la_serie } = input as { id: string; toda_la_serie?: boolean }
      const { data: actual } = await sb.from('tareas').select('titulo, serie_id, fecha').eq('id', id).is('borrado_en', null).maybeSingle()
      if (!actual) return falla(`Unknown task id ${id}.`)
      if (toda_la_serie && actual.serie_id && actual.fecha) return cortarSerie(sb, actual.serie_id, actual.fecha, actual.titulo)
      const { error } = await sb.from('tareas').update({ borrado_en: new Date().toISOString() }).eq('id', id)
      if (error) return falla(`Could not delete it (${error.message}).`)
      return { texto: `Deleted ${id}.`, resumen: `Deleted · ${actual.titulo}`, deshacer: { tipo: 'restaurar_tarea', id, campos: { borrado_en: null } } }
    }

    case 'crear_nota': {
      const espacio_id = espacioValido(ctx, input.espacio_id as string | undefined)
      if (!espacio_id) return falla('The user has no spaces.')
      const texto = String(input.texto).trim()
      const { data, error } = await sb.from('notas').insert({ espacio_id, texto }).select('id').single()
      if (error || !data) return falla(`Could not save the note (${error?.message ?? 'unknown'}).`)
      return { texto: `Saved note ${data.id}.`, resumen: `Note · ${texto.slice(0, 60)}`, deshacer: { tipo: 'borrar_nota', id: data.id } }
    }

    case 'programar_aviso': {
      const { texto, fecha, hora, tarea_id } = input as { texto: string; fecha: string; hora: string; tarea_id?: string }
      const enviar_en = instanteEn(fecha, hora, ctx.zona)
      if (enviar_en.getTime() < Date.now() - 60_000) return falla('That time already passed; ask for a future time.')
      let tarea: string | null = null
      if (tarea_id) {
        const { data } = await sb.from('tareas').select('id').eq('id', tarea_id).maybeSingle()
        tarea = data?.id ?? null
      }
      const { data, error } = await sb.from('avisos').insert({ texto, enviar_en: enviar_en.toISOString(), tarea_id: tarea, url: '/hoy' }).select('id').single()
      if (error || !data) return falla(`Could not schedule it (${error?.message ?? 'unknown'}).`)
      return { texto: `Reminder scheduled for ${fecha} ${hora}.`, resumen: `Reminder · ${texto} · ${cuando(fecha, hora)}`, deshacer: { tipo: 'borrar_aviso', id: data.id } }
    }

    case 'crear_proyecto': {
      const { nombre, meta, fecha_meta } = input as { nombre: string; meta?: string; fecha_meta?: string }
      const espacio_id = espacioValido(ctx, input.espacio_id as string | undefined)
      if (!espacio_id) return falla('The user has no spaces.')
      const hoy = fechaEn(new Date(), ctx.zona)
      if (fecha_meta && fecha_meta < hoy) return falla('The target date can’t be before today.')
      const { data, error } = await sb
        .from('proyectos')
        .insert({ espacio_id, nombre, meta: meta ?? '', fecha_meta: fecha_meta ?? null, modo_avance: 'tareas', fecha_inicio: hoy })
        .select('id')
        .single()
      if (error || !data) return falla(`Could not create the project (${error?.message ?? 'unknown'}).`)
      return { texto: `Created project ${data.id}.`, resumen: `New project · ${nombre}`, deshacer: { tipo: 'borrar_proyecto', id: data.id } }
    }

    case 'cambiar_proyecto': {
      const { id, ...cambios } = input as { id: string } & CambiosProyecto
      const { data: actual } = await sb.from('proyectos').select('nombre, meta, fecha_meta, estado').eq('id', id).maybeSingle()
      if (!actual) return falla(`Unknown project id ${id}.`)
      const claves = (Object.keys(cambios) as (keyof typeof actual)[]).filter((k) => cambios[k] !== undefined)
      if (!claves.length) return falla('Nothing to change.')
      const nuevo: CambiosProyecto = Object.fromEntries(claves.map((k) => [k, cambios[k]]))
      const antes: CambiosProyecto = Object.fromEntries(claves.map((k) => [k, actual[k]]))
      const { error } = await sb.from('proyectos').update(nuevo).eq('id', id)
      if (error) return falla(error.code === '23514' ? 'The target date must be after the project start.' : `Could not change it (${error.message}).`)
      const verbos: Record<string, string> = { activo: 'Reactivated', pausado: 'Paused', cerrado: 'Archived' }
      const verbo = nuevo.estado ? verbos[nuevo.estado] : 'Edited project'
      return { texto: `Updated project ${id}.`, resumen: `${verbo} · ${nuevo.nombre ?? actual.nombre}`, deshacer: { tipo: 'restaurar_proyecto', id, campos: antes } }
    }

    case 'recordar': {
      const texto = String(input.texto).trim()
      const { count } = await sb.from('klo_memoria').select('id', { count: 'exact', head: true })
      if ((count ?? 0) >= MAX_MEMORIA) return falla('Memory is full; tell the user to clean it up in Settings.')
      const { data, error } = await sb.from('klo_memoria').insert({ texto }).select('id').single()
      if (error || !data) return falla(`Could not remember it (${error?.message ?? 'unknown'}).`)
      return { texto: 'Remembered.', resumen: `Remembered · ${texto.slice(0, 60)}`, deshacer: { tipo: 'borrar_memoria', id: data.id } }
    }
  }
}

type CamposTarea = Omit<ReturnType<typeof esquemaTarea.parse>, 'id'>

/** Task que se repite: la serie y sus repeticiones hasta el horizonte (todo o nada). */
async function crearSerie(sb: Cliente, ctx: Ctx, campos: CamposTarea, crudo: unknown, hasta: string | null, conteo: number | null): Promise<Hecho> {
  const regla = esquemaRegla.safeParse(crudo)
  if (!regla.success) return falla('Invalid repeat rule.')
  if (!campos.fecha) return falla('To repeat it, give it a date (the first occurrence).')
  if (hasta && hasta < campos.fecha) return falla('repetir_hasta must be on or after fecha.')
  const fin = { hasta, conteo }
  const plantilla = { ...campos, responsable_id: ctx.usuario }
  const { error, serieId, fechas } = await nacerSerie(sb, plantilla, regla.data, fin, fechaEn(new Date(), ctx.zona))
  if (error || !serieId) return falla(`Could not create the series (${error?.message ?? 'unknown'}).`)
  const filas = copias(plantilla, fechas, serieId).map((f) => ({ ...f, origen: 'klo', aviso_min: campos.aviso_min }))
  const { data, error: e2 } = await sb.from('tareas').insert(filas).select('id')
  if (e2 || !data?.length) {
    await sb.from('series').update({ borrado_en: new Date().toISOString() }).eq('id', serieId)
    return falla(`Could not create the occurrences (${e2?.message ?? 'none fell in range'}).`)
  }
  const etiqueta = etiquetaRegla(regla.data, campos.fecha, fin)
  return {
    texto: `Created repeating task (${etiqueta}): ${data.length} occurrences generated, the first is task ${data[0].id}.`,
    resumen: `Added · ${campos.titulo} · ${cuando(campos.fecha, campos.hora)} · ${etiqueta}`,
    deshacer: { tipo: 'borrar_serie', id: serieId },
  }
}

/** Deja de repetirse desde `fecha`: fuera las pendientes de ahí en adelante; la serie termina el día anterior. */
async function cortarSerie(sb: Cliente, serieId: string, fecha: string, titulo: string): Promise<Hecho> {
  const { data: serie } = await sb.from('series').select('inicio, hasta, generado_hasta, borrado_en').eq('id', serieId).maybeSingle()
  if (!serie) return falla('Could not read that series.')
  const { data: pendientes } = await sb.from('tareas').select('id').eq('serie_id', serieId).is('borrado_en', null).is('completada_en', null).gte('fecha', fecha)
  const ids = (pendientes ?? []).map((t) => t.id)
  if (ids.length) {
    const { error } = await sb.from('tareas').update({ borrado_en: new Date().toISOString() }).in('id', ids)
    if (error) return falla(`Could not delete them (${error.message}).`)
  }
  const ultimo = sumarDias(fecha, -1)
  const nuevo: CambiosSerie = ultimo < serie.inicio ? { borrado_en: new Date().toISOString() } : { hasta: ultimo, generado_hasta: ultimo }
  await sb.from('series').update(nuevo).eq('id', serieId)
  return {
    texto: `Stopped the series from ${fecha}: ${ids.length} pending occurrences deleted.`,
    resumen: `Stopped repeating · ${titulo} · from ${cuando(fecha, null)}`,
    deshacer: { tipo: 'restaurar_serie', id: serieId, campos: { hasta: serie.hasta, generado_hasta: serie.generado_hasta, borrado_en: serie.borrado_en }, tareas: ids },
  }
}

async function buscar(sb: Cliente, q: { texto?: string; desde?: string; hasta?: string; incluir_hechas?: boolean }): Promise<Hecho> {
  let tareas = sb.from('tareas').select(CAMPOS_TAREA).is('borrado_en', null).order('fecha', { nullsFirst: false }).order('hora').limit(30)
  const palabras = q.texto?.replace(/[%,()]/g, ' ').trim()
  if (palabras) tareas = tareas.ilike('titulo', `%${palabras}%`)
  if (q.desde) tareas = tareas.gte('fecha', q.desde)
  if (q.hasta) tareas = tareas.lte('fecha', q.hasta)
  if (!q.incluir_hechas) tareas = tareas.is('completada_en', null)
  const [{ data: ts, error }, { data: notas }] = await Promise.all([
    tareas,
    palabras ? sb.from('notas').select('id, texto').is('borrado_en', null).ilike('texto', `%${palabras}%`).limit(10) : Promise.resolve({ data: [] }),
  ])
  if (error) return falla(`Search failed (${error.message}).`)
  const lineas = [
    ...(ts ?? []).map(
      (t) => `- task [${t.id}] ${t.titulo} · space ${t.espacio_id} · ${t.fecha ?? 'no date'}${t.hora ? ` ${hhmm(t.hora)}` : ''}${t.completada_en ? ' · done' : ''}`,
    ),
    ...(notas ?? []).map((n) => `- note [${n.id}] ${n.texto.slice(0, 120)}`),
  ]
  return { texto: lineas.length ? lineas.join('\n') : 'No results.' }
}
