'use client'

import {
  Archive,
  ArrowRight,
  ArrowUp,
  Bell,
  Brain,
  Check,
  FolderPlus,
  Pause,
  PenLine,
  Play,
  Plus,
  Repeat,
  RotateCcw,
  Sparkles,
  StickyNote,
  Trash2,
  Undo2,
  X,
  type LucideIcon,
} from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { RespuestaKlo } from '@/app/api/klo/route'

type Mensaje =
  | { tipo: 'tu'; texto: string }
  | { tipo: 'klo'; id: string | null; texto: string; acciones: string[]; pendientes: string[]; deshecho?: boolean; resuelto?: 'si' | 'no' }

const BORRADOR = 'klo-borrador'
const leerBorrador = () => {
  try {
    return localStorage.getItem(BORRADOR) ?? ''
  } catch {
    return ''
  }
}
const guardarBorrador = (texto: string) => {
  try {
    if (texto) localStorage.setItem(BORRADOR, texto)
    else localStorage.removeItem(BORRADOR)
  } catch {
    // Sin almacenamiento (modo privado): el borrador solo vive mientras el panel está abierto.
  }
}

async function enviarJson<T>(url: string, cuerpo: object): Promise<T> {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) })
  const datos = await r.json().catch(() => null)
  if (!r.ok || !datos) throw new Error(datos?.mensaje ?? 'Klo couldn’t answer, try again.')
  return datos as T
}

// Cada chip llega como «Verbo · detalle»; el verbo decide el ícono.
const ICONOS: Record<string, LucideIcon> = {
  Added: Plus,
  Moved: ArrowRight,
  Edited: PenLine,
  'Edited project': PenLine,
  Done: Check,
  Reopened: RotateCcw,
  Deleted: Trash2,
  Delete: Trash2,
  Note: StickyNote,
  Reminder: Bell,
  Remembered: Brain,
  'New project': FolderPlus,
  Project: FolderPlus,
  Paused: Pause,
  Archived: Archive,
  Reactivated: Play,
  'Stopped repeating': Repeat,
  'Stop repeating': Repeat,
  Add: Plus,
  Move: ArrowRight,
  Edit: PenLine,
}

function partir(chip: string) {
  const [verbo, ...resto] = chip.split(' · ')
  return { verbo, detalle: resto.join(' · '), Icono: ICONOS[verbo] ?? Sparkles }
}

/** Ms por palabra al «escribir» la respuesta; las acciones entran cuando termina. */
const PASO = 22
const TOPE = 1600
const retraso = (palabras: number) => Math.min(palabras * PASO, TOPE)

function Acciones({ chips, desde, tachadas }: { chips: string[]; desde: number; tachadas?: boolean }) {
  return (
    <ul className="klo-acciones" data-tachadas={tachadas || undefined}>
      {chips.map((c, n) => {
        const { verbo, detalle, Icono } = partir(c)
        return (
          <li key={n} style={{ '--d': `${desde + n * 70}ms` } as CSSProperties}>
            <span className="klo-icono" aria-hidden>
              <Icono size={14} strokeWidth={2.2} />
            </span>
            <span className="klo-accion">
              <b>{verbo}</b>
              {detalle && <span>{detalle}</span>}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

/** La respuesta aparece palabra por palabra (solo al llegar: después ya está montada). */
function Escrito({ texto }: { texto: string }) {
  const palabras = texto.split(/(\s+)/)
  let i = 0
  return (
    <p className="klo-escrito">
      {palabras.map((p, n) => (/^\s+$/.test(p) ? p : <span key={n} style={{ '--i': i++ } as CSSProperties}>{p}</span>))}
    </p>
  )
}

function Orbe({ grande, vivo }: { grande?: boolean; vivo?: boolean }) {
  return (
    <span className="klo-orbe" data-grande={grande || undefined} data-vivo={vivo || undefined} aria-hidden>
      <Image src="/marca/azul/02-gallo-completo.svg" alt="" width={grande ? 30 : 16} height={grande ? 35 : 19} unoptimized />
    </span>
  )
}

export function PanelKlo({ abierto, cerrar, nombre }: { abierto: boolean; cerrar: () => void; nombre?: string | null }) {
  const router = useRouter()
  const [sesion] = useState(() => crypto.randomUUID())
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [texto, setTexto] = useState('')
  const [pensando, setPensando] = useState(false)
  const [falla, setFalla] = useState<string | null>(null)
  const campo = useRef<HTMLTextAreaElement>(null)
  const lista = useRef<HTMLDivElement>(null)
  const primerNombre = nombre?.trim().split(/\s+/)[0]

  useEffect(() => {
    if (!abierto) return
    campo.current?.focus()
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && cerrar()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [abierto, cerrar])
  useEffect(() => {
    lista.current?.scrollTo({ top: lista.current.scrollHeight, behavior: 'smooth' })
  }, [mensajes, pensando])

  const cambiar = (i: number, cambio: Partial<Extract<Mensaje, { tipo: 'klo' }>>) =>
    setMensajes((ms) => ms.map((m, n) => (n === i && m.tipo === 'klo' ? { ...m, ...cambio } : m)))

  async function enviar() {
    const limpio = texto.trim()
    if (!limpio || pensando) return
    if (!navigator.onLine) {
      setFalla('You’re offline — your message is still here.')
      return
    }
    setFalla(null)
    setPensando(true)
    setMensajes((ms) => [...ms, { tipo: 'tu', texto: limpio }])
    setTexto('')
    guardarBorrador('')
    try {
      const r = await enviarJson<RespuestaKlo>('/api/klo', { texto: limpio, sesion })
      setMensajes((ms) => [...ms, { tipo: 'klo', id: r.id, texto: r.respuesta, acciones: r.acciones, pendientes: r.pendientes }])
      if (r.acciones.length || r.caida) router.refresh()
    } catch (e) {
      // No se perdió: el texto regresa al campo.
      setMensajes((ms) => ms.slice(0, -1))
      setTexto(limpio)
      guardarBorrador(limpio)
      setFalla(e instanceof Error ? e.message : 'Klo couldn’t answer, try again.')
    } finally {
      setPensando(false)
    }
  }

  async function deshacer(i: number, id: string) {
    try {
      await enviarJson('/api/klo/deshacer', { id })
      cambiar(i, { deshecho: true })
      router.refresh()
    } catch (e) {
      setFalla(e instanceof Error ? e.message : 'Couldn’t undo it.')
    }
  }

  async function confirmar(i: number, id: string, aceptar: boolean) {
    try {
      const r = await enviarJson<{ acciones: string[] }>('/api/klo/confirmar', { id, aceptar })
      setMensajes((ms) =>
        ms.map((m, n) => (n === i && m.tipo === 'klo' ? { ...m, acciones: [...m.acciones, ...r.acciones], resuelto: aceptar ? 'si' : 'no' } : m)),
      )
      if (aceptar) router.refresh()
    } catch (e) {
      setFalla(e instanceof Error ? e.message : 'Couldn’t do it.')
    }
  }

  return (
    <div className="klo-capa" data-abierto={abierto || undefined} aria-hidden={!abierto}>
      <button type="button" className="klo-velo" aria-label="Close Klo" tabIndex={-1} onClick={cerrar} />
      <section className="klo-panel" role="dialog" aria-modal="true" aria-label="Klo" data-pensando={pensando || undefined}>
        <header className="klo-cabeza">
          <Orbe vivo={pensando} />
          <div className="klo-quien">
            <b>Klo</b>
            <small aria-live="polite">
              <i className="klo-punto" aria-hidden />
              {pensando ? <span className="klo-brillo">Working on it</span> : 'Ready'}
            </small>
          </div>
          <button type="button" className="klo-cerrar" onClick={cerrar} aria-label="Close">
            <kbd>esc</kbd>
          </button>
        </header>

        <div className="klo-lista" ref={lista}>
          {!mensajes.length && (
            <div className="klo-vacio">
              <Orbe grande vivo={pensando} />
              <h2>{primerNombre ? `Hey ${primerNombre}, what are we moving forward?` : 'What are we moving forward?'}</h2>
              <p>Write it the way you’d say it — tasks, routines, projects, reminders, or a question about your week. I’ll handle the rest.</p>
            </div>
          )}
          {mensajes.map((m, i) => {
            if (m.tipo === 'tu')
              return (
                <p key={i} className="klo-tu">
                  {m.texto}
                </p>
              )
            const tras = retraso(m.texto.split(/\s+/).length) + 120
            return (
              <div key={i} className="klo-dice">
                <Orbe />
                <div className="klo-cuerpo">
                  <Escrito texto={m.texto} />
                  {m.acciones.length > 0 && <Acciones chips={m.acciones} desde={m.resuelto ? 0 : tras} tachadas={m.deshecho} />}
                  {m.pendientes.length > 0 && !m.resuelto && m.id && (
                    <div className="klo-espera" style={{ '--d': `${tras + m.acciones.length * 70}ms` } as CSSProperties}>
                      <small>
                        <i className="klo-punto" aria-hidden />
                        Needs your OK
                      </small>
                      <Acciones chips={m.pendientes} desde={0} />
                      <div className="klo-botones">
                        <button type="button" className="klo-si" onClick={() => confirmar(i, m.id!, true)}>
                          <Check size={14} strokeWidth={2.5} aria-hidden />
                          Confirm
                        </button>
                        <button type="button" className="klo-no" onClick={() => confirmar(i, m.id!, false)}>
                          <X size={14} strokeWidth={2.5} aria-hidden />
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                  {m.resuelto === 'no' && <small className="klo-nota">Cancelled — nothing changed.</small>}
                  {m.acciones.length > 0 && m.id && (
                    <button
                      type="button"
                      className="klo-deshacer"
                      style={{ '--d': `${tras + m.acciones.length * 70}ms` } as CSSProperties}
                      disabled={m.deshecho}
                      onClick={() => deshacer(i, m.id!)}
                    >
                      <Undo2 size={13} aria-hidden />
                      {m.deshecho ? 'Undone' : 'Undo'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
          {pensando && (
            <div className="klo-pensando" aria-label="Klo is thinking">
              <Orbe vivo />
              <span className="klo-brillo">Thinking</span>
              <span className="klo-puntos" aria-hidden>
                <i />
                <i />
                <i />
              </span>
            </div>
          )}
        </div>

        {falla && (
          <p className="klo-falla" role="alert">
            {falla}
          </p>
        )}
        <form
          className="klo-escribir"
          onSubmit={(e) => {
            e.preventDefault()
            enviar()
          }}
        >
          <textarea
            ref={campo}
            rows={1}
            value={texto}
            placeholder="Tell Klo anything…"
            aria-label="Message for Klo"
            enterKeyHint="send"
            // El borrador guardado regresa al enfocar (abrir el panel enfoca el campo).
            onFocus={() => !texto && setTexto(leerBorrador())}
            onChange={(e) => {
              setTexto(e.target.value)
              guardarBorrador(e.target.value)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                enviar()
              }
            }}
          />
          <div className="klo-pie">
            <small>
              <kbd>↵</kbd> send <kbd>⇧↵</kbd> new line
            </small>
            <button type="submit" className="klo-enviar" disabled={!texto.trim() || pensando} aria-label="Send">
              <ArrowUp size={17} strokeWidth={2.5} aria-hidden />
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
