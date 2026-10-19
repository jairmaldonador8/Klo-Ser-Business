'use client'

import { useState, useTransition } from 'react'
import { CLASES, limpiarActividades, MAX_ACTIVIDAD, MAX_ACTIVIDADES, NOMBRE_CLASE } from '@/lib/tareas/esquema'
import { guardarActividades } from './acciones'

/** Las actividades de una tarea: las de siempre y las tuyas (agregar y quitar). */
export function TusActividades({ actividades: iniciales }: { actividades: string[] }) {
  const [propias, setPropias] = useState(iniciales)
  const [nueva, setNueva] = useState('')
  const [aviso, setAviso] = useState('')
  const [, empezar] = useTransition()

  function guardar(lista: string[]) {
    const antes = propias
    setPropias(lista)
    setAviso('Saving…')
    empezar(async () => {
      const r = await guardarActividades(lista)
      if (!r.ok) setPropias(antes)
      setAviso(r.ok ? 'Saved' : r.mensaje)
    })
  }

  function agregar(e: React.FormEvent) {
    e.preventDefault()
    const lista = limpiarActividades([...propias, nueva])
    setNueva('')
    if (lista.length === propias.length) return setAviso('That activity already exists.')
    guardar(lista)
  }

  return (
    <section className="v-t c2" aria-label="Activities">
      <h3>Activities</h3>
      <p className="v-sub">What kind of thing each task is. Add your own, like a client or a routine.</p>
      <div className="v-actividades">
        {CLASES.map((c) => (
          <span key={c} className="v-chip">
            {NOMBRE_CLASE[c]}
          </span>
        ))}
        {propias.map((a) => (
          <span key={a} className="v-chip propia">
            {a}
            <button type="button" aria-label={`Remove ${a}`} onClick={() => guardar(propias.filter((x) => x !== a))}>
              ×
            </button>
          </span>
        ))}
      </div>
      {propias.length < MAX_ACTIVIDADES && (
        <form className="v-fila" style={{ justifyContent: 'flex-start' }} onSubmit={agregar}>
          <input
            className="v-campo"
            maxLength={MAX_ACTIVIDAD}
            placeholder="New activity"
            aria-label="New activity"
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
          />
          <button type="submit" className="v-boton chico" disabled={!nueva.trim()}>
            Add
          </button>
        </form>
      )}
      <p className="v-aviso" role="status">
        {aviso}
      </p>
    </section>
  )
}
