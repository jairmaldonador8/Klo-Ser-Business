import { fechaEn, horaMinEn, sumarDias } from '@/lib/fechas'
import { hhmm, nombreClase, type Tarea } from '@/lib/tareas/esquema'

// El panorama en vivo que Klo recibe en cada mensaje: corto, con ids, en la zona del usuario.

export type DatosPanorama = {
  ahora: Date
  zona: string
  nombre: string | null
  espacios: { id: string; nombre: string; atajo: string }[]
  predeterminado: string | null
  proyectos: { id: string; nombre: string; espacio_id: string; fecha_meta: string | null }[]
  actividades: string[]
  tareas: Tarea[]
}

const DIAS_ADELANTE = 14
const TOPE_TAREAS = 80

const diaCorto = (f: string) =>
  new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(`${f}T12:00:00Z`)).replace(',', '')

export function armarPanorama(d: DatosPanorama): string {
  const hoy = fechaEn(d.ahora, d.zona)
  const tope = sumarDias(hoy, DIAS_ADELANTE)
  const espacio = new Map(d.espacios.map((e) => [e.id, e.nombre]))
  const fechaLarga = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).format(
    new Date(`${hoy}T12:00:00Z`),
  )

  const tareas = d.tareas
    .filter((t) => !t.completada_en && (!t.fecha || t.fecha <= tope))
    .sort((a, b) => (a.fecha ?? '9999').localeCompare(b.fecha ?? '9999') || (a.hora ?? '').localeCompare(b.hora ?? ''))
    .slice(0, TOPE_TAREAS)

  const renglon = (t: Tarea) => {
    const cuando = t.fecha
      ? [diaCorto(t.fecha), t.hora ? `${hhmm(t.hora)}${t.hora_fin ? `–${hhmm(t.hora_fin)}` : ''}` : null, t.fecha_fin ? `→ ${diaCorto(t.fecha_fin)}` : null]
          .filter(Boolean)
          .join(' ')
      : 'no date'
    const vencida = t.fecha && t.fecha < hoy ? ' · OVERDUE' : ''
    const serie = t.serie_id ? ' · repeats' : ''
    return `- [${t.id}] ${t.titulo} · ${espacio.get(t.espacio_id) ?? '?'} · ${cuando} · ${nombreClase(t.clase)}${vencida}${serie}`
  }

  return [
    `Now: ${fechaLarga}, ${horaMinEn(d.ahora, d.zona)} (${d.zona})`,
    `User: ${d.nombre ?? 'the founder'}`,
    '',
    'Spaces:',
    ...d.espacios.map((e) => `[${e.id}] ${e.nombre} /${e.atajo}${e.id === d.predeterminado ? ' (default)' : ''}`),
    '',
    'Active projects:',
    ...(d.proyectos.length
      ? d.proyectos.map((p) => `[${p.id}] ${p.nombre} · ${espacio.get(p.espacio_id) ?? '?'}${p.fecha_meta ? ` · goal ${p.fecha_meta}` : ''}`)
      : ['(none)']),
    '',
    `Activities: Task, Meeting, Workout, Delivery, Deep work${d.actividades.length ? `, ${d.actividades.join(', ')}` : ''}`,
    '',
    `Open tasks (overdue + next ${DIAS_ADELANTE} days + undated; use buscar for anything else):`,
    ...(tareas.length ? tareas.map(renglon) : ['(none)']),
  ].join('\n')
}
