'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
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

export function PanelKlo({ abierto, cerrar }: { abierto: boolean; cerrar: () => void }) {
  const router = useRouter()
  const [sesion] = useState(() => crypto.randomUUID())
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [texto, setTexto] = useState('')
  const [pensando, setPensando] = useState(false)
  const [falla, setFalla] = useState<string | null>(null)
  const campo = useRef<HTMLTextAreaElement>(null)
  const lista = useRef<HTMLDivElement>(null)

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
      <section className="klo-panel" role="dialog" aria-modal="true" aria-label="Klo">
        <header className="klo-cabeza">
          <Image src="/marca/azul/02-gallo-completo.svg" alt="" width={22} height={26} unoptimized />
          <b>Klo</b>
          <small>{pensando ? 'thinking…' : 'your partner'}</small>
          <button type="button" className="klo-cerrar" onClick={cerrar} aria-label="Close">
            esc
          </button>
        </header>

        <div className="klo-lista" ref={lista}>
          {!mensajes.length && (
            <div className="klo-vacio">
              <p>Tell me what you need. Just write it — add, move or check off tasks, set up routines and projects, reminders, or ask what’s coming.</p>
            </div>
          )}
          {mensajes.map((m, i) =>
            m.tipo === 'tu' ? (
              <p key={i} className="klo-tu">
                {m.texto}
              </p>
            ) : (
              <div key={i} className="klo-dice" data-deshecho={m.deshecho || undefined}>
                <p>{m.texto}</p>
                {m.acciones.length > 0 && (
                  <ul className="klo-chips">
                    {m.acciones.map((a, n) => (
                      <li key={n}>{a}</li>
                    ))}
                  </ul>
                )}
                {m.pendientes.length > 0 && !m.resuelto && m.id && (
                  <div className="klo-espera">
                    <small>Needs your OK</small>
                    <ul className="klo-chips">
                      {m.pendientes.map((p, n) => (
                        <li key={n}>{p}</li>
                      ))}
                    </ul>
                    <div>
                      <button type="button" className="v-boton" onClick={() => confirmar(i, m.id!, true)}>
                        Confirm
                      </button>
                      <button type="button" className="klo-texto" onClick={() => confirmar(i, m.id!, false)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                {m.resuelto === 'no' && <small className="klo-nota">Cancelled.</small>}
                {m.acciones.length > 0 && m.id && (
                  <button type="button" className="klo-texto" disabled={m.deshecho} onClick={() => deshacer(i, m.id!)}>
                    {m.deshecho ? 'Undone' : 'Undo'}
                  </button>
                )}
              </div>
            ),
          )}
          {pensando && (
            <div className="klo-pensando" aria-label="Klo is thinking">
              <i />
              <i />
              <i />
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
          <span className="v-orbe" aria-hidden />
          <textarea
            ref={campo}
            rows={1}
            value={texto}
            placeholder="Tell Klo…"
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
          <button type="submit" className="klo-enviar" disabled={!texto.trim() || pensando} aria-label="Send">
            ↑
          </button>
        </form>
      </section>
    </div>
  )
}
