'use client'

import { useRouter } from 'next/navigation'
import { useHoja } from '@/components/hoja/hoja-provider'
import { horaCorta } from '@/lib/calendario/fechas'
import { absoluto, etiquetaRango, extremos, type Tramo } from '@/lib/calendario/tramos'
import { porcentaje } from '@/lib/proyectos/avance'
import { esClaseBase, hhmm, nombreClase, type Tarea } from '@/lib/tareas/esquema'
import type { ColorDe, Empezar, Meta } from './tipos'

export const colorVar = (color: string) => ({ '--c': `var(--v-p-${color})` }) as React.CSSProperties

/** Minuto del día bajo el puntero, dentro de la columna de horas que lo contiene. */
export function minutoEn(e: React.PointerEvent): number {
  const col = (e.currentTarget as HTMLElement).closest<HTMLElement>('[data-zona="hora"]')
  if (!col) return 0
  const r = col.getBoundingClientRect()
  return ((e.clientY - r.top) / r.height) * 1440
}

/** Un toque de teclado (Enter/espacio) llega como click con detail 0; los del puntero los maneja el arrastre. */
const soloTeclado = (fn: () => void) => (e: React.MouseEvent) => {
  if (e.detail === 0) fn()
}

const rango = (t: Tarea) => {
  if (!t.hora) return ''
  if (t.fecha_fin && t.hora_fin) {
    const { ini, fin } = extremos(t)
    return etiquetaRango(ini, fin, horaCorta)
  }
  return [t.hora, t.hora_fin].filter(Boolean).map((h) => horaCorta(hhmm(h)!)).join(' – ')
}

/** ↻: se repite. */
const Repite = () => (
  <svg className="cal-rep" viewBox="0 0 16 16" aria-label="Repeats" role="img">
    <path d="M2.5 7.5a5 5 0 0 1 8.6-3.4L13 6M13 2.5V6H9.5M13.5 8.5a5 5 0 0 1-8.6 3.4L3 10M3 13.5V10h3.5" />
  </svg>
)

/** Absoluto del minuto bajo el puntero en la columna que lo contiene (para agarrar un tramo de un evento largo). */
function absolutoEn(e: React.PointerEvent): number | null {
  const col = (e.currentTarget as HTMLElement).closest<HTMLElement>('[data-zona="hora"]')
  return col ? absoluto(col.dataset.dia!, minutoEn(e)) : null
}

/** Evento con hora en la rejilla (o uno de sus tramos, si cruza días): se mueve arrastrándolo y se estira por sus orillas. */
export function EventoHora({
  tarea,
  tipo = 'unico',
  ini,
  fin,
  estilo,
  color,
  empezar,
  fantasma,
}: {
  tarea: Tarea
  /** Qué pedazo es: el evento entero, o el inicio, medio o fin de uno que cruza días. */
  tipo?: Tramo['tipo']
  ini: number
  fin: number
  estilo: React.CSSProperties
  color: string
  empezar: Empezar
  fantasma: boolean
}) {
  const abrir = useHoja()
  const corto = fin - ini < 45
  const abrirla = () => abrir({ tarea })
  // Orillas que se pueden estirar: el inicio vive en el primer tramo; el fin, en el último.
  const bordes = (['inicio', 'fin'] as const).filter((b) => (b === 'inicio' ? tipo === 'unico' || tipo === 'inicio' : tipo === 'unico' || tipo === 'fin'))

  return (
    <button
      type="button"
      className={`cal-ev tramo-${tipo} clase-${esClaseBase(tarea.clase) ? tarea.clase : 'propia'}${tarea.completada_en ? ' hecha' : ''}${corto ? ' corto' : ''}${fantasma ? ' fantasma' : ''}`}
      style={{ ...estilo, ...colorVar(color) }}
      aria-label={`${tarea.titulo}, ${rango(tarea)}`}
      onPointerDown={(e) => {
        // Cuánto hay entre el inicio del evento (aunque sea de otro día) y donde lo tomaste.
        const aqui = absolutoEn(e)
        empezar(e, { tipo: 'mover', tarea, agarre: aqui === null ? 0 : aqui - extremos(tarea).ini }, abrirla)
      }}
      onClick={soloTeclado(abrirla)}
    >
      <b>{tarea.titulo}</b>
      <small>
        {rango(tarea)}
        {tarea.clase !== 'tarea' && !corto && <em> · {nombreClase(tarea.clase)}</em>}
        {tarea.serie_id && <Repite />}
      </small>
      {!tarea.completada_en &&
        bordes.map((borde) => (
          <i
            key={borde}
            className={`cal-estirar ${borde === 'inicio' ? 'arriba' : 'abajo'}`}
            aria-hidden
            onPointerDown={(e) => {
              e.stopPropagation()
              empezar(e, { tipo: 'estirar', tarea, borde })
            }}
          />
        ))}
    </button>
  )
}

/** Tarea en una celda de día (todo el día o mes). En el mes, las que tienen hora la muestran. */
export function FichaDia({ tarea, color, empezar, fantasma, conHora }: { tarea: Tarea; color: string; empezar: Empezar; fantasma: boolean; conHora?: boolean }) {
  const abrir = useHoja()
  const abrirla = () => abrir({ tarea })
  const conReloj = conHora && tarea.hora
  return (
    <button
      type="button"
      className={`cal-ficha${conReloj ? ' con-hora' : ''}${tarea.completada_en ? ' hecha' : ''}${fantasma ? ' fantasma' : ''}`}
      style={colorVar(color)}
      onPointerDown={(e) => {
        e.stopPropagation()
        empezar(e, { tipo: 'mover', tarea, agarre: 0 }, abrirla)
      }}
      onClick={soloTeclado(abrirla)}
    >
      {conReloj && <time>{horaCorta(hhmm(tarea.hora)!)}</time>}
      <span>{tarea.titulo}</span>
      {tarea.serie_id && <Repite />}
    </button>
  )
}

/** La meta de un proyecto: bandera en su día, con el avance. Arrástrala para moverla; tócala para ir al proyecto. */
export function BanderaMeta({ meta, colorDe, empezar, fantasma }: { meta: Meta; colorDe: ColorDe; empezar: Empezar; fantasma: boolean }) {
  const router = useRouter()
  const ir = () => router.push(`/proyectos/${meta.id}`)
  return (
    <button
      type="button"
      className={`cal-meta${fantasma ? ' fantasma' : ''}`}
      style={colorVar(colorDe(meta.espacio_id))}
      title={`Goal: ${meta.nombre} · ${porcentaje(meta.avance)}`}
      onPointerDown={(e) => {
        e.stopPropagation()
        empezar(e, { tipo: 'meta', meta }, ir)
      }}
      onClick={soloTeclado(ir)}
    >
      <svg viewBox="0 0 16 16" aria-hidden>
        <path d="M3.5 14V2.5M3.5 3h8l-1.8 3 1.8 3h-8" />
      </svg>
      <span>{meta.nombre}</span>
      <i>{Math.floor(meta.avance * 100)}%</i>
    </button>
  )
}
