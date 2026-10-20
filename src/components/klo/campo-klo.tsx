'use client'

import Image from 'next/image'
import { useSyncExternalStore } from 'react'
import { useKlo } from './klo-provider'

const nada = () => () => {}
/** ⌘ en Mac y iPhone; Ctrl en Windows (en el servidor se pinta ⌘ y se corrige al hidratar). */
const atajo = () => (/Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘ K' : 'Ctrl K')

/** El campo «Tell Klo» de la barra: un botón con cara de campo que abre el panel. */
export function CampoKlo() {
  const { abrir } = useKlo()
  const tecla = useSyncExternalStore(nada, atajo, () => '⌘ K')
  return (
    <button type="button" className="v-klo-campo klo-campo" onClick={abrir} aria-label="Tell Klo">
      <span className="klo-orbe" aria-hidden>
        <Image src="/marca/azul/02-gallo-completo.svg" alt="" width={14} height={17} unoptimized />
      </span>
      <span className="klo-sugerencia">Tell Klo anything…</span>
      <kbd>{tecla}</kbd>
    </button>
  )
}

/** Envuelve algo (el mosaico de Klo en Today) para que al tocarlo se abra el panel. */
export function AbrirKlo({ children, className }: { children: React.ReactNode; className?: string }) {
  const { abrir } = useKlo()
  return (
    <button type="button" className={className} onClick={abrir} aria-label="Talk to Klo">
      {children}
    </button>
  )
}
