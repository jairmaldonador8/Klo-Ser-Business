'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

type Aviso = { id: number; texto: string; deshacer?: () => void }
type Avisar = (texto: string, deshacer?: () => void) => void

const Contexto = createContext<Avisar>(() => {})
/** `avisar('Hecha', () => …)`: un aviso abajo, por encima de las píldoras, 5 s con «Deshacer». */
export const useToast = () => useContext(Contexto)

const DURACION = 5000

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [aviso, setAviso] = useState<Aviso | null>(null)
  const cuenta = useRef(0)
  const avisar = useCallback<Avisar>((texto, deshacer) => setAviso({ id: ++cuenta.current, texto, deshacer }), [])

  // Cada aviso nuevo reinicia el reloj; uno nuevo reemplaza al anterior.
  useEffect(() => {
    if (!aviso) return
    const reloj = setTimeout(() => setAviso((a) => (a?.id === aviso.id ? null : a)), DURACION)
    return () => clearTimeout(reloj)
  }, [aviso])

  return (
    <Contexto.Provider value={avisar}>
      {children}
      <div className="v-toast-zona" role="status" aria-live="polite">
        {aviso && (
          <div key={aviso.id} className="v-toast">
            <span>{aviso.texto}</span>
            {aviso.deshacer && (
              <button
                type="button"
                onClick={() => {
                  aviso.deshacer?.()
                  setAviso(null)
                }}
              >
                Deshacer
              </button>
            )}
          </div>
        )}
      </div>
    </Contexto.Provider>
  )
}
