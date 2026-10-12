'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SECCIONES_TELEFONO, seccionActiva } from '@/lib/navegacion'
import { Icono } from './iconos'

export function BarraTelefono() {
  const activa = seccionActiva(usePathname())
  const [primeras, ultimas] = [SECCIONES_TELEFONO.slice(0, 2), SECCIONES_TELEFONO.slice(2)]

  const enlace = (s: (typeof SECCIONES_TELEFONO)[number]) => (
    <Link key={s.ruta} href={s.ruta} className={s.ruta === activa ? 'activo' : undefined} aria-current={s.ruta === activa ? 'page' : undefined}>
      <Icono nombre={s.icono} />
      {s.nombre}
    </Link>
  )

  return (
    <nav className="barra-tel" aria-label="Secciones">
      {primeras.map(enlace)}
      {/* El + abre la captura de Klo (Parte 3) o la hoja a mano (Parte 2). */}
      <button type="button" className="mas" aria-label="Nuevo" disabled>
        <Icono nombre="mas" />
      </button>
      {ultimas.map(enlace)}
    </nav>
  )
}
