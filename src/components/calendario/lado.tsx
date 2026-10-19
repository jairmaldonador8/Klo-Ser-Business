'use client'

import { useState } from 'react'
import { useHoja } from '@/components/hoja/hoja-provider'
import { diaCorto, numeroDia, primeroDeMes, rejillaMes, serie, sumarMeses, tituloVista } from '@/lib/calendario/fechas'
import type { FrenteVista } from '@/lib/frentes'
import { textoFaltan } from '@/lib/proyectos/avance'
import { nombreClase, type Tarea } from '@/lib/tareas/esquema'
import { colorVar } from './fichas'
import type { ColorDe, Empezar, Meta } from './tipos'

export const Flecha = ({ dir }: { dir: 1 | -1 }) => (
  <svg viewBox="0 0 16 16" aria-hidden>
    <path d={dir < 0 ? 'M10 3.5 5.5 8l4.5 4.5' : 'M6 3.5 10.5 8 6 12.5'} />
  </svg>
)

/** Mes chiquito para brincar de fecha; marca lo que se ve, hoy y los días con algo. */
export function MiniMes({ fecha, visibles, hoy, conAlgo, elegir }: { fecha: string; visibles: string[]; hoy: string; conAlgo: Set<string>; elegir: (d: string) => void }) {
  const [ancla, setAncla] = useState(primeroDeMes(fecha))
  // Si la vista cambia de mes, el mini mes la sigue (ajuste durante el render, sin efecto).
  const [seguido, setSeguido] = useState(fecha)
  if (seguido !== fecha) {
    setSeguido(fecha)
    setAncla(primeroDeMes(fecha))
  }
  const dias = rejillaMes(ancla)
  const vis = new Set(visibles)
  const mes = ancla.slice(0, 7)

  return (
    <section className="cal-mini" aria-label="Pick a date">
      <header>
        <b>{tituloVista('mes', ancla)}</b>
        <button type="button" className="cal-icono" aria-label="Previous month" onClick={() => setAncla(sumarMeses(ancla, -1))}>
          <Flecha dir={-1} />
        </button>
        <button type="button" className="cal-icono" aria-label="Next month" onClick={() => setAncla(sumarMeses(ancla, 1))}>
          <Flecha dir={1} />
        </button>
      </header>
      <div className="cal-mini-rejilla">
        {serie(dias[0], 7).map((d) => (
          <span key={d} className="dow">
            {diaCorto(d).charAt(0)}
          </span>
        ))}
        {dias.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => elegir(d)}
            className={[d.slice(0, 7) !== mes && 'fuera', vis.has(d) && 'visible', d === hoy && 'hoy', conAlgo.has(d) && 'algo'].filter(Boolean).join(' ')}
          >
            {numeroDia(d)}
          </button>
        ))}
      </div>
    </section>
  )
}

/** Los frentes como calendarios: se prenden y apagan sin salir de «Todos». */
export function Calendarios({ frentes, ocultos, alternar }: { frentes: FrenteVista[]; ocultos: Set<string>; alternar: (id: string) => void }) {
  return (
    <section className="cal-bloque" aria-label="Calendars">
      <h4>Calendars</h4>
      {frentes.map((f) => (
        <label key={f.id} className="cal-cal" style={colorVar(f.color)}>
          <input type="checkbox" checked={!ocultos.has(f.id)} onChange={() => alternar(f.id)} />
          <i aria-hidden />
          {f.nombre}
        </label>
      ))}
    </section>
  )
}

/** Las metas que vienen: avance y cuánto falta; tocar una lleva a su fecha. */
export function Metas({ metas, hoy, colorDe, ir }: { metas: Meta[]; hoy: string; colorDe: ColorDe; ir: (fecha: string) => void }) {
  const proximas = [...metas].sort((a, b) => a.fecha_meta.localeCompare(b.fecha_meta))
  return (
    <section className="cal-bloque" aria-label="Goals">
      <h4>
        Goals <span>{proximas.length || ''}</span>
      </h4>
      {proximas.length === 0 && <p className="cal-vacio">Give a project a target date and it shows up here.</p>}
      {proximas.map((m) => (
        <button key={m.id} type="button" className="cal-meta-fila" style={colorVar(colorDe(m.espacio_id))} onClick={() => ir(m.fecha_meta)}>
          <span className="nombre">{m.nombre}</span>
          <span className="pista">
            <i style={{ width: `${Math.round(m.avance * 100)}%` }} />
          </span>
          <small>
            {Math.floor(m.avance * 100)}% · {textoFaltan(m.fecha_meta, hoy)}
          </small>
        </button>
      ))}
    </section>
  )
}

/** Pendientes sin fecha: arrástralos a un día o a una hora para calendarizarlos. */
export function PorCalendarizar({ tareas, colorDe, empezar, arrastrando }: { tareas: Tarea[]; colorDe: ColorDe; empezar: Empezar; arrastrando: string | null }) {
  const abrir = useHoja()
  return (
    <section className="cal-bloque" aria-label="To schedule">
      <h4>
        To schedule <span>{tareas.length || ''}</span>
      </h4>
      {tareas.length === 0 ? (
        <p className="cal-vacio">Everything has a date.</p>
      ) : (
        <p className="cal-vacio">Drag them onto the calendar.</p>
      )}
      <ul className="cal-suelta-lista">
        {tareas.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              className={`cal-suelta${arrastrando === t.id ? ' fantasma' : ''}`}
              style={colorVar(colorDe(t.espacio_id))}
              onPointerDown={(e) => empezar(e, { tipo: 'mover', tarea: t, agarre: 0 }, () => abrir({ tarea: t }))}
              onClick={(e) => e.detail === 0 && abrir({ tarea: t })}
            >
              <i aria-hidden />
              <span>{t.titulo}</span>
              {t.clase !== 'tarea' && <small>{nombreClase(t.clase)}</small>}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
