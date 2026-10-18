'use client'

import { useActionState } from 'react'
import { entrarConCorreo, type EstadoEntrar } from './acciones'

const CAMPO = 'w-full rounded-[10px] bg-[#0a0a0b] px-4 py-3 text-[15px] text-tinta ring-1 ring-white/10 outline-none placeholder:text-tinta-3 focus:ring-white/40'

export function FormaEntrar() {
  const [estado, accion, enviando] = useActionState<EstadoEntrar, FormData>(entrarConCorreo, { mensaje: null })

  return (
    <form action={accion} className="flex w-full flex-col gap-3 text-left">
      <input name="correo" type="email" required autoComplete="email" placeholder="Tu correo" aria-label="Correo" className={CAMPO} />
      <input name="contrasena" type="password" required autoComplete="current-password" placeholder="Contraseña" aria-label="Contraseña" className={CAMPO} />
      {estado.mensaje && (
        <p className="px-2 text-sm text-tinta-2" role="alert">
          {estado.mensaje}
        </p>
      )}
      <button type="submit" className="btn-amanecer mt-2 justify-center" disabled={enviando}>
        {enviando ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  )
}
