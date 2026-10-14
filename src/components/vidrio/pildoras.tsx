'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Icono } from '@/components/armazon/iconos'
import { frenteAbierto, type FrenteVista } from '@/lib/frentes'
import { conFrente } from '@/lib/rutas'

/** Los frentes como cuartos: abrir uno conserva la sección donde estoy. */
export function Pildoras({ frentes }: { frentes: FrenteVista[] }) {
  const ruta = usePathname()
  const abierto = frenteAbierto(frentes, useSearchParams().get('frente'))

  return (
    <nav className="v-pildoras" aria-label="Frentes">
      {frentes.length > 1 && (
        <>
          <Link href={ruta} aria-current={!abierto}>
            Todos
          </Link>
          {frentes.map((f) => (
            <Link key={f.id} href={conFrente(ruta, f.atajo)} aria-current={abierto?.id === f.id}>
              <span className="p" style={{ background: `var(--v-p-${f.color})` }} />
              {f.nombre}
            </Link>
          ))}
        </>
      )}
      {/* El + abre la captura de Klo (Parte 3) o la hoja a mano (Parte 2). */}
      <button type="button" className="mas" aria-label="Nuevo" disabled>
        <Icono nombre="mas" />
      </button>
    </nav>
  )
}
