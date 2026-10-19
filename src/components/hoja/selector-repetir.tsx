'use client'

import { useEffect, useRef, useState } from 'react'
import { etiquetaRegla, mismaRegla, NOMBRE_DIA, opcionesPara, SIN_FIN, type Fin, type Regla } from '@/lib/repetir'
import { diaSemana } from '@/lib/calendario/fechas'

export type Repetir = { regla: Regla; fin: Fin } | null

const UNIDADES: { freq: Regla['freq']; uno: string; varios: string }[] = [
  { freq: 'dia', uno: 'day', varios: 'days' },
  { freq: 'semana', uno: 'week', varios: 'weeks' },
  { freq: 'mes', uno: 'month', varios: 'months' },
  { freq: 'anio', uno: 'year', varios: 'years' },
]

/** «Repeat»: el menú rápido de Notion (armado para el día elegido) y un panel «Custom…». */
export function SelectorRepetir({ fecha, valor, cambiar }: { fecha: string; valor: Repetir; cambiar: (v: Repetir) => void }) {
  const [menu, setMenu] = useState(false)
  const [custom, setCustom] = useState(false)
  const caja = useRef<HTMLDivElement>(null)
  const opciones = fecha ? opcionesPara(fecha) : []

  // Tocar fuera cierra el menú.
  useEffect(() => {
    if (!menu) return
    const fuera = (e: PointerEvent) => !caja.current?.contains(e.target as Node) && setMenu(false)
    window.addEventListener('pointerdown', fuera)
    return () => window.removeEventListener('pointerdown', fuera)
  }, [menu])

  const elegir = (v: Repetir) => {
    cambiar(v)
    setMenu(false)
    setCustom(false)
  }

  if (!fecha) return <p className="v-sub">Give it a date to repeat it.</p>

  const regla = valor?.regla ?? { freq: 'semana' as const, cada: 1, dias: [diaSemana(fecha)] }
  const fin = valor?.fin ?? SIN_FIN
  const poner = (r: Partial<Regla>, f: Partial<Fin> = {}) => cambiar({ regla: { ...regla, ...r }, fin: { ...fin, ...f } })
  const terminacion = fin.hasta ? 'fecha' : fin.conteo ? 'veces' : 'nunca'

  return (
    <div className="v-repetir" ref={caja}>
      <button type="button" className="v-campo v-repetir-boton" aria-haspopup="listbox" aria-expanded={menu} aria-label="Repeat" onClick={() => setMenu((m) => !m)}>
        <svg viewBox="0 0 16 16" aria-hidden>
          <path d="M2.5 7.5a5 5 0 0 1 8.6-3.4L13 6M13 2.5V6H9.5M13.5 8.5a5 5 0 0 1-8.6 3.4L3 10M3 13.5V10h3.5" />
        </svg>
        <span>{valor ? etiquetaRegla(valor.regla, fecha, valor.fin) : 'Does not repeat'}</span>
        <i aria-hidden>▾</i>
      </button>

      {menu && (
        <div className="v-repetir-menu" role="listbox" aria-label="Repeat options">
          <button type="button" role="option" aria-selected={!valor} onClick={() => elegir(null)}>
            Does not repeat
          </button>
          {opciones.map((o) => (
            <button key={o.etiqueta} type="button" role="option" aria-selected={!custom && mismaRegla(valor?.regla ?? null, o.regla)} onClick={() => elegir({ regla: o.regla, fin: SIN_FIN })}>
              {o.etiqueta.replace(/ (on .*)$/, '')}
              {/ on /.test(o.etiqueta) && (
                <>
                  {' '}
                  <small>{o.etiqueta.match(/ (on .*)$/)?.[1]}</small>
                </>
              )}
            </button>
          ))}
          <hr />
          <button
            type="button"
            role="option"
            aria-selected={custom}
            onClick={() => {
              setCustom(true)
              setMenu(false)
              if (!valor) cambiar({ regla, fin })
            }}
          >
            Custom…
          </button>
        </div>
      )}

      {custom && valor && (
        <div className="v-repetir-custom" aria-label="Custom repeat">
          <div className="grupo">
            <span className="v-sub">Every</span>
            <input
              type="number"
              min={1}
              max={99}
              className="v-campo chico"
              aria-label="Every how many"
              value={regla.cada}
              onChange={(e) => poner({ cada: Math.max(1, Math.min(99, Number(e.target.value) || 1)) })}
            />
            <select
              className="v-campo chico"
              aria-label="Unit"
              value={regla.freq}
              onChange={(e) => {
                const freq = e.target.value as Regla['freq']
                poner({ freq, dias: freq === 'semana' ? (regla.dias ?? [diaSemana(fecha)]) : undefined, mes: freq === 'mes' ? (regla.mes ?? 'dia') : undefined })
              }}
            >
              {UNIDADES.map((u) => (
                <option key={u.freq} value={u.freq}>
                  {regla.cada === 1 ? u.uno : u.varios}
                </option>
              ))}
            </select>
          </div>

          {regla.freq === 'semana' && (
            <div className="grupo v-repetir-dias" aria-label="On days">
              {NOMBRE_DIA.map((n, d) => {
                const dias = regla.dias ?? [diaSemana(fecha)]
                const activo = dias.includes(d)
                return (
                  <button
                    key={n}
                    type="button"
                    aria-pressed={activo}
                    aria-label={n}
                    // Siempre queda al menos un día.
                    onClick={() => poner({ dias: activo ? (dias.length > 1 ? dias.filter((x) => x !== d) : dias) : [...dias, d] })}
                  >
                    {n.charAt(0)}
                  </button>
                )
              })}
            </div>
          )}

          {regla.freq === 'mes' && (
            <div className="grupo">
              {(['dia', 'posicion'] as const).map((m) => (
                <button key={m} type="button" className="v-boton chico" aria-pressed={(regla.mes ?? 'dia') === m} onClick={() => poner({ mes: m })}>
                  {etiquetaRegla({ freq: 'mes', cada: 1, mes: m }, fecha).replace('Every month ', '')}
                </button>
              ))}
            </div>
          )}

          <span className="etq">Ends</span>
          <div className="grupo">
            <button type="button" className="v-boton chico" aria-pressed={terminacion === 'nunca'} onClick={() => poner({}, { hasta: null, conteo: null })}>
              Never
            </button>
            <button type="button" className="v-boton chico" aria-pressed={terminacion === 'fecha'} onClick={() => poner({}, { hasta: fin.hasta ?? fecha, conteo: null })}>
              On date
            </button>
            <button type="button" className="v-boton chico" aria-pressed={terminacion === 'veces'} onClick={() => poner({}, { hasta: null, conteo: fin.conteo ?? 10 })}>
              After
            </button>
            {terminacion === 'fecha' && (
              <input type="date" className="v-campo chico" aria-label="Ends on" min={fecha} value={fin.hasta ?? ''} onChange={(e) => poner({}, { hasta: e.target.value || null })} />
            )}
            {terminacion === 'veces' && (
              <>
                <input
                  type="number"
                  min={1}
                  max={1000}
                  className="v-campo chico"
                  aria-label="Times"
                  value={fin.conteo ?? 10}
                  onChange={(e) => poner({}, { conteo: Math.max(1, Math.min(1000, Number(e.target.value) || 1)) })}
                />
                <span className="v-sub">times</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
