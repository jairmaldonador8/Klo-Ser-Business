'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Icono } from '@/components/armazon/iconos'
import { seccionActiva } from '@/lib/navegacion'
import { conFrente } from '@/lib/rutas'
import type { Seccion } from '@/lib/vista/registro'

export function Riel({ secciones }: { secciones: Seccion[] }) {
  const activa = seccionActiva(usePathname())
  const frente = useSearchParams().get('frente')

  return (
    <nav className="v-riel" aria-label="Sections">
      {secciones.map((s) => (
        <Link key={s.id} href={conFrente(s.ruta, frente)} aria-label={s.nombre} aria-current={s.ruta === activa ? 'page' : undefined}>
          <Icono nombre={s.id} />
          <span>{s.nombre}</span>
        </Link>
      ))}
    </nav>
  )
}
