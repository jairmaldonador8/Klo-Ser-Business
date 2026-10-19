'use client'

import { startTransition, useEffect, useRef, useState, useTransition } from 'react'
import { guardarActividades } from '@/app/(app)/ajustes/acciones'
import { borrarTarea, completarTarea, guardarTarea, type Resultado } from '@/app/(app)/tareas/acciones'
import { sumarDias } from '@/lib/fechas'
import { useToast } from '@/components/tareas/toast'
import type { FrenteVista } from '@/lib/frentes'
import { CLASES, hhmm, MAX_ACTIVIDAD, nombreClase, type Clase } from '@/lib/tareas/esquema'
import type { Apertura, ProyectoOpcion } from './hoja-provider'

type Formulario = {
  titulo: string
  clase: Clase
  espacio_id: string
  fecha: string
  hora: string
  hora_fin: string
  /** Si termina otro día; vacío = el mismo día. */
  fecha_fin: string
  proyecto_id: string
}

function inicial({ tarea, valores = {} }: Apertura, frentes: FrenteVista[], hoy: string): Formulario {
  const base = tarea ?? valores
  const espacio = base.espacio_id && frentes.some((f) => f.id === base.espacio_id) ? base.espacio_id : (frentes[0]?.id ?? '')
  return {
    titulo: base.titulo ?? '',
    clase: base.clase ?? 'tarea',
    espacio_id: espacio,
    // En una nueva, la fecha por defecto es hoy; «Sin fecha» la quita.
    fecha: tarea ? (tarea.fecha ?? '') : valores.fecha === undefined ? hoy : (valores.fecha ?? ''),
    hora: hhmm(base.hora ?? null) ?? '',
    hora_fin: hhmm(base.hora_fin ?? null) ?? '',
    fecha_fin: base.fecha_fin ?? '',
    proyecto_id: base.proyecto_id ?? '',
  }
}

export function HojaTarea({
  apertura,
  frentes,
  proyectos,
  actividades,
  hoy,
  cerrar,
}: {
  apertura: Apertura
  frentes: FrenteVista[]
  proyectos: ProyectoOpcion[]
  /** Las actividades propias de tu perfil, además de las de siempre. */
  actividades: string[]
  /** Hoy en la zona de tu perfil (no la del navegador). */
  hoy: string
  cerrar: () => void
}) {
  const { tarea, notaId } = apertura
  const dialogo = useRef<HTMLDialogElement>(null)
  const [form, setForm] = useState(() => inicial(apertura, frentes, hoy))
  const [aviso, setAviso] = useState('')
  const [ocupada, empezar] = useTransition()
  const avisar = useToast()
  const manana = sumarDias(hoy, 1)
  const delFrente = proyectos.filter((p) => p.espacio_id === form.espacio_id)
  const [propias, setPropias] = useState(actividades)
  const [nueva, setNueva] = useState<string | null>(null)
  // Las de siempre, las tuyas y, si la tarea trae una que ya quitaste, también esa.
  const opciones = [...CLASES, ...propias, ...(CLASES.includes(form.clase as never) || propias.includes(form.clase) ? [] : [form.clase])]

  function agregarActividad() {
    const nombre = (nueva ?? '').trim().replace(/\s+/g, ' ')
    setNueva(null)
    if (!nombre) return
    const existente = opciones.find((o) => nombreClase(o).toLowerCase() === nombre.toLowerCase())
    if (existente) return poner('clase', existente)
    const lista = [...propias, nombre]
    setPropias(lista)
    poner('clase', nombre)
    startTransition(async () => {
      const r = await guardarActividades(lista)
      if (!r.ok) setAviso(r.mensaje)
    })
  }

  useEffect(() => {
    const d = dialogo.current
    if (d && !d.open) d.showModal()
  }, [])

  const poner = <K extends keyof Formulario>(campo: K, valor: Formulario[K]) => setForm((f) => ({ ...f, [campo]: valor }))

  function correr(accion: () => Promise<Resultado>, despues?: () => void) {
    setAviso('')
    empezar(async () => {
      const r = await accion()
      if (!r.ok) return setAviso(r.mensaje)
      cerrar()
      despues?.()
    })
  }

  const guardar = () => correr(() => guardarTarea({ ...form, id: tarea?.id ?? '' }, notaId))

  return (
    <dialog
      ref={dialogo}
      className="v-hoja"
      aria-label={tarea ? 'Edit task' : 'New task'}
      onClose={cerrar}
      // Tocar el fondo (fuera del panel) la cierra.
      onClick={(e) => e.target === e.currentTarget && dialogo.current?.close()}
    >
      <form
        className="cuerpo"
        onSubmit={(e) => {
          e.preventDefault()
          guardar()
        }}
      >
        <h3>{tarea ? 'Task' : 'New task'}</h3>

        {/* Enter en el título envía el formulario. */}
        <input
          className="v-campo"
          autoFocus
          maxLength={200}
          placeholder="What needs to be done?"
          aria-label="Title"
          value={form.titulo}
          onChange={(e) => poner('titulo', e.target.value)}
        />

        <span className="etq">Activity</span>
        <div className="grupo" aria-label="Activity">
          {opciones.map((c) => (
            <button key={c} type="button" className="v-boton chico" aria-pressed={form.clase === c} onClick={() => poner('clase', c)}>
              {nombreClase(c)}
            </button>
          ))}
          {nueva === null ? (
            <button type="button" className="v-boton chico" aria-label="New activity" onClick={() => setNueva('')}>
              ＋
            </button>
          ) : (
            <input
              className="v-campo chico"
              autoFocus
              maxLength={MAX_ACTIVIDAD}
              placeholder="New activity"
              aria-label="New activity name"
              value={nueva}
              onChange={(e) => setNueva(e.target.value)}
              onBlur={agregarActividad}
              onKeyDown={(e) => {
                // Enter agrega la actividad, no envía el formulario.
                if (e.key === 'Enter') {
                  e.preventDefault()
                  e.currentTarget.blur()
                }
                if (e.key === 'Escape') {
                  e.preventDefault()
                  setNueva(null)
                }
              }}
            />
          )}
        </div>

        {/* Desde una nota, el frente es el de la nota: la tarea y la nota van juntas. */}
        {frentes.length > 1 && !notaId && (
          <>
            <span className="etq">Space</span>
            <div className="grupo" role="radiogroup" aria-label="Space">
              {frentes.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  role="radio"
                  className="v-boton chico"
                  aria-checked={form.espacio_id === f.id}
                  // Al cambiar de frente se limpia el proyecto: era de otro frente.
                  onClick={() => setForm((x) => (x.espacio_id === f.id ? x : { ...x, espacio_id: f.id, proyecto_id: '' }))}
                >
                  <span className={`v-foto v-color-${f.color}`} style={{ width: 20, height: 20, fontSize: 11, borderRadius: 6 }}>
                    {f.inicial}
                  </span>
                  {f.nombre}
                </button>
              ))}
            </div>
          </>
        )}

        <label className="etq" htmlFor="hoja-fecha">
          {form.fecha_fin ? 'Starts' : 'Date'}
        </label>
        <div className="grupo">
          <input id="hoja-fecha" type="date" className="v-campo" value={form.fecha} onChange={(e) => poner('fecha', e.target.value)} />
          <button type="button" className="v-boton chico" aria-pressed={form.fecha === hoy} onClick={() => poner('fecha', hoy)}>
            Today
          </button>
          <button type="button" className="v-boton chico" aria-pressed={form.fecha === manana} onClick={() => poner('fecha', manana)}>
            Tomorrow
          </button>
          <button
            type="button"
            className="v-boton chico"
            aria-pressed={form.fecha === ''}
            // Sin fecha no puede haber hora ni fin en otro día.
            onClick={() => setForm((x) => ({ ...x, fecha: '', hora: '', hora_fin: '', fecha_fin: '' }))}
          >
            No date
          </button>
        </div>

        <span className="etq">Time</span>
        <div className="grupo">
          <input type="time" className="v-campo" aria-label="Start time" value={form.hora} onChange={(e) => poner('hora', e.target.value)} />
          <input type="time" className="v-campo" aria-label="End time" value={form.hora_fin} onChange={(e) => poner('hora_fin', e.target.value)} />
        </div>

        {/* Termina otro día (lunes 5 pm → martes 4 pm): un solo evento. */}
        {form.fecha_fin ? (
          <>
            <label className="etq" htmlFor="hoja-fecha-fin">
              Ends
            </label>
            <div className="grupo">
              <input
                id="hoja-fecha-fin"
                type="date"
                className="v-campo"
                min={form.fecha || undefined}
                value={form.fecha_fin}
                onChange={(e) => poner('fecha_fin', e.target.value)}
              />
              <button type="button" className="v-boton chico" onClick={() => poner('fecha_fin', '')}>
                Same day
              </button>
            </div>
          </>
        ) : (
          form.fecha && (
            <div className="grupo">
              <button type="button" className="v-boton chico" onClick={() => poner('fecha_fin', sumarDias(form.fecha, 1))}>
                ＋ Ends another day
              </button>
            </div>
          )
        )}

        {delFrente.length > 0 && (
          <>
            <label className="etq" htmlFor="hoja-proyecto">
              Project
            </label>
            <select id="hoja-proyecto" className="v-campo" value={form.proyecto_id} onChange={(e) => poner('proyecto_id', e.target.value)}>
              <option value="">No project</option>
              {delFrente.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </>
        )}

        <p className="v-aviso" role="status">
          {aviso}
        </p>

        <div className="pie">
          <button type="submit" className="v-boton primario" disabled={ocupada}>
            {ocupada ? 'Saving…' : 'Save'}
          </button>
          {tarea && (
            <>
              <button type="button" className="v-boton" disabled={ocupada} onClick={() => correr(() => completarTarea(tarea.id, !tarea.completada_en))}>
                {tarea.completada_en ? 'Reopen' : 'Complete'}
              </button>
              <button
                type="button"
                className="v-boton"
                disabled={ocupada}
                onClick={() =>
                  correr(
                    () => borrarTarea(tarea.id),
                    // La hoja ya se cerró: el Deshacer corre fuera de ella y avisa si falla.
                    () =>
                      avisar('Deleted', () =>
                        startTransition(async () => {
                          const d = await borrarTarea(tarea.id, false)
                          if (!d.ok) avisar(d.mensaje)
                        }),
                      ),
                  )
                }
              >
                Delete
              </button>
            </>
          )}
          <button type="button" className="v-boton" onClick={() => dialogo.current?.close()}>
            Cancel
          </button>
        </div>
      </form>
    </dialog>
  )
}
