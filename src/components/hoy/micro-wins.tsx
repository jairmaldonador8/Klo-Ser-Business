'use client'

import { startTransition, useOptimistic, useState } from 'react'
import { borrarMicroWin, crearMicroWin, marcarMicroWin } from '@/app/(app)/hoy/acciones'
import { useHoja } from '@/components/hoja/hoja-provider'
import { useToast } from '@/components/tareas/toast'

export type MicroWin = { id: string; nombre: string; hecho: boolean }

type Cambio = { tipo: 'marcar'; id: string; hecho: boolean } | { tipo: 'quitar'; id: string } | { tipo: 'agregar'; nombre: string }

/** Los hábitos del día: se palomean con un toque y mañana amanecen vacíos. «Edit» deja agregar y quitar. */
export function MicroWins({ inicial }: { inicial: MicroWin[] }) {
  const avisar = useToast()
  const [editando, setEditando] = useState(false)
  const [nuevo, setNuevo] = useState('')
  const [lista, cambiar] = useOptimistic(inicial, (l: MicroWin[], c: Cambio) => {
    if (c.tipo === 'marcar') return l.map((x) => (x.id === c.id ? { ...x, hecho: c.hecho } : x))
    if (c.tipo === 'quitar') return l.filter((x) => x.id !== c.id)
    return [...l, { id: `nuevo-${c.nombre}`, nombre: c.nombre, hecho: false }]
  })

  const correr = (c: Cambio, accion: () => Promise<{ ok: boolean; mensaje?: string }>) =>
    startTransition(async () => {
      cambiar(c)
      const r = await accion()
      if (!r.ok && r.mensaje) avisar(r.mensaje)
    })

  function agregar(e: React.FormEvent) {
    e.preventDefault()
    const nombre = nuevo.trim()
    if (!nombre) return
    setNuevo('')
    correr({ tipo: 'agregar', nombre }, () => crearMicroWin(nombre))
  }

  const hechos = lista.filter((x) => x.hecho).length

  return (
    <div className="v-microwins">
      <div className="v-fila">
        <span className="etq">
          Micro wins{lista.length > 0 && <b> · {hechos}/{lista.length}</b>}
        </span>
        <button type="button" className="v-mini" onClick={() => setEditando((x) => !x)} aria-pressed={editando}>
          {editando ? 'Done' : lista.length ? 'Edit' : '+ Add'}
        </button>
      </div>
      {lista.length === 0 && !editando && <p className="v-sub">Daily habits that reset every morning: wake up early, train, read…</p>}
      <div className="v-chips">
        {lista.map((m) =>
          editando ? (
            <span key={m.id} className="v-microwin editando">
              {m.nombre}
              <button type="button" aria-label={`Remove ${m.nombre}`} onClick={() => correr({ tipo: 'quitar', id: m.id }, () => borrarMicroWin(m.id))}>
                ×
              </button>
            </span>
          ) : (
            <button
              key={m.id}
              type="button"
              className="v-microwin"
              aria-pressed={m.hecho}
              disabled={m.id.startsWith('nuevo-')}
              onClick={() => correr({ tipo: 'marcar', id: m.id, hecho: !m.hecho }, () => marcarMicroWin(m.id, !m.hecho))}
            >
              <i aria-hidden />
              {m.nombre}
            </button>
          ),
        )}
        {editando && (
          <form onSubmit={agregar} className="v-microwin-nuevo">
            <input className="v-campo" maxLength={40} autoFocus placeholder="New micro win" aria-label="New micro win" value={nuevo} onChange={(e) => setNuevo(e.target.value)} />
            <button type="submit" className="v-mini" disabled={!nuevo.trim()}>
              Add
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

/** «+ Add task»: abre la hoja con fecha de hoy (y el frente abierto, si hay). */
export function AgregarTareaHoy({ espacioId }: { espacioId?: string }) {
  const abrir = useHoja()
  return (
    <button type="button" className="v-mini" onClick={() => abrir({ valores: espacioId ? { espacio_id: espacioId } : {} })}>
      + Add task
    </button>
  )
}
