'use client'

import { useEffect, useRef } from 'react'
import { acomodar, finEfectivo } from '@/lib/calendario/disposicion'
import { aMinutos, diaCorto, horaCorta, deMinutos, numeroDia } from '@/lib/calendario/fechas'
import type { Tarea } from '@/lib/tareas/esquema'
import { BanderaMeta, colorVar, EventoHora, FichaDia, minutoEn } from './fichas'
import type { ColorDe, Empezar, Meta, Previa } from './tipos'

const HORAS = Array.from({ length: 24 }, (_, h) => h)
const pct = (min: number) => `${(min / 1440) * 100}%`

type Props = {
  dias: string[]
  tareas: Tarea[]
  metas: Meta[]
  hoy: string
  /** «HH:MM» en tu zona; null hasta montar (evita diferencias de hidratación). */
  ahora: string | null
  colorDe: ColorDe
  empezar: Empezar
  previa: Previa | null
  arrastrando: string | null
  irADia: (dia: string) => void
  nuevaEn: (dia: string, ini?: number, fin?: number) => void
}

/** Día, 3 días o semana: renglón «todo el día» arriba y la rejilla de 24 horas abajo. */
export function VistaHoras({ dias, tareas, metas, hoy, ahora, colorDe, empezar, previa, arrastrando, irADia, nuevaEn }: Props) {
  const scroll = useRef<HTMLDivElement>(null)
  const yaBajo = useRef(false)

  // Al abrir, la rejilla baja a la hora actual (o a las 7 am): nadie empieza el día a medianoche.
  useEffect(() => {
    const el = scroll.current
    if (!el || yaBajo.current || ahora === null) return
    yaBajo.current = true
    const min = dias.includes(hoy) ? Math.max(0, aMinutos(ahora) - 90) : 7 * 60
    el.scrollTop = (min / 1440) * el.scrollHeight
  }, [ahora, dias, hoy])

  const porDia = new Map(dias.map((d) => [d, { conHora: [] as Tarea[], sinHora: [] as Tarea[], metas: [] as Meta[] }]))
  for (const t of tareas) {
    const d = t.fecha && porDia.get(t.fecha)
    if (d) (t.hora ? d.conHora : d.sinHora).push(t)
  }
  for (const m of metas) porDia.get(m.fecha_meta)?.metas.push(m)

  const estilo = { '--n': dias.length } as React.CSSProperties

  return (
    <div className="cal-horas" style={estilo}>
      <div className="cal-cabdias">
        <span />
        {dias.map((d) => (
          <button key={d} type="button" className={`cal-cabdia${d === hoy ? ' hoy' : ''}`} onClick={() => irADia(d)} aria-label={`Go to ${d}`}>
            <small>{diaCorto(d)}</small>
            <b>{numeroDia(d)}</b>
          </button>
        ))}
      </div>

      <div className="cal-todo-dia">
        <span className="cal-etq-todo">all day</span>
        {dias.map((d) => {
          const x = porDia.get(d)!
          const sobre = previa && previa.zona === 'dia' && previa.dia === d
          return (
            <div
              key={d}
              className={`cal-celda-dia${sobre ? ' sobre' : ''}`}
              data-dia={d}
              data-zona="dia"
              onClick={(e) => e.target === e.currentTarget && nuevaEn(d)}
            >
              {x.metas.map((m) => (
                <BanderaMeta key={m.id} meta={m} colorDe={colorDe} empezar={empezar} fantasma={arrastrando === m.id} />
              ))}
              {x.sinHora.map((t) => (
                <FichaDia key={t.id} tarea={t} color={colorDe(t.espacio_id)} empezar={empezar} fantasma={arrastrando === t.id} />
              ))}
              {sobre && <span className="cal-ficha previa contorno" style={colorVar(previa.color)}>{previa.titulo}</span>}
            </div>
          )
        })}
      </div>

      <div className="cal-scroll" ref={scroll}>
        <div className="cal-rejilla">
          <div className="cal-regla" aria-hidden>
            {HORAS.slice(1).map((h) => (
              <span key={h} style={{ top: pct(h * 60) }}>
                {horaCorta(deMinutos(h * 60))}
              </span>
            ))}
          </div>
          {dias.map((d) => {
            const lista = porDia.get(d)!.conHora
            const lugares = acomodar(
              lista.map((t) => {
                const ini = aMinutos(t.hora!)
                return { id: t.id, ini, fin: finEfectivo(ini, t.hora_fin ? aMinutos(t.hora_fin) : null) }
              }),
            )
            const verPrevia = previa && previa.zona === 'hora' && (previa.dias ?? [previa.dia]).includes(d) && previa.ini !== null
            return (
              <div
                key={d}
                className={`cal-col${d === hoy ? ' hoy' : ''}`}
                data-dia={d}
                data-zona="hora"
                onPointerDown={(e) => {
                  if (e.target !== e.currentTarget) return
                  const desde = Math.max(0, Math.floor(minutoEn(e) / 15) * 15)
                  empezar(e, { tipo: 'crear', dia: d, desde }, () => nuevaEn(d, desde, Math.min(1440 - 1, desde + 60)))
                }}
              >
                {lista.map((t) => {
                  const ini = aMinutos(t.hora!)
                  const fin = finEfectivo(ini, t.hora_fin ? aMinutos(t.hora_fin) : null)
                  const { col, cols } = lugares.get(t.id)!
                  // En cascada: cada uno se asoma sobre el de al lado (como Notion); el último no se sale.
                  const ancho = cols === 1 ? 1 : Math.min((cols - col) / cols, 1.7 / cols)
                  return (
                    <EventoHora
                      key={t.id}
                      tarea={t}
                      color={colorDe(t.espacio_id)}
                      empezar={empezar}
                      fantasma={arrastrando === t.id}
                      estilo={{
                        top: pct(ini),
                        height: pct(fin - ini),
                        left: `calc(${(col / cols) * 100}% + 2px)`,
                        width: `calc(${ancho * 100}% - 5px)`,
                        zIndex: 2 + col,
                      }}
                    />
                  )
                })}
                {verPrevia && (
                  <div className={`cal-ev previa${previa.contorno ? ' contorno' : ''}${previa.borrador ? ' borrador' : ''}`} style={{ top: pct(previa.ini!), height: pct(Math.max(15, previa.fin! - previa.ini!)), ...colorVar(previa.color) }}>
                    <b>{previa.titulo}</b>
                    <small>
                      {horaCorta(deMinutos(previa.ini!))} – {horaCorta(deMinutos(previa.fin!))}
                    </small>
                  </div>
                )}
                {d === hoy && ahora && (
                  <div className="cal-ahora" style={{ top: pct(aMinutos(ahora)) }} aria-label={`Now, ${horaCorta(ahora)}`}>
                    <i />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

