'use client'

import { aMinutos, diaCorto, mesCorto, numeroDia, serie } from '@/lib/calendario/fechas'
import { diasDe } from '@/lib/calendario/tramos'
import type { Tarea } from '@/lib/tareas/esquema'
import { BanderaMeta, colorVar, FichaDia } from './fichas'
import type { ColorDe, Empezar, Meta, Previa } from './tipos'

/** Cuántas cosas caben en una celda antes de «+N más». */
const CABEN = 3

type Props = {
  dias: string[]
  /** Cualquier fecha del mes que se ve: lo de otros meses va apagado. */
  fecha: string
  tareas: Tarea[]
  metas: Meta[]
  hoy: string
  colorDe: ColorDe
  empezar: Empezar
  previa: Previa | null
  arrastrando: string | null
  irADia: (dia: string) => void
  nuevaEn: (dia: string) => void
}

const orden = (a: Tarea, b: Tarea) => (a.hora ? aMinutos(a.hora) : -1) - (b.hora ? aMinutos(b.hora) : -1)

export function VistaMes({ dias, fecha, tareas, metas, hoy, colorDe, empezar, previa, arrastrando, irADia, nuevaEn }: Props) {
  const mes = fecha.slice(0, 7)
  const porDia = new Map(dias.map((d) => [d, { tareas: [] as Tarea[], metas: [] as Meta[] }]))
  // Una task de varios días sale en cada día que toca.
  for (const t of tareas) for (const d of diasDe(t)) porDia.get(d)?.tareas.push(t)
  for (const m of metas) porDia.get(m.fecha_meta)?.metas.push(m)

  return (
    <div className="cal-mes" style={{ '--semanas': dias.length / 7 } as React.CSSProperties}>
      <div className="cal-mes-cab" aria-hidden>
        {serie(dias[0], 7).map((d) => (
          <span key={d}>{diaCorto(d)}</span>
        ))}
      </div>
      <div className="cal-mes-rejilla">
        {dias.map((d) => {
          const x = porDia.get(d)!
          const lista = x.tareas.sort(orden)
          const total = x.metas.length + lista.length
          const visibles = total > CABEN ? CABEN - 1 : CABEN
          const metasVis = x.metas.slice(0, visibles)
          const tareasVis = lista.slice(0, Math.max(0, visibles - metasVis.length))
          const sobre = previa && previa.zona === 'mes' && previa.dia === d
          return (
            <div
              key={d}
              className={`cal-mes-celda${d.slice(0, 7) !== mes ? ' fuera' : ''}${d === hoy ? ' hoy' : ''}${sobre ? ' sobre' : ''}`}
              data-dia={d}
              data-zona="mes"
              onClick={(e) => e.target === e.currentTarget && nuevaEn(d)}
            >
              <button type="button" className="cal-mes-num" onClick={() => irADia(d)} aria-label={`Go to ${d}`}>
                {numeroDia(d) === 1 ? `${mesCorto(d)} 1` : numeroDia(d)}
              </button>
              {metasVis.map((m) => (
                <BanderaMeta key={m.id} meta={m} colorDe={colorDe} empezar={empezar} fantasma={arrastrando === m.id} />
              ))}
              {tareasVis.map((t) => (
                <FichaDia key={t.id} tarea={t} color={colorDe(t.espacio_id)} empezar={empezar} fantasma={arrastrando === t.id} conHora />
              ))}
              {total > visibles && (
                <button type="button" className="cal-mas" onClick={() => irADia(d)}>
                  +{total - visibles} more
                </button>
              )}
              {sobre && (
                <span className="cal-ficha previa contorno" style={colorVar(previa.color)}>
                  {previa.titulo}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
