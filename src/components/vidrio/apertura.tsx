'use client'

import Image from 'next/image'
import { createPortal } from 'react-dom'
import type { FrenteVista } from '@/lib/frentes'
import { MarcaEspacio } from './marca-espacio'

/** Lo que se está abriendo: un space, o «All» (sin space). */
export type Abriendo = { frente: FrenteVista | null }

/** El logo del space al centro, con un anillo fino de carga girando alrededor. */
export function MarcaCargando({ frente }: { frente: FrenteVista | null }) {
  return (
    <div className="v-marca-carga">
      <svg viewBox="0 0 100 100" aria-hidden>
        <circle className="pista" cx="50" cy="50" r="46" />
        <circle className="arco" cx="50" cy="50" r="46" pathLength="100" />
      </svg>
      {frente ? (
        <b className={frente.logo ? 'con-logo' : undefined}>
          <MarcaEspacio frente={frente} />
        </b>
      ) : (
        <Image src="/marca/azul/02-gallo-completo.svg" alt="" width={40} height={48} unoptimized priority />
      )}
    </div>
  )
}

/** Velo de apertura de un space: va al body (el riel tiene backdrop-filter y atraparía el position:fixed). */
export function Apertura({ abriendo }: { abriendo: Abriendo }) {
  const { frente } = abriendo
  return createPortal(
    <div className="v-apertura" data-color={frente?.color} role="status" aria-label={`Opening ${frente?.nombre ?? 'All'}`}>
      <MarcaCargando frente={frente} />
      <small>{frente?.nombre ?? 'All spaces'}</small>
    </div>,
    document.body,
  )
}
