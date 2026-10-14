'use client'

import { useSearchParams } from 'next/navigation'
import { frenteAbierto, type FrenteVista } from '@/lib/frentes'

/** La ventana de vidrio; dentro de un frente se tiñe con su color. */
export function Ventana({ frentes, children }: { frentes: FrenteVista[]; children: React.ReactNode }) {
  const frente = frenteAbierto(frentes, useSearchParams().get('frente'))
  return (
    <main className="v-ventana" data-color={frente?.color}>
      {children}
    </main>
  )
}
