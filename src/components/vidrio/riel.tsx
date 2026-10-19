'use client'

import Link, { useLinkStatus } from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Icono } from '@/components/armazon/iconos'
import { Apertura, type Abriendo } from './apertura'
import { MarcaEspacio } from './marca-espacio'
import { frenteAbierto, type FrenteVista } from '@/lib/frentes'
import { seccionActiva } from '@/lib/navegacion'
import { conFrente } from '@/lib/rutas'
import type { Seccion } from '@/lib/vista/registro'

/** Mientras carga lo que tocaste, su cuadro late con el color del space. */
function Cargando() {
  const { pending } = useLinkStatus()
  return <i className={`v-latido${pending ? ' activo' : ''}`} aria-hidden />
}

/** El riel: arriba las secciones; abajo los spaces (antes eran píldoras), que conservan la sección donde estás. */
export function Riel({ secciones, frentes }: { secciones: Seccion[]; frentes: FrenteVista[] }) {
  const ruta = usePathname()
  const activa = seccionActiva(ruta)
  const atajo = useSearchParams().get('frente')
  const abierto = frenteAbierto(frentes, atajo)

  // Al tocar otro space sale su logo con el anillo de carga; se va cuando ya llegó, tras un instante mínimo
  // para que no parpadee. Si algo se atora, a los 8 s se quita solo.
  const [abriendo, setAbriendo] = useState<Abriendo | null>(null)
  const desde = useRef(0)
  const llego = abriendo !== null && (abierto?.id ?? null) === (abriendo.frente?.id ?? null)
  useEffect(() => {
    if (!abriendo) return
    const espera = llego ? Math.max(0, 750 - (Date.now() - desde.current)) : 8000
    const reloj = setTimeout(() => setAbriendo(null), espera)
    return () => clearTimeout(reloj)
  }, [abriendo, llego])

  const abrir = (frente: FrenteVista | null) => (e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || (frente?.id ?? null) === (abierto?.id ?? null)) return
    desde.current = Date.now()
    setAbriendo({ frente })
  }

  return (
    <div className="v-riel">
      <nav className="v-riel-secciones" aria-label="Sections">
        {secciones.map((s) => (
          <Link key={s.id} href={conFrente(s.ruta, atajo)} aria-label={s.nombre} aria-current={s.ruta === activa ? 'page' : undefined}>
            <Icono nombre={s.id} />
            <span>{s.nombre}</span>
            <Cargando />
          </Link>
        ))}
      </nav>
      {frentes.length > 1 && (
        <nav className="v-riel-espacios" aria-label="Spaces">
          <Link href={ruta} aria-label="All" aria-current={!abierto} className="todos" onClick={abrir(null)}>
            <b aria-hidden>
              <i />
              <i />
              <i />
              <i />
            </b>
            <span>All</span>
            <Cargando />
          </Link>
          {frentes.map((f) => (
            <Link
              key={f.id}
              href={conFrente(ruta, f.atajo)}
              aria-label={f.nombre}
              aria-current={abierto?.id === f.id}
              style={{ '--c': `var(--v-p-${f.color})` } as React.CSSProperties}
              onClick={abrir(f)}
            >
              <b aria-hidden className={f.logo ? 'con-logo' : undefined}>
                <MarcaEspacio frente={f} />
              </b>
              <span>{f.nombre}</span>
              <Cargando />
            </Link>
          ))}
        </nav>
      )}
      {abriendo && <Apertura abriendo={abriendo} />}
    </div>
  )
}
