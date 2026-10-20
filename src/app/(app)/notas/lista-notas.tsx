'use client'

import { ArrowRight, Check, Flag, PenLine, Trash2 } from 'lucide-react'
import { useState, useTransition } from 'react'
import { useHoja } from '@/components/hoja/hoja-provider'
import { useToast } from '@/components/tareas/toast'
import type { FrenteVista } from '@/lib/frentes'
import { agruparPorDia } from '@/lib/notas/dias'
import { borrarNota, crearNota, editarNota, marcarPosible } from './acciones'

const LARGO_TITULO = 200

export type NotaVista = {
  id: string
  espacio_id: string
  texto: string
  /** «4:12 PM», en tu zona. */
  hora: string
  /** AAAA-MM-DD en tu zona, y cómo se llama ese día («Today», «Yesterday», «Sun, Oct 18»). */
  dia: string
  etiqueta: string
  /** Marcada como «Maybe task». */
  posible: boolean
  /** Ya se volvió task: se queda en su día, marcada. */
  tarea: boolean
}

type Props = { notas: NotaVista[]; frentes: FrenteVista[]; abierto: string | null; hoy: string; children?: React.ReactNode }

const fechaLarga = (dia: string) =>
  new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'long', month: 'long', day: 'numeric' }).format(new Date(`${dia}T12:00:00Z`))

/** Notas como bitácora: capturas arriba, y abajo una página por día. «Maybe task» marca las que podrían volverse task. */
export function ListaNotas({ notas, frentes, abierto, hoy, children }: Props) {
  const abrir = useHoja()
  const avisar = useToast()
  const [texto, setTexto] = useState('')
  const [espacio, setEspacio] = useState(abierto ?? frentes[0]?.id ?? '')
  const [posibleNueva, setPosibleNueva] = useState(false)
  const [error, setError] = useState('')
  const [editando, setEditando] = useState<string | null>(null)
  const [soloPosibles, setSoloPosibles] = useState(false)
  // Marcas al momento, antes de que conteste el servidor.
  const [marcas, setMarcas] = useState<Record<string, boolean>>({})
  const [, empezar] = useTransition()
  const frenteDe = new Map(frentes.map((f) => [f.id, f]))

  const esPosible = (n: NotaVista) => marcas[n.id] ?? n.posible
  const posibles = notas.filter((n) => esPosible(n) && !n.tarea)
  const grupos = agruparPorDia(soloPosibles ? posibles : notas)

  function guardar() {
    if (!texto.trim() || !espacio) return
    const escrito = texto
    const marcada = posibleNueva
    setError('')
    setTexto('')
    setPosibleNueva(false)
    empezar(async () => {
      const r = await crearNota(espacio, escrito, marcada)
      if (!r.ok) {
        setTexto(escrito)
        setPosibleNueva(marcada)
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

  function marcar(n: NotaVista) {
    const nueva = !esPosible(n)
    setMarcas((m) => ({ ...m, [n.id]: nueva }))
    empezar(async () => {
      const r = await marcarPosible(n.id, nueva)
      if (!r.ok) {
        setMarcas((m) => ({ ...m, [n.id]: !nueva }))
        avisar(r.mensaje)
      }
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
    <div className="notas">
      <div className="notas-captura">
        <textarea
          rows={2}
          maxLength={4000}
          placeholder="What’s on your mind?"
          aria-label="New note"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === 'Enter' && guardar()}
        />
        <div className="notas-captura-pie">
          {!abierto && frentes.length > 1 && (
            <select className="v-campo" aria-label="Note space" value={espacio} onChange={(e) => setEspacio(e.target.value)}>
              {frentes.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nombre}
                </option>
              ))}
            </select>
          )}
          <button type="button" className="nota-bandera" aria-pressed={posibleNueva} onClick={() => setPosibleNueva((v) => !v)}>
            <Flag size={14} aria-hidden />
            Maybe task
          </button>
          <small className="notas-atajo">Ctrl + Enter</small>
          <button type="button" className="notas-guardar" disabled={!texto.trim()} onClick={guardar}>
            Save note
          </button>
        </div>
        {error && (
          <p className="v-aviso" role="alert">
            {error}
          </p>
        )}
      </div>

      {notas.length > 0 && (
        <div className="notas-filtros" role="group" aria-label="Show">
          <button type="button" aria-pressed={!soloPosibles} onClick={() => setSoloPosibles(false)}>
            All <span>{notas.length}</span>
          </button>
          <button type="button" aria-pressed={soloPosibles} onClick={() => setSoloPosibles(true)}>
            <Flag size={13} aria-hidden />
            Maybe tasks <span>{posibles.length}</span>
          </button>
        </div>
      )}

      {soloPosibles && posibles.length === 0 && <p className="notas-nada">Nothing flagged yet. Tap the flag on a note that might become a task.</p>}

      {grupos.map((g) => (
        <section key={g.dia} className="notas-dia" aria-label={g.etiqueta}>
          <header>
            <h3>{g.etiqueta}</h3>
            <small>
              {g.dia === hoy || g.etiqueta === 'Yesterday' ? `${fechaLarga(g.dia)} · ` : ''}
              {g.notas.length} {g.notas.length === 1 ? 'note' : 'notes'}
            </small>
          </header>
          <ol className="notas-linea">
            {g.notas.map((n) => {
              const f = frenteDe.get(n.espacio_id)
              const posible = esPosible(n)
              return (
                <li key={n.id} className="nota" data-posible={(posible && !n.tarea) || undefined} data-tarea={n.tarea || undefined}>
                  <div className="nota-meta">
                    <time>{n.hora}</time>
                    {f && !abierto && (
                      <span className="nota-espacio">
                        <i className={`v-inicial v-color-${f.color}`} aria-hidden>
                          {f.inicial}
                        </i>
                        {f.nombre}
                      </span>
                    )}
                    {n.tarea ? (
                      <span className="nota-pildora hecha">
                        <Check size={12} aria-hidden />
                        Became a task
                      </span>
                    ) : (
                      posible && (
                        <span className="nota-pildora">
                          <Flag size={11} aria-hidden />
                          Maybe task
                        </span>
                      )
                    )}
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
                  <div className="nota-acciones">
                    {!n.tarea && (
                      <>
                        <button type="button" className="nota-bandera" aria-pressed={posible} aria-label={posible ? 'Unflag maybe task' : 'Flag as maybe task'} onClick={() => marcar(n)}>
                          <Flag size={13} aria-hidden />
                        </button>
                        <button type="button" className="nota-hacer" onClick={() => volverTarea(n)}>
                          Make it a task
                          <ArrowRight size={13} aria-hidden />
                        </button>
                      </>
                    )}
                    <button type="button" aria-label="Edit" onClick={() => setEditando(n.id)}>
                      <PenLine size={13} aria-hidden />
                    </button>
                    <button type="button" aria-label="Delete" onClick={() => borrar(n)}>
                      <Trash2 size={13} aria-hidden />
                    </button>
                  </div>
                </li>
              )
            })}
          </ol>
        </section>
      ))}
      {children}
    </div>
  )
}
