'use client'

import { useKlo } from './klo-provider'

/** El campo «Tell Klo» de la barra: un botón con cara de campo que abre el panel. */
export function CampoKlo() {
  const { abrir } = useKlo()
  return (
    <button type="button" className="v-klo-campo" onClick={abrir} aria-label="Tell Klo">
      <span className="v-orbe" />
      <span className="klo-sugerencia">Tell Klo: “deliver the carousels tomorrow at 5”</span>
      <kbd>⌘ K</kbd>
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
