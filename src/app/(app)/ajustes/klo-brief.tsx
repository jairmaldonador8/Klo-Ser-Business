'use client'

import { useState, useTransition } from 'react'
import { costoUsd, formatoTokens, formatoUsd, tokensTotales, type Gasto } from '@/lib/klo/costo'
import { MAX_BRIEF } from '@/lib/klo/sistema'
import { borrarMemoria, guardarBrief } from './acciones'

const GUIA = `Who you are and what you run (e.g. founder of Klo-Ser, partner at Top Digital).
Your priorities this quarter.
Key people: clients, team, family — and how Klo should treat them.
How you like to work: focus hours, meetings only in the afternoon, gym at 7 am…`

type Memoria = { id: string; texto: string }

/** Lo que Klo sabe de ti: el brief que escribes y lo que fue recordando (lo puedes borrar). */
export function KloBrief({ brief: inicial, memoria: memoriaInicial, uso }: { brief: string; memoria: Memoria[]; uso: { hoy: Gasto; mes: Gasto } }) {
  const [brief, setBrief] = useState(inicial)
  const [memoria, setMemoria] = useState(memoriaInicial)
  const [aviso, setAviso] = useState('')
  const [, empezar] = useTransition()

  function guardar() {
    if (brief === inicial) return
    setAviso('Saving…')
    empezar(async () => {
      const r = await guardarBrief(brief)
      setAviso(r.ok ? 'Saved — Klo will use it from your next message.' : r.mensaje)
    })
  }

  function olvidar(m: Memoria) {
    setMemoria((ms) => ms.filter((x) => x.id !== m.id))
    empezar(async () => {
      const r = await borrarMemoria(m.id)
      if (!r.ok) {
        setMemoria((ms) => [...ms, m])
        setAviso(r.mensaje)
      }
    })
  }

  return (
    <section className="v-t c2" aria-label="Klo's brief">
      <h3>Klo’s brief</h3>
      <p className="v-sub">Tell Klo who you are and how you work. It reads this before every answer.</p>
      <textarea
        className="v-campo"
        rows={7}
        maxLength={MAX_BRIEF}
        placeholder={GUIA}
        aria-label="Klo's brief"
        value={brief}
        onChange={(e) => setBrief(e.target.value)}
        onBlur={guardar}
        style={{ resize: 'vertical', minHeight: 140, lineHeight: 1.5 }}
      />
      <div className="v-fila">
        <small className="v-sub">
          {brief.length}/{MAX_BRIEF}
        </small>
        <button type="button" className="v-boton chico" onClick={guardar} disabled={brief === inicial}>
          Save
        </button>
      </div>
      <h4 className="v-sub" style={{ marginTop: 6 }}>
        What Klo remembers
      </h4>
      {memoria.length ? (
        <ul className="klo-memoria">
          {memoria.map((m) => (
            <li key={m.id}>
              <span>{m.texto}</span>
              <button type="button" aria-label={`Forget: ${m.texto}`} onClick={() => olvidar(m)}>
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="v-sub">Nothing yet. Klo saves facts it learns as you talk.</p>
      )}
      <h4 className="v-sub" style={{ marginTop: 6 }}>
        Klo usage
      </h4>
      <dl className="klo-uso">
        {([['Today', uso.hoy], ['This month', uso.mes]] as const).map(([etiqueta, g]) => (
          <div key={etiqueta}>
            <dt>{etiqueta}</dt>
            <dd>
              <strong>{formatoUsd(costoUsd(g))}</strong> · {g.mensajes} {g.mensajes === 1 ? 'reply' : 'replies'} · {formatoTokens(tokensTotales(g))} tokens
            </dd>
          </div>
        ))}
      </dl>
      <p className="v-aviso" role="status">
        {aviso}
      </p>
    </section>
  )
}
