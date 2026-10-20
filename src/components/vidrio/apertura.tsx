'use client'

import Image from 'next/image'
import type { CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import type { FrenteVista } from '@/lib/frentes'
import { MarcaEspacio } from './marca-espacio'

/** Lo que se está abriendo: un space, o «All» (sin space). */
export type Abriendo = { frente: FrenteVista | null }

/** El logo del space (plano, con un destello que lo cruza) y una línea de carga en su color. */
export function MarcaCargando({ frente }: { frente: FrenteVista | null }) {
  return (
    <div className="v-marca-carga">
      {frente ? (
        <b className={frente.logo ? 'con-logo' : undefined}>
          <MarcaEspacio frente={frente} />
        </b>
      ) : (
        <Image src="/marca/azul/02-gallo-completo.svg" alt="" width={40} height={48} unoptimized priority />
      )}
      <span className="v-carga-linea" aria-hidden>
        <i />
      </span>
    </div>
  )
}

/** Velo de apertura de un space: va al body (el riel tiene backdrop-filter y atraparía el position:fixed). */
export function Apertura({ abriendo }: { abriendo: Abriendo }) {
  const { frente } = abriendo
  const nombre = frente?.nombre ?? 'All spaces'
  return createPortal(
    <div className="v-apertura" data-color={frente?.color} role="status" aria-label={`Opening ${nombre}`}>
      <div className="v-aurora" aria-hidden>
        <i />
        <i />
      </div>
      <MarcaCargando frente={frente} />
      <div className="v-apertura-texto" aria-hidden>
        <small>Opening</small>
        {/* El nombre aparece letra por letra. */}
        <strong>
          {[...nombre].map((letra, i) => (
            <span key={i} style={{ '--i': i } as CSSProperties}>
              {letra === ' ' ? ' ' : letra}
            </span>
          ))}
        </strong>
      </div>
    </div>,
    document.body,
  )
}
