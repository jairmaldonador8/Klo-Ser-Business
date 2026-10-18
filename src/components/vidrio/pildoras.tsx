'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Icono } from '@/components/armazon/iconos'
import { useHoja } from '@/components/hoja/hoja-provider'
import { frenteAbierto, type FrenteVista } from '@/lib/frentes'
import { conFrente } from '@/lib/rutas'

/** Los frentes como cuartos: abrir uno conserva la sección donde estoy. */
export function Pildoras({ frentes }: { frentes: FrenteVista[] }) {
  const ruta = usePathname()
  const abierto = frenteAbierto(frentes, useSearchParams().get('frente'))
  const abrir = useHoja()

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
      {/* El + abre la hoja a mano; con Klo (Parte 3) abrirá la captura. */}
      <button type="button" className="mas" aria-label="Nuevo" onClick={() => abrir({ valores: abierto ? { espacio_id: abierto.id } : {} })}>
        <Icono nombre="mas" />
      </button>
    </nav>
  )
}
