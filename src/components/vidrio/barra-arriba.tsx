'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { frenteAbierto, type FrenteVista } from '@/lib/frentes'
import { conFrente } from '@/lib/rutas'
import { fechaLarga, horaEn, saludoPorHora } from '@/lib/saludo'

// ahora llega del servidor: si se calcula aquí, el HTML y el cliente pueden diferir (hidratación).
type Props = { nombre: string | null; zona: string; frentes: FrenteVista[]; ahora: string }

export function BarraArriba({ nombre, zona, frentes, ahora: ahoraIso }: Props) {
  const atajo = useSearchParams().get('frente')
  const frente = frenteAbierto(frentes, atajo)
  const ahora = new Date(ahoraIso)
  const inicial = nombre?.trim().charAt(0).toUpperCase() || '·'

  return (
    <header className="v-barra">
      {frente ? (
        <div className={`v-foto v-color-${frente.color}`}>{frente.inicial}</div>
      ) : (
        <div className="v-foto sol-klo">
          <Image src="/marca/azul/02-gallo-completo.svg" alt="" width={28} height={34} unoptimized />
        </div>
      )}
      <div>
        <h1>{frente ? frente.nombre : saludoPorHora(horaEn(ahora, zona), nombre)}</h1>
        <small>
          {fechaLarga(ahora, zona)}
          {frente ? ' · space' : ''}
        </small>
      </div>
      {/* La captura de Klo se enciende en la Parte 3. */}
      <label className="v-klo-campo">
        <span className="v-orbe" />
        {/* Las extensiones del navegador le inyectan atributos al input. */}
        <input suppressHydrationWarning placeholder="Tell Klo: “deliver the carousels tomorrow at 5”" disabled aria-label="Tell Klo" />
        <kbd>⌘ K</kbd>
      </label>
      <Link href={conFrente('/ajustes', frente?.atajo)} className="v-yo" aria-label="Settings">
        <i>{inicial}</i>
        <span>
          Hi, <b>{nombre?.trim().split(/\s+/)[0] || 'there'}</b>
        </span>
      </Link>
    </header>
  )
}
