'use client'

import { startTransition, useOptimistic } from 'react'
import { completarTarea } from '@/app/(app)/tareas/acciones'
import { useHoja } from '@/components/hoja/hoja-provider'
import type { FrenteVista } from '@/lib/frentes'
import type { Tarea } from '@/lib/tareas/esquema'
import { useToast } from './toast'

type Props = {
  tarea: Tarea
  /** Solo en «Todos»: dentro de un frente ya se sabe de cuál es. */
  frente?: FrenteVista
  detalle: string
  /** Vencida: tinta plena y semibold, sin colores de semáforo. */
  vencida?: boolean
  /** Ocurre ahora: punto vivo y «Ahora». */
  ahora?: boolean
}

/** Renglón de tarea: la palomita la marca (con Deshacer) y el texto abre la hoja. */
export function RenglonTarea({ tarea, frente, detalle, vencida, ahora }: Props) {
  const abrir = useHoja()
  const avisar = useToast()
  const [hecha, setHecha] = useOptimistic(tarea.completada_en !== null)

  function palomear() {
    const nueva = !hecha
    startTransition(async () => {
      setHecha(nueva)
      const r = await completarTarea(tarea.id, nueva)
      if (!r.ok) avisar(r.mensaje)
      // El renglón puede desaparecer al marcarse (De un toque solo lista pendientes): el Deshacer no depende de él.
      else if (nueva) avisar('Hecha', () => startTransition(() => void completarTarea(tarea.id, false)))
    })
  }

  return (
    <li className={`v-renglon${hecha ? ' hecha' : ''}`}>
      <button type="button" className="v-palomita" aria-pressed={hecha} aria-label={`Marcar «${tarea.titulo}»`} onClick={palomear} />
      <button type="button" className="txt" onClick={() => abrir({ tarea })}>
        <b>{tarea.titulo}</b>
        <small className={vencida && !hecha ? 'vencida' : undefined}>
          {ahora && !hecha && (
            <>
              <span className="v-vivo" aria-hidden />
              Ahora ·{' '}
            </>
          )}
          {detalle}
          {frente && (
            <>
              {' · '}
              <i className={`v-inicial v-color-${frente.color}`} aria-hidden>
                {frente.inicial}
              </i>{' '}
              {frente.nombre}
            </>
          )}
        </small>
      </button>
    </li>
  )
}
