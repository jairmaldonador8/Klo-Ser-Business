'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { EVENTO_FESTEJO, escucharToques, type Caja, type DetalleFestejo } from '@/lib/festejo'
import { KloCabeza, KloGallo, NotaMano } from '@/components/marca/klo'

/** Lo que dura cada momento (igual que las animaciones de globals.css, «Klo festeja»). */
const ASOMA_MS = 1100
const CANTA_MS = 3200
/** Klo no cabe en menos: un renglón bajito se agranda hacia arriba y a la izquierda. */
const MINIMO = 48

type Asomo = { id: number; caja: Caja | null }

/**
 * Pinta los festejos de Klo (ver `lib/festejo.ts`). Va una vez en cada
 * layout. Todo es adorno: `pointer-events-none`, fuera del flujo, y con
 * movimiento reducido no se pinta nada (la palomita ya dice que quedó).
 */
export function KloFesteja() {
  const [asomos, setAsomos] = useState<Asomo[]>([])
  const [canta, setCanta] = useState<number | null>(null)
  const siguiente = useRef(0)

  useEffect(() => {
    const quitarToques = escucharToques()
    const relojes = new Set<number>()
    const alFestejar = (e: Event) => {
      const { caja, diaVacio } = (e as CustomEvent<DetalleFestejo>).detail
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      const id = ++siguiente.current
      if (diaVacio) {
        setCanta(id)
        const t = window.setTimeout(() => setCanta((c) => (c === id ? null : c)), CANTA_MS)
        relojes.add(t)
        return
      }
      setAsomos((a) => [...a.slice(-2), { id, caja }])
      const t = window.setTimeout(() => setAsomos((a) => a.filter((x) => x.id !== id)), ASOMA_MS + 100)
      relojes.add(t)
    }
    window.addEventListener(EVENTO_FESTEJO, alFestejar)
    return () => {
      quitarToques()
      window.removeEventListener(EVENTO_FESTEJO, alFestejar)
      relojes.forEach((t) => window.clearTimeout(t))
    }
  }, [])

  if (asomos.length === 0 && canta === null) return null

  // Dos capas: Klo se asoma DEBAJO de la barra de abajo (z-40), porque el
  // renglón puede quedar tras ella; Klo canta ENCIMA de la barra y debajo de
  // las hojas (z-50).
  return createPortal(
    <>
      <div aria-hidden className="pointer-events-none fixed inset-0 z-30 overflow-hidden motion-reduce:hidden">
        {asomos.map((a) => (
          <div key={a.id} className="absolute overflow-hidden" style={marco(a.caja)}>
            <KloCabeza className="klo-asoma absolute right-2 bottom-0 w-10 text-vivo" />
          </div>
        ))}
      </div>
      {canta !== null ? (
        <div aria-hidden className="pointer-events-none fixed inset-0 z-[45] overflow-hidden motion-reduce:hidden">
          <div key={canta} className="klo-canta absolute inset-x-0 bottom-0 h-80">
            {/* Un velo del color de la página, para que «¡Quedó todo!» no caiga sobre otro texto. */}
            <div className="absolute inset-x-0 bottom-0 h-80 bg-gradient-to-t from-slate-50 via-slate-50/90 to-transparent" />
            <div className="absolute bottom-[-4.5rem] left-1/2 -ml-28 size-56 rounded-full bg-sol" />
            <KloGallo className="klo-canta-gallo absolute bottom-4 left-1/2 -ml-[4.4rem] w-32 text-vivo" />
            <NotaMano className="klo-canta-nota absolute bottom-40 left-1/2 ml-3" style={{ fontSize: '2rem' }}>
              ¡Quedó todo!
            </NotaMano>
          </div>
        </div>
      ) : null}
    </>,
    document.body
  )
}

/** El marco que recorta a Klo: el renglón, o la esquina de abajo si no hay renglón. */
function marco(caja: Caja | null): React.CSSProperties {
  if (!caja) {
    return {
      right: '0.75rem',
      bottom: 'calc(4.5rem + env(safe-area-inset-bottom))',
      width: MINIMO + 16,
      height: MINIMO + 16,
    }
  }
  const ancho = Math.max(caja.ancho, MINIMO)
  const alto = Math.max(caja.alto, MINIMO)
  return { left: caja.x + caja.ancho - ancho, top: caja.y + caja.alto - alto, width: ancho, height: alto }
}
