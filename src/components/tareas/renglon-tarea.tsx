'use client'

import { startTransition } from 'react'
import { completarTarea } from '@/app/(app)/tareas/acciones'
import { useHoja, useHojaViva } from '@/components/hoja/hoja-provider'
import type { FrenteVista } from '@/lib/frentes'
import { marcar, soltar, useHecha } from '@/lib/tareas/marcas'
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
  const seleccionada = useHojaViva().vivo.id === tarea.id
  const avisar = useToast()
  // Compartida: si la misma task sale en la agenda y en Tasks, palomearla en una la palomea en las dos al momento.
  const hecha = useHecha(tarea.id, tarea.completada_en !== null)

  function palomear() {
    const nueva = !hecha
    marcar(tarea.id, nueva)
    startTransition(async () => {
      const r = await completarTarea(tarea.id, nueva)
      if (!r.ok) {
        soltar(tarea.id)
        avisar(r.mensaje)
      }
      // El renglón puede desaparecer al marcarse (De un toque solo lista pendientes): el Deshacer no depende de él.
      else if (nueva)
        avisar('Done', () => {
          marcar(tarea.id, false)
          // Si el Deshacer falla, te lo decimos: antes se perdía en silencio.
          startTransition(async () => {
            const d = await completarTarea(tarea.id, false)
            if (!d.ok) {
              soltar(tarea.id)
              avisar(d.mensaje)
            }
          })
        })
    })
  }

  return (
    <li className={`v-renglon${hecha ? ' hecha' : ''}${seleccionada ? ' seleccionada' : ''}`}>
      <button type="button" className="v-palomita" aria-pressed={hecha} aria-label={`Check off “${tarea.titulo}”`} onClick={palomear} />
      <button type="button" className="txt" onClick={() => abrir({ tarea })}>
        <b>{tarea.titulo}</b>
        <small className={vencida && !hecha ? 'vencida' : undefined}>
          {ahora && !hecha && (
            <>
              <span className="v-vivo" aria-hidden />
              Now ·{' '}
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
