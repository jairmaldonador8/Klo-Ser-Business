'use client'

import { useRouter } from 'next/navigation'
import { useHoja } from '@/components/hoja/hoja-provider'
import { aMinutos, horaCorta } from '@/lib/calendario/fechas'
import { porcentaje } from '@/lib/proyectos/avance'
import { hhmm, NOMBRE_CLASE, type Tarea } from '@/lib/tareas/esquema'
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

const rango = (t: Tarea) => [t.hora, t.hora_fin].filter(Boolean).map((h) => horaCorta(hhmm(h)!)).join(' – ')

/** Evento con hora en la rejilla: se mueve arrastrándolo y se estira desde la orilla de abajo. */
export function EventoHora({
  tarea,
  estilo,
  color,
  empezar,
  fantasma,
}: {
  tarea: Tarea
  estilo: React.CSSProperties
  color: string
  empezar: Empezar
  fantasma: boolean
}) {
  const abrir = useHoja()
  const ini = aMinutos(tarea.hora!)
  const fin = tarea.hora_fin ? aMinutos(tarea.hora_fin) : ini + 30
  const corto = fin - ini < 45
  const abrirla = () => abrir({ tarea })

  return (
    <button
      type="button"
      className={`cal-ev clase-${tarea.clase}${tarea.completada_en ? ' hecha' : ''}${corto ? ' corto' : ''}${fantasma ? ' fantasma' : ''}`}
      style={{ ...estilo, ...colorVar(color) }}
      aria-label={`${tarea.titulo}, ${rango(tarea)}`}
      onPointerDown={(e) => empezar(e, { tipo: 'mover', tarea, agarre: minutoEn(e) - ini }, abrirla)}
      onClick={soloTeclado(abrirla)}
    >
      <b>{tarea.titulo}</b>
      <small>
        {rango(tarea)}
        {tarea.clase !== 'tarea' && !corto && <em> · {NOMBRE_CLASE[tarea.clase]}</em>}
      </small>
      {!tarea.completada_en && (
        <i
          className="cal-estirar"
          aria-hidden
          onPointerDown={(e) => {
            e.stopPropagation()
            empezar(e, { tipo: 'estirar', tarea })
          }}
        />
      )}
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
      title={`Meta: ${meta.nombre} · ${porcentaje(meta.avance)}`}
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
