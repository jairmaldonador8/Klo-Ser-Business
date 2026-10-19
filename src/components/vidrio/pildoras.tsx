'use client'

import { useSearchParams } from 'next/navigation'
import { Icono } from '@/components/armazon/iconos'
import { useHoja } from '@/components/hoja/hoja-provider'
import { frenteAbierto, type FrenteVista } from '@/lib/frentes'

/** El + flotante, abajo a la derecha: abre la hoja (en el space abierto, si hay). Los spaces viven en el riel. */
export function Pildoras({ frentes }: { frentes: FrenteVista[] }) {
  const abierto = frenteAbierto(frentes, useSearchParams().get('frente'))
  const abrir = useHoja()

  return (
    <button
      type="button"
      className="v-mas-flotante"
      aria-label="New"
      data-color={abierto?.color}
      onClick={() => abrir({ valores: abierto ? { espacio_id: abierto.id } : {} })}
    >
      <Icono nombre="mas" />
    </button>
  )
}
