'use client'

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { arrayMove, rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState, useTransition } from 'react'
import { guardarMosaicos } from '@/app/(app)/ajustes/acciones'
import { Conexiones } from '@/components/vidrio/conexiones'
import { MOSAICOS } from '@/lib/vista/registro'
import { acomodarMosaicos } from '@/lib/vista/resolver'

export type ItemHoy = { id: string; nombre: string; clase: string; obligatorio?: boolean; visible: boolean; nodo: React.ReactNode }

type Props = { items: ItemHoy[]; editable: boolean }

/** Hoy en mosaicos. Con «Personalizar», se arrastran para acomodarlos y se ocultan con ×. */
export function EditorHoy({ items, editable }: Props) {
  const porId = new Map(items.map((x) => [x.id, x]))
  const inicialVisibles = items.filter((x) => x.visible).map((x) => x.id)
  const inicialOcultos = items.filter((x) => !x.visible).map((x) => x.id)

  const [editando, setEditando] = useState(false)
  const [visibles, setVisibles] = useState(inicialVisibles)
  const [ocultos, setOcultos] = useState(inicialOcultos)
  const [aviso, setAviso] = useState('')
  const [guardando, empezar] = useTransition()

  const sensores = useSensors(
    // Mouse y touch por separado: con PointerSensor, deslizar en el teléfono arrastraría.
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // En el teléfono: mantener presionado, para no robarle el desplazamiento a la página.
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function alSoltar({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    setVisibles((lista) => arrayMove(lista, lista.indexOf(String(active.id)), lista.indexOf(String(over.id))))
  }

  function ocultar(id: string) {
    setVisibles((l) => l.filter((x) => x !== id))
    setOcultos((l) => [...l, id])
  }

  function mostrar(id: string) {
    setOcultos((l) => l.filter((x) => x !== id))
    setVisibles((l) => [...l, id])
  }

  function cancelar() {
    setVisibles(inicialVisibles)
    setOcultos(inicialOcultos)
    setEditando(false)
    setAviso('')
  }

  function restablecer() {
    setVisibles(MOSAICOS.map((m) => m.id).filter((id) => porId.has(id)))
    setOcultos([])
  }

  function listo() {
    setAviso('Guardando…')
    empezar(async () => {
      const r = await guardarMosaicos(acomodarMosaicos(visibles, ocultos))
      if (r.ok) {
        setEditando(false)
        setAviso('')
      } else setAviso(r.mensaje)
    })
  }

  return (
    <div className="v-hoy" data-editando={editando || undefined}>
      {editable && (
        <div className="v-herramientas">
          {editando ? (
            <>
              <span className="v-sub">Arrastra para acomodar · × para ocultar</span>
              <span className="v-aviso" role="status">
                {aviso}
              </span>
              <button type="button" className="v-boton chico" onClick={restablecer}>
                Restablecer
              </button>
              <button type="button" className="v-boton chico" onClick={cancelar}>
                Cancelar
              </button>
              <button type="button" className="v-boton chico primario" onClick={listo} disabled={guardando}>
                Listo
              </button>
            </>
          ) : (
            <button type="button" className="v-boton chico" onClick={() => setEditando(true)}>
              ✎ Personalizar
            </button>
          )}
        </div>
      )}

      {editando ? (
        <DndContext sensors={sensores} collisionDetection={closestCenter} onDragEnd={alSoltar}>
          <SortableContext items={visibles} strategy={rectSortingStrategy}>
            <div className="v-bento">
              {visibles.map((id) => {
                const x = porId.get(id)
                return x && <Arrastrable key={id} item={x} onOcultar={() => ocultar(id)} />
              })}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="v-bento">
          <Conexiones />
          {visibles.map((id) => porId.get(id)?.nodo)}
        </div>
      )}

      {editando && ocultos.length > 0 && (
        <section className="v-ocultos" aria-label="Mosaicos ocultos">
          <span className="v-sub">Ocultos · toca para regresarlos</span>
          {ocultos.map((id) => (
            <button key={id} type="button" className="v-chip" onClick={() => mostrar(id)}>
              ＋ {porId.get(id)?.nombre}
            </button>
          ))}
        </section>
      )}
    </div>
  )
}

function Arrastrable({ item, onOcultar }: { item: ItemHoy; onOcultar: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  return (
    <div
      ref={setNodeRef}
      className={`v-editable ${item.clase}`}
      data-arrastrando={isDragging || undefined}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      aria-label={`Mover ${item.nombre}`}
    >
      <div className="v-editable-contenido">{item.nodo}</div>
      {!item.obligatorio && (
        <button
          type="button"
          className="v-quitar"
          aria-label={`Ocultar ${item.nombre}`}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          onClick={onOcultar}
        >
          ×
        </button>
      )}
    </div>
  )
}
