'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import type { FrenteVista } from '@/lib/frentes'
import type { Tarea } from '@/lib/tareas/esquema'
import { ToastProvider } from '@/components/tareas/toast'
import { HojaTarea } from './hoja-tarea'

export type ProyectoOpcion = { id: string; espacio_id: string; nombre: string }
/** Lo que abre la hoja: una tarea existente, o valores para una nueva (frente abierto, texto de una nota…). */
export type Apertura = { tarea?: Tarea; valores?: Partial<Tarea>; notaId?: string }

const Contexto = createContext<(a?: Apertura) => void>(() => {})
export const useHoja = () => useContext(Contexto)

// `hoy` llega del servidor, ya en la zona de tu perfil.
export function HojaProvider({
  frentes,
  proyectos,
  actividades,
  hoy,
  children,
}: {
  frentes: FrenteVista[]
  proyectos: ProyectoOpcion[]
  actividades: string[]
  hoy: string
  children: React.ReactNode
}) {
  const [abierta, setAbierta] = useState<Apertura | null>(null)
  const abrir = useCallback((a: Apertura = {}) => setAbierta(a), [])
  return (
    // El toast vive aquí: un solo proveedor en el layout para la hoja y los renglones.
    <ToastProvider>
      <Contexto.Provider value={abrir}>
        {children}
        {abierta && (
          <HojaTarea
            key={abierta.tarea?.id ?? 'nueva'}
            apertura={abierta}
            frentes={frentes}
            proyectos={proyectos}
            actividades={actividades}
            hoy={hoy}
            cerrar={() => setAbierta(null)}
          />
        )}
      </Contexto.Provider>
    </ToastProvider>
  )
}
