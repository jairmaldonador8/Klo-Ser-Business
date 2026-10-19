'use client'

import { useState, useTransition } from 'react'
import { useHoja } from '@/components/hoja/hoja-provider'
import { useToast } from '@/components/tareas/toast'
import type { FrenteVista } from '@/lib/frentes'
import { borrarNota, crearNota, editarNota } from './acciones'

const LARGO_TITULO = 200

export type NotaVista = { id: string; espacio_id: string; texto: string; fecha: string }

type Props = { notas: NotaVista[]; frentes: FrenteVista[]; abierto: string | null; children?: React.ReactNode }

export function ListaNotas({ notas, frentes, abierto, children }: Props) {
  const abrir = useHoja()
  const avisar = useToast()
  const [texto, setTexto] = useState('')
  const [espacio, setEspacio] = useState(abierto ?? frentes[0]?.id ?? '')
  const [error, setError] = useState('')
  const [editando, setEditando] = useState<string | null>(null)
  const [, empezar] = useTransition()
  const frenteDe = new Map(frentes.map((f) => [f.id, f]))

  function guardar() {
    if (!texto.trim() || !espacio) return
    const escrito = texto
    setError('')
    setTexto('')
    empezar(async () => {
      const r = await crearNota(espacio, escrito)
      if (!r.ok) {
        setTexto(escrito)
        setError(r.mensaje)
      }
    })
  }

  function guardarEdicion(n: NotaVista, nuevo: string) {
    setEditando(null)
    if (nuevo.trim() === n.texto) return
    empezar(async () => {
      const r = await editarNota(n.id, nuevo)
      if (!r.ok) avisar(r.mensaje)
    })
  }

  function borrar(n: NotaVista) {
    empezar(async () => {
      const r = await borrarNota(n.id)
      if (!r.ok) return avisar(r.mensaje)
      // Si el Deshacer falla, te lo decimos: antes se perdía en silencio.
      avisar('Note deleted', () =>
        empezar(async () => {
          const d = await borrarNota(n.id, false)
          if (!d.ok) avisar(d.mensaje)
        }),
      )
    })
  }

  // El título de una tarea llega a 200 letras: cortarla en silencio perdería parte de la idea.
  function volverTarea(n: NotaVista) {
    const titulo = n.texto.trim()
    if (titulo.length > LARGO_TITULO) return avisar('This note is long: trim it to 200 characters to make it a task.')
    abrir({ valores: { titulo, espacio_id: n.espacio_id }, notaId: n.id })
  }

  return (
    <>
      <div className="v-t c2">
        <textarea
          className="v-campo"
          rows={3}
          maxLength={4000}
          placeholder="Write an idea…"
          aria-label="New note"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === 'Enter' && guardar()}
        />
        <div className="v-fila" style={{ marginTop: 10 }}>
          {!abierto && frentes.length > 1 ? (
            <select className="v-campo" style={{ flex: '0 1 200px' }} aria-label="Note space" value={espacio} onChange={(e) => setEspacio(e.target.value)}>
              {frentes.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nombre}
                </option>
              ))}
            </select>
          ) : (
            <span />
          )}
          <button type="button" className="v-boton primario chico" disabled={!texto.trim()} onClick={guardar}>
            Save note
          </button>
        </div>
        {error && (
          <p className="v-aviso" role="alert">
            {error}
          </p>
        )}
      </div>

      {notas.map((n) => {
        const f = frenteDe.get(n.espacio_id)
        return (
          <article key={n.id} className="v-t v-nota c2">
            <div className="v-fila" style={{ justifyContent: 'flex-start' }}>
              {f && (
                <span className={`v-foto v-color-${f.color}`} style={{ width: 24, height: 24, fontSize: 12, borderRadius: 8 }} title={f.nombre}>
                  {f.inicial}
                </span>
              )}
              <span className="v-sub">{n.fecha}</span>
            </div>
            {editando === n.id ? (
              <textarea
                className="v-campo"
                rows={4}
                maxLength={4000}
                autoFocus
                defaultValue={n.texto}
                aria-label="Edit note"
                onBlur={(e) => guardarEdicion(n, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setEditando(null)
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') e.currentTarget.blur()
                }}
              />
            ) : (
              <p>{n.texto}</p>
            )}
            <div className="acciones">
              <button type="button" className="v-boton chico" onClick={() => setEditando(n.id)}>
                Edit
              </button>
              <button type="button" className="v-boton chico" onClick={() => borrar(n)}>
                Delete
              </button>
              <button
                type="button"
                className="v-boton chico"
                onClick={() => volverTarea(n)}
              >
                Make it a task
              </button>
            </div>
          </article>
        )
      })}
      {children && <div className="c2">{children}</div>}
    </>
  )
}
