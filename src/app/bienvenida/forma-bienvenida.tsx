'use client'

import { useActionState, useState } from 'react'
import { MAX_FRENTES } from '@/lib/frentes'
import { completarBienvenida, type EstadoBienvenida } from './acciones'

/** Sugerencias genéricas: ningún nombre real vive en el código. */
const SUGERENCIAS = ['My company', 'My agency', 'My personal brand']
const CAMPO = 'w-full rounded-[10px] bg-[#0a0a0b] px-4 py-3 text-[15px] text-tinta ring-1 ring-white/10 outline-none placeholder:text-tinta-3 focus:ring-white/40'

export function FormaBienvenida({ nombreInicial }: { nombreInicial: string }) {
  const [estado, accion, enviando] = useActionState<EstadoBienvenida, FormData>(completarBienvenida, { mensaje: null })
  const [frentes, setFrentes] = useState(SUGERENCIAS)

  return (
    <form action={accion} className="flex w-full flex-col gap-5">
      <label className="flex flex-col gap-2">
        <span className="micro">Your name</span>
        <input name="nombre" defaultValue={nombreInicial} maxLength={80} className={CAMPO} autoComplete="given-name" />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="micro mb-2">Your spaces</legend>
        {frentes.map((valor, i) => (
          <input key={i} name="frente" defaultValue={valor} maxLength={40} className={CAMPO} aria-label={`Space ${i + 1}`} />
        ))}
        {frentes.length < MAX_FRENTES && (
          <button type="button" className="self-start text-[13px] text-tinta-2 hover:text-tinta" onClick={() => setFrentes([...frentes, ''])}>
            ＋ Another space
          </button>
        )}
      </fieldset>

      {estado.mensaje && (
        <p className="text-sm text-tinta" role="alert">
          {estado.mensaje}
        </p>
      )}

      <button type="submit" className="btn-amanecer justify-center" disabled={enviando}>
        {enviando ? 'Saving…' : 'Get started'}
      </button>
    </form>
  )
}
