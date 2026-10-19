'use client'

import { useEffect, useRef } from 'react'
import { acomodar } from '@/lib/calendario/disposicion'
import { aMinutos, diaCorto, horaCorta, deMinutos, numeroDia } from '@/lib/calendario/fechas'
import { diasDe, extremos, tramos, type Tramo } from '@/lib/calendario/tramos'
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

  // Con hora: cada evento se parte en sus tramos por día (uno que cruza la medianoche sale en ambos días).
  // Sin hora: una ficha en cada día que toca.
  type Pedazo = { t: Tarea; ini: number; fin: number; tipo: Tramo['tipo'] }
  const porDia = new Map(dias.map((d) => [d, { conHora: [] as Pedazo[], sinHora: [] as Tarea[], metas: [] as Meta[] }]))
  for (const t of tareas) {
    if (!t.fecha) continue
    if (!t.hora) {
      for (const d of diasDe(t)) porDia.get(d)?.sinHora.push(t)
      continue
    }
    const { ini, fin } = extremos(t)
    for (const tr of tramos(ini, fin)) porDia.get(tr.dia)?.conHora.push({ t, ini: tr.ini, fin: Math.max(tr.fin, tr.ini + 15), tipo: tr.tipo })
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
            const lugares = acomodar(lista.map((p) => ({ id: p.t.id, ini: p.ini, fin: p.fin })))
            // La vista previa en esta columna: su tramo de este día, si lo tiene.
            const pre =
              previa && previa.zona === 'hora'
                ? (previa.tramos?.find((x) => x.dia === d) ?? (previa.dia === d && previa.ini !== null && previa.fin !== null ? { ini: previa.ini, fin: previa.fin } : null))
                : null
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
                {lista.map(({ t, ini, fin, tipo }) => {
                  const { col, cols } = lugares.get(t.id)!
                  // En cascada: cada uno se asoma sobre el de al lado (como Notion); el último no se sale.
                  const ancho = cols === 1 ? 1 : Math.min((cols - col) / cols, 1.7 / cols)
                  return (
                    <EventoHora
                      key={t.id}
                      tarea={t}
                      tipo={tipo}
                      ini={ini}
                      fin={fin}
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
                {pre && previa && (
                  <div
                    className={`cal-ev previa${previa.contorno ? ' contorno' : ''}${previa.borrador ? ' borrador' : ''}`}
                    style={{ top: pct(pre.ini), height: pct(Math.max(15, pre.fin - pre.ini)), ...colorVar(previa.color) }}
                  >
                    <b>{previa.titulo}</b>
                    <small>{previa.etiqueta ?? `${horaCorta(deMinutos(pre.ini))} – ${horaCorta(deMinutos(pre.fin))}`}</small>
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

