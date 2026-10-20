'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { PanelKlo } from './panel-klo'

type Klo = { abierto: boolean; abrir: () => void; cerrar: () => void }
const Contexto = createContext<Klo>({ abierto: false, abrir: () => {}, cerrar: () => {} })
/** `abrir()` desde la barra, el mosaico de Today o ⌘K. */
export const useKlo = () => useContext(Contexto)

export function KloProvider({ children, nombre }: { children: React.ReactNode; nombre?: string | null }) {
  const [abierto, setAbierto] = useState(false)
  const abrir = useCallback(() => setAbierto(true), [])
  const cerrar = useCallback(() => setAbierto(false), [])

  // ⌘K / Ctrl+K abre y cierra desde cualquier pantalla.
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setAbierto((a) => !a)
      }
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [])

  return (
    <Contexto.Provider value={{ abierto, abrir, cerrar }}>
      {children}
      {/* Montado siempre: la conversación sigue aunque cierres y abras el panel. */}
      <PanelKlo abierto={abierto} cerrar={cerrar} nombre={nombre} />
    </Contexto.Provider>
  )
}
