'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SECCIONES, seccionActiva } from '@/lib/navegacion'
import { Icono } from './iconos'

export type FrenteLado = { id: string; nombre: string; inicial: string }

/** Alto de cada enlace de la nav (11 + 22 de línea + 11 = 44 px, ver .nav a en noche.css) + hueco (4 px). */
const PASO_PILDORA = 48

export function BarraLateral({ frentes, fraseKlo }: { frentes: FrenteLado[]; fraseKlo: string }) {
  const activa = seccionActiva(usePathname())
  const indice = SECCIONES.findIndex((s) => s.ruta === activa)

  return (
    <aside className="lado">
      <div className="lockup">
        <Image src="/marca/blanco/03-wordmark.svg" alt="Klo-Ser" width={114} height={30} unoptimized preload />
        <span>BUSINESS</span>
      </div>

      <nav className="nav" aria-label="Secciones">
        {indice >= 0 && <div className="pildora" style={{ transform: `translateY(${indice * PASO_PILDORA}px)` }} />}
        {SECCIONES.map((s) => (
          <Link
            key={s.ruta}
            href={s.ruta}
            className={s.ruta === activa ? 'activo' : undefined}
            aria-current={s.ruta === activa ? 'page' : undefined}
          >
            <Icono nombre={s.icono} />
            {s.nombre}
          </Link>
        ))}
      </nav>

      {frentes.length > 0 && (
        <div className="frentes">
          <div className="micro">Frentes</div>
          {frentes.map((f) => (
            <div key={f.id} className="frente">
              <span className="k">{f.inicial}</span>
              {f.nombre}
            </div>
          ))}
        </div>
      )}

      <div className="klo-lado">
        <div className="disco-sol">
          <Image src="/marca/azul/04-gallo-cabeza.svg" alt="" width={26} height={30} unoptimized />
        </div>
        <p>
          <b>Klo:</b> {fraseKlo}
        </p>
      </div>
    </aside>
  )
}
