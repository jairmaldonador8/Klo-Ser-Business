'use client'

import { startTransition, useOptimistic, useRef, useState, useTransition } from 'react'
import { useHoja } from '@/components/hoja/hoja-provider'
import { useToast } from '@/components/tareas/toast'
import { cambiarEstado, editarProyecto, sumarCifra } from '../acciones'
import { CamposProyecto, type FormProyecto } from '../nuevo-proyecto'

/** Los datos del proyecto: se guardan solos al salir de cada campo. */
export function EditarProyecto({ id, inicial }: { id: string; inicial: FormProyecto }) {
  const [form, setForm] = useState(inicial)
  const [aviso, setAviso] = useState('')
  const [, empezar] = useTransition()
  const guardado = useRef(JSON.stringify(inicial))

  function guardar(datos: FormProyecto) {
    const huella = JSON.stringify(datos)
    if (huella === guardado.current) return
    // Sin nombre, o por cifra sin cifra todavía: se espera a que termines de escribir.
    if (!datos.nombre.trim() || (datos.modo_avance === 'manual' && !datos.cifra_meta)) return
    setAviso('')
    empezar(async () => {
      const r = await editarProyecto(id, datos)
      if (!r.ok) return setAviso(r.mensaje)
      guardado.current = huella
      setAviso('Guardado')
    })
  }

  const poner = <K extends keyof FormProyecto>(campo: K, valor: FormProyecto[K]) => {
    const siguiente = { ...form, [campo]: valor }
    setForm(siguiente)
    // Los botones de modo no tienen «salir del campo»: guardan al tocarlos.
    if (campo === 'modo_avance') guardar(siguiente)
  }

  return (
    <div className="v-formulario">
      <CamposProyecto form={form} poner={poner} prefijo="proyecto" alSalir={() => guardar(form)} />
      <p className="v-aviso" role="status">
        {aviso}
      </p>
    </div>
  )
}

/** +1 (por cifra) y Pausar / Reactivar / Archivar. */
export function ControlesProyecto({ id, estado, manual }: { id: string; estado: string; manual: boolean }) {
  const avisar = useToast()
  const [estadoVista, setEstadoVista] = useOptimistic(estado)

  function sumar() {
    startTransition(async () => {
      const r = await sumarCifra(id, 1)
      if (!r.ok) return avisar(r.mensaje)
      avisar('Sumaste 1', () => startTransition(() => void sumarCifra(id, -1)))
    })
  }

  function cambiar(nuevo: 'activo' | 'pausado' | 'cerrado', texto: string) {
    const antes = estado
    startTransition(async () => {
      setEstadoVista(nuevo)
      const r = await cambiarEstado(id, nuevo)
      if (!r.ok) return avisar(r.mensaje)
      avisar(texto, () => startTransition(() => void cambiarEstado(id, antes)))
    })
  }

  return (
    <div className="v-fila" style={{ justifyContent: 'flex-start', flexWrap: 'wrap', marginTop: 'auto' }}>
      {manual && estadoVista === 'activo' && (
        <button type="button" className="v-boton primario chico" onClick={sumar}>
          +1
        </button>
      )}
      {estadoVista === 'activo' ? (
        <button type="button" className="v-boton chico" onClick={() => cambiar('pausado', 'Proyecto en pausa')}>
          Pausar
        </button>
      ) : (
        <button type="button" className="v-boton chico" onClick={() => cambiar('activo', 'Proyecto activo otra vez')}>
          Reactivar
        </button>
      )}
      {estadoVista !== 'cerrado' && (
        <button type="button" className="v-boton chico" onClick={() => cambiar('cerrado', 'Proyecto archivado')}>
          Archivar
        </button>
      )}
      {estadoVista !== 'activo' && <span className="v-sub">{estadoVista === 'pausado' ? 'En pausa' : 'Archivado'}</span>}
    </div>
  )
}

export function AgregarTarea({ espacioId, proyectoId }: { espacioId: string; proyectoId: string }) {
  const abrir = useHoja()
  return (
    <button type="button" className="v-boton chico" onClick={() => abrir({ valores: { espacio_id: espacioId, proyecto_id: proyectoId } })}>
      Agregar tarea
    </button>
  )
}
