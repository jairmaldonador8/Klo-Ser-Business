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
        {/* El logo completo del space se revela de izquierda a derecha; «All» es el lockup de Klo-Ser Business.
            Si el space no tiene logo completo, su nombre aparece letra por letra. */}
        {!frente ? (
          <span className="v-apertura-logo v-apertura-lockup">
            <Image src="/marca/blanco/03-wordmark.svg" alt="" width={220} height={55} unoptimized priority />
            <em>Business</em>
          </span>
        ) : frente.logo_ancho ? (
          <span className="v-apertura-logo">
            <Image src={frente.logo_ancho} alt="" width={260} height={64} unoptimized priority />
          </span>
        ) : (
          <strong>
            {[...nombre].map((letra, i) => (
              <span key={i} style={{ '--i': i } as CSSProperties}>
                {letra === ' ' ? '\u00a0' : letra}
              </span>
            ))}
          </strong>
        )}
      </div>
    </div>,
    document.body,
  )
}
