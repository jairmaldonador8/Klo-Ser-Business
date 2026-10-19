'use client'

import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  pointerWithin,
  TouchSensor,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  defaultAnimateLayoutChanges,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  type AnimateLayoutChanges,
  type SortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useRef, useState, useTransition } from 'react'
import { guardarMosaicos } from '@/app/(app)/ajustes/acciones'
import { MOSAICOS } from '@/lib/vista/registro'
import { acomodarMosaicos } from '@/lib/vista/resolver'

export type ItemHoy = { id: string; nombre: string; clase: string; obligatorio?: boolean; visible: boolean; nodo: React.ReactNode }

type Props = { items: ItemHoy[]; editable: boolean }

// Los mosaicos son de tamaños distintos: en vez de estirarlos para que quepan en el hueco de otro
// (eso los deformaba), el orden cambia en vivo y la rejilla se reacomoda sola; cada mosaico se
// desliza a su lugar nuevo y el que arrastras flota encima tal cual.
const sinTransformar: SortingStrategy = () => null
const siempreAnimar: AnimateLayoutChanges = (args) => defaultAnimateLayoutChanges({ ...args, wasDragging: true })
const TRANSICION = { duration: 340, easing: 'cubic-bezier(.16,1,.3,1)' }

/** Con puntero: solo cuenta el mosaico bajo el dedo (en los huecos no pasa nada). Con teclado, el más cercano. */
const deteccion: CollisionDetection = (args) => (args.pointerCoordinates ? pointerWithin(args) : closestCenter(args))

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
  const [activo, setActivo] = useState<string | null>(null)
  // Tras un intercambio, el mismo mosaico no vuelve a intercambiarse hasta que el puntero salga de él:
  // si no, al reacomodarse queda otra vez bajo el puntero y los dos tiemblan de ida y vuelta.
  const ultimo = useRef<string | null>(null)

  const sensores = useSensors(
    // Mouse y touch por separado: con PointerSensor, deslizar en el teléfono arrastraría.
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // En el teléfono: mantener presionado, para no robarle el desplazamiento a la página.
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function alEmpezar({ active }: DragStartEvent) {
    setActivo(String(active.id))
    ultimo.current = null
  }

  function alPasar({ active, over }: DragOverEvent) {
    const sobre = over ? String(over.id) : null
    if (!sobre || sobre === active.id) return void (ultimo.current = null)
    if (sobre === ultimo.current) return
    ultimo.current = sobre
    setVisibles((lista) => arrayMove(lista, lista.indexOf(String(active.id)), lista.indexOf(sobre)))
  }

  function alTerminar() {
    setActivo(null)
    ultimo.current = null
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
    setAviso('Saving…')
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
              <span className="v-sub">Drag to arrange · × to hide</span>
              <span className="v-aviso" role="status">
                {aviso}
              </span>
              <button type="button" className="v-boton chico" onClick={restablecer}>
                Reset
              </button>
              <button type="button" className="v-boton chico" onClick={cancelar}>
                Cancel
              </button>
              <button type="button" className="v-boton chico primario" onClick={listo} disabled={guardando}>
                Done
              </button>
            </>
          ) : (
            <button type="button" className="v-boton chico" onClick={() => setEditando(true)}>
              ✎ Customize
            </button>
          )}
        </div>
      )}

      {editando ? (
        <DndContext
          sensors={sensores}
          collisionDetection={deteccion}
          onDragStart={alEmpezar}
          onDragOver={alPasar}
          onDragEnd={alTerminar}
          onDragCancel={alTerminar}
        >
          <SortableContext items={visibles} strategy={sinTransformar}>
            {/* El mismo acomodo editorial que fuera de edición: lo que mueves es lo que vas a ver. */}
            <div className="v-bento v-editorial editando">
              {visibles.map((id) => {
                const x = porId.get(id)
                return x && <Arrastrable key={id} item={x} onOcultar={() => ocultar(id)} />
              })}
            </div>
          </SortableContext>
          <DragOverlay dropAnimation={{ duration: 260, easing: 'cubic-bezier(.16,1,.3,1)' }}>
            {activo && porId.get(activo) && (
              <div className="v-editable flotando">
                <div className="v-editable-contenido">{porId.get(activo)!.nodo}</div>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="v-bento v-editorial">{visibles.map((id) => porId.get(id)?.nodo)}</div>
      )}

      {editando && ocultos.length > 0 && (
        <section className="v-ocultos" aria-label="Hidden tiles">
          <span className="v-sub">Hidden · tap to bring them back</span>
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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    animateLayoutChanges: siempreAnimar,
    transition: TRANSICION,
  })
  return (
    <div
      ref={setNodeRef}
      className={`v-editable ${item.clase}`}
      data-arrastrando={isDragging || undefined}
      // Solo se traslada, nunca se escala: así no se deforma.
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...attributes}
      {...listeners}
      aria-label={`Move ${item.nombre}`}
    >
      <div className="v-editable-contenido">{item.nodo}</div>
      {!item.obligatorio && (
        <button
          type="button"
          className="v-quitar"
          aria-label={`Hide ${item.nombre}`}
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
