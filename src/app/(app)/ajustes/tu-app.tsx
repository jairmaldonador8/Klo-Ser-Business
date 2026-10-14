'use client'

import { useState, useTransition } from 'react'
import type { Mosaico, Seccion } from '@/lib/vista/registro'
import { mover, type Preferencia } from '@/lib/vista/resolver'
import { guardarVista } from './acciones'

type Item = { id: string; nombre: string; descripcion?: string; obligatorio?: boolean; visible: boolean }
type Props = { secciones: (Seccion & { visible: boolean })[]; mosaicos: (Mosaico & { visible: boolean })[] }

const soloPreferencias = (lista: Item[]): Preferencia[] => lista.map(({ id, visible }) => ({ id, visible }))

export function TuApp(props: Props) {
  const [secciones, setSecciones] = useState<Item[]>(props.secciones)
  const [mosaicos, setMosaicos] = useState<Item[]>(props.mosaicos)
  const [aviso, setAviso] = useState('')
  const [, empezar] = useTransition()

  function guardar(nuevasSecciones: Item[], nuevosMosaicos: Item[]) {
    setSecciones(nuevasSecciones)
    setMosaicos(nuevosMosaicos)
    setAviso('Guardando…')
    empezar(async () => {
      const r = await guardarVista({
        secciones: soloPreferencias(nuevasSecciones),
        mosaicos_hoy: soloPreferencias(nuevosMosaicos),
      })
      setAviso(r.ok ? 'Guardado' : r.mensaje)
    })
  }

  const lista = (titulo: string, items: Item[], cambiar: (l: Item[]) => void) => (
    <section className="v-t c2" aria-label={titulo}>
      <h3>{titulo}</h3>
      <ul className="v-lista">
        {items.map((x, n) => (
          <li key={x.id} className={`v-renglon ${x.visible ? '' : 'oculto'}`}>
            <span className="txt">
              <b>{x.nombre}</b>
              <small>{x.obligatorio ? 'Siempre visible' : (x.descripcion ?? '')}</small>
            </span>
            <button type="button" className="v-flecha" aria-label={`Subir ${x.nombre}`} disabled={n === 0} onClick={() => cambiar(mover(items, x.id, -1))}>
              ↑
            </button>
            <button
              type="button"
              className="v-flecha"
              aria-label={`Bajar ${x.nombre}`}
              disabled={n === items.length - 1}
              onClick={() => cambiar(mover(items, x.id, 1))}
            >
              ↓
            </button>
            <button
              type="button"
              role="switch"
              className="v-interruptor"
              aria-checked={x.visible}
              aria-label={`Mostrar ${x.nombre}`}
              disabled={x.obligatorio}
              onClick={() => cambiar(items.map((y) => (y.id === x.id ? { ...y, visible: !y.visible } : y)))}
            />
          </li>
        ))}
      </ul>
    </section>
  )

  return (
    <>
      {lista('Secciones del riel', secciones, (l) => guardar(l, mosaicos))}
      {lista('Mosaicos de Hoy', mosaicos, (l) => guardar(secciones, l))}
      <p className="v-aviso" role="status" style={{ gridColumn: '1 / -1' }}>
        {aviso}
      </p>
    </>
  )
}
