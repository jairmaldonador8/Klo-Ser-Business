'use client'

import { useSearchParams } from 'next/navigation'
import { frenteAbierto, type FrenteVista } from '@/lib/frentes'

/** La ventana; dentro de un space toma su color (DISENO §23). */
export function Ventana({ frentes, children }: { frentes: FrenteVista[]; children: React.ReactNode }) {
  const frente = frenteAbierto(frentes, useSearchParams().get('frente'))
  return (
    <main className="v-ventana" data-color={frente?.color}>
      {children}
    </main>
  )
}
