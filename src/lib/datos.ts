import { fechaEn, horaMinEn } from '@/lib/fechas'
import { crearClienteServidor } from '@/lib/supabase/servidor'
import type { Clase, Tarea } from '@/lib/tareas/esquema'

// Solo servidor: usa el cliente de Supabase con las cookies de la sesión.

const COLUMNAS = 'id, espacio_id, titulo, clase, fecha, hora, hora_fin, fecha_fin, serie_id, color, proyecto_id, completada_en'

/** Días hacia adelante que leen Today y Week: más allá solo hay repeticiones generadas por adelantado. */
const VENTANA_LISTAS = 120
const enDias = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10)

/** Mis tareas vivas: pendientes (sin fecha o hasta ~4 meses) + las completadas desde ayer (para «hechas hoy»). */
export async function leerMisTareas(espacioId?: string): Promise<Tarea[]> {
  const supabase = await crearClienteServidor()
  const { data: sesion } = await supabase.auth.getClaims()
  const desde = new Date(Date.now() - 36 * 3600_000).toISOString()
  let q = supabase
    .from('tareas')
    .select(COLUMNAS)
    .is('borrado_en', null)
    .eq('responsable_id', sesion!.claims.sub)
    .or(`completada_en.is.null,completada_en.gte.${desde}`)
    .or(`fecha.is.null,fecha.lte.${enDias(VENTANA_LISTAS)}`)
    .order('fecha', { nullsFirst: false })
    .order('hora', { nullsFirst: true })
    .limit(500)
  if (espacioId) q = q.eq('espacio_id', espacioId)
  const { data, error } = await q
  if (error) console.error('leerMisTareas', error)
  return (data ?? []).map((x) => ({ ...x, clase: x.clase as Clase }))
}

export async function contextoAhora() {
  const supabase = await crearClienteServidor()
  const { data: sesion } = await supabase.auth.getClaims()
  const { data } = await supabase.from('perfiles').select('zona_horaria').eq('user_id', sesion!.claims.sub).single()
  const zona = data?.zona_horaria ?? 'America/Monterrey'
  const ahora = new Date()
  return { zona, hoy: fechaEn(ahora, zona), ahora: horaMinEn(ahora, zona) }
}

export type ProyectoLista = {
  id: string
  espacio_id: string
  nombre: string
  meta: string
  fecha_inicio: string
  fecha_meta: string | null
  modo_avance: 'hitos' | 'tareas' | 'manual'
  cifra_actual: number
  cifra_meta: number | null
  estado: string
  total: number
  hechas: number
}

/** Proyectos con su conteo de tareas no borradas (para el avance). */
export async function leerProyectos({ espacioId, soloActivos = true }: { espacioId?: string; soloActivos?: boolean } = {}): Promise<ProyectoLista[]> {
  const supabase = await crearClienteServidor()
  let q = supabase
    .from('proyectos')
    .select('id, espacio_id, nombre, meta, fecha_inicio, fecha_meta, modo_avance, cifra_actual, cifra_meta, estado, tareas(completada_en, borrado_en, serie_id, fecha)')
    .order('fecha_meta', { nullsFirst: false })
    .order('orden')
  if (soloActivos) q = q.eq('estado', 'activo')
  if (espacioId) q = q.eq('espacio_id', espacioId)
  const { data, error } = await q
  if (error) console.error('leerProyectos', error)
  return (data ?? []).map(({ tareas, ...p }) => {
    // Las repeticiones futuras de una serie no cuentan para el avance (si no, una diaria pesaría 180 tareas).
    const manana = enDias(1)
    const vivas = (tareas ?? []).filter((t) => !t.borrado_en && !(t.serie_id && t.fecha && t.fecha >= manana))
    return {
      ...p,
      modo_avance: p.modo_avance as ProyectoLista['modo_avance'],
      cifra_actual: Number(p.cifra_actual),
      cifra_meta: p.cifra_meta === null ? null : Number(p.cifra_meta),
      total: vivas.length,
      hechas: vivas.filter((t) => t.completada_en).length,
    }
  })
}

/** Mis tareas que tocan algún día entre `desde` y `hasta` (incluidas las hechas): lo que pinta el calendario. */
export async function leerTareasRango(desde: string, hasta: string, espacioId?: string): Promise<Tarea[]> {
  const supabase = await crearClienteServidor()
  const { data: sesion } = await supabase.auth.getClaims()
  let q = supabase
    .from('tareas')
    .select(COLUMNAS)
    .is('borrado_en', null)
    .eq('responsable_id', sesion!.claims.sub)
    // Las que se cruzan con el rango: empiezan antes de que acabe y terminan después de que empieza.
    .lte('fecha', hasta)
    .or(`fecha.gte.${desde},fecha_fin.gte.${desde}`)
    .order('fecha')
    .order('hora', { nullsFirst: true })
    .limit(2000)
  if (espacioId) q = q.eq('espacio_id', espacioId)
  const { data, error } = await q
  if (error) console.error('leerTareasRango', error)
  return (data ?? []).map((x) => ({ ...x, clase: x.clase as Clase }))
}

/** Mis pendientes sin fecha: lo que falta por calendarizar. */
export async function leerSinFecha(espacioId?: string): Promise<Tarea[]> {
  const supabase = await crearClienteServidor()
  const { data: sesion } = await supabase.auth.getClaims()
  let q = supabase
    .from('tareas')
    .select(COLUMNAS)
    .is('borrado_en', null)
    .is('completada_en', null)
    .is('fecha', null)
    .eq('responsable_id', sesion!.claims.sub)
    .order('creado_en', { ascending: false })
    .limit(100)
  if (espacioId) q = q.eq('espacio_id', espacioId)
  const { data, error } = await q
  if (error) console.error('leerSinFecha', error)
  return (data ?? []).map((x) => ({ ...x, clase: x.clase as Clase }))
}
