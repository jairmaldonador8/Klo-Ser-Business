'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { FrenteVista } from '@/lib/frentes'
import type { Tarea } from '@/lib/tareas/esquema'
import { ToastProvider } from '@/components/tareas/toast'
import { HojaTarea } from './hoja-tarea'

export type ProyectoOpcion = { id: string; espacio_id: string; nombre: string }
/** Lo que abre la hoja: una tarea existente, o valores para una nueva (frente abierto, texto de una nota…). */
/** `dias`: calendarizar la misma task en varios días (arrastrar con ⇧/⌘ en el calendario), una por día. */
export type Apertura = { tarea?: Tarea; valores?: Partial<Tarea>; notaId?: string; dias?: string[]; alCerrar?: () => void }

/** Lo que se edita mientras la hoja está abierta: el resto de la app lo pinta en vivo, antes de guardar. */
export type Vivo = { id: string | null; cambios: Partial<Tarea> | null }

const Contexto = createContext<(a?: Apertura) => void>(() => {})
const ContextoVivo = createContext<{ vivo: Vivo; poner: (cambios: Partial<Tarea> | null) => void }>({ vivo: { id: null, cambios: null }, poner: () => {} })
export const useHoja = () => useContext(Contexto)
/** La task abierta en la hoja y sus cambios sin guardar (para resaltarla y pintar la vista previa). */
export const useHojaViva = () => useContext(ContextoVivo)

/** Aplica la vista previa de la hoja a una lista de tasks (sin tocar las demás). */
export function conVistaPrevia<T extends Tarea>(lista: T[], vivo: Vivo): T[] {
  if (!vivo.id || !vivo.cambios) return lista
  return lista.map((t) => (t.id === vivo.id ? { ...t, ...vivo.cambios } : t))
}

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
  const [cambios, setCambios] = useState<Partial<Tarea> | null>(null)
  const abrir = useCallback((a: Apertura = {}) => {
    setCambios(null)
    setAbierta(a)
  }, [])
  const vivo: Vivo = { id: abierta?.tarea?.id ?? null, cambios }

  // Con la hoja abierta, el fondo se apaga (y lo que editas queda encima del velo).
  useEffect(() => {
    document.documentElement.classList.toggle('hoja-abierta', !!abierta)
    return () => document.documentElement.classList.remove('hoja-abierta')
  }, [abierta])

  return (
    // El toast vive aquí: un solo proveedor en el layout para la hoja y los renglones.
    <ToastProvider>
      <Contexto.Provider value={abrir}>
        <ContextoVivo.Provider value={{ vivo, poner: setCambios }}>
          {children}
          {abierta && (
            <HojaTarea
              key={abierta.tarea?.id ?? 'nueva'}
              apertura={abierta}
              frentes={frentes}
              proyectos={proyectos}
              actividades={actividades}
              hoy={hoy}
              cerrar={() => {
                abierta.alCerrar?.()
                setCambios(null)
                setAbierta(null)
              }}
            />
          )}
        </ContextoVivo.Provider>
      </Contexto.Provider>
    </ToastProvider>
  )
}
