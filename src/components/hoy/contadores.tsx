'use client'

import { MosaicoMedidor } from '@/components/vidrio/mosaicos'
import { useDiferencia } from '@/lib/tareas/marcas'

type Universo = { id: string; hecha: boolean }[]

/** «N» de «N of M done», al día con lo que palomeas aunque el servidor no haya contestado. */
export function HechasVivas({ hechas, universo }: { hechas: number; universo: Universo }) {
  return <>{hechas + useDiferencia(universo)}</>
}

/** El medidor de «Your day» que se mueve en cuanto palomeas. */
export function MedidorVivo({ hechas, pendientes, universo, ...resto }: { hechas: number; pendientes: number; siguiente: string | null; i: number; universo: Universo }) {
  const d = useDiferencia(universo)
  return <MosaicoMedidor hechas={Math.max(0, hechas + d)} pendientes={Math.max(0, pendientes - d)} {...resto} />
}
