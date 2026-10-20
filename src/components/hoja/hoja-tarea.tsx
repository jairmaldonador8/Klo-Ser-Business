'use client'

import { Bell, CalendarDays, CalendarRange, Clock, Folder, Layers, Palette, Repeat, Shapes, type LucideIcon } from 'lucide-react'
import { startTransition, useEffect, useRef, useState, useTransition } from 'react'
import { guardarActividades } from '@/app/(app)/ajustes/acciones'
import { borrarTarea, completarTarea, guardarTarea, type Resultado } from '@/app/(app)/tareas/acciones'
import { marcar, soltar } from '@/lib/tareas/marcas'
import { borrarDesdeAqui, borrarTodas, cambiarDesdeAqui, cambiarFin, cambiarTodas, crearEnVariosDias, crearRepetida, leerSerie, soloEsta } from '@/app/(app)/tareas/repetir'
import { mismaRegla } from '@/lib/repetir'
import { sumarDias } from '@/lib/fechas'
import { useToast } from '@/components/tareas/toast'
import type { FrenteVista } from '@/lib/frentes'
import { CLASES, hhmm, MAX_ACTIVIDAD, nombreClase, type Clase } from '@/lib/tareas/esquema'
import { useHojaViva, type Apertura, type ProyectoOpcion } from './hoja-provider'
import { SelectorColor } from './selector-color'
import { SelectorRepetir, type Repetir } from './selector-repetir'

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
  /** '' = el color de su space. */
  color: string
  /** Minutos antes para el aviso push; '' = sin aviso. */
  aviso_min: string
}

const AVISOS = [
  ['', 'None'],
  ['0', 'At start'],
  ['5', '5 min before'],
  ['10', '10 min before'],
  ['15', '15 min before'],
  ['30', '30 min before'],
  ['60', '1 hour before'],
] as const

/** Una propiedad de la task: ícono y nombre a la izquierda, el control a la derecha. */
function Prop({ icono: Icono, etq, htmlFor, children }: { icono: LucideIcon; etq: string; htmlFor?: string; children: React.ReactNode }) {
  const nombre = (
    <>
      <Icono size={14} strokeWidth={2} aria-hidden />
      {etq}
    </>
  )
  return (
    <div className="prop">
      {htmlFor ? (
        <label className="etq" htmlFor={htmlFor}>
          {nombre}
        </label>
      ) : (
        <span className="etq">{nombre}</span>
      )}
      <div className="valor">{children}</div>
    </div>
  )
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
    color: base.color ?? '',
    // Sin dato (task nueva o leída sin la columna) = 10 min, como la base.
    aviso_min: base.aviso_min === null ? '' : String(base.aviso_min ?? 10),
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
  // Calendarizar en varios días (⇧/⌘ al arrastrar): la misma task, una independiente por día.
  const dias = !tarea && apertura.dias && apertura.dias.length > 1 ? apertura.dias : null
  const dialogo = useRef<HTMLDialogElement>(null)
  const [form, setForm] = useState(() => inicial(apertura, frentes, hoy))
  // Cómo llegó: para saber si al salir hay algo que guardar.
  const [original] = useState(() => JSON.stringify(inicial(apertura, frentes, hoy)))
  const { poner: ponerVivo } = useHojaViva()
  const [aviso, setAviso] = useState('')
  // Repetición: la elegida y, si ya era de una serie, la que tenía (para saber si cambió).
  const [repetir, setRepetir] = useState<Repetir>(null)
  const [repetirAntes, setRepetirAntes] = useState<Repetir>(null)
  const [cargandoSerie, setCargandoSerie] = useState(!!tarea?.serie_id)
  // Una task que se repite pregunta a cuáles aplicar: solo esta o esta y las siguientes.
  const [alcance, setAlcance] = useState<'guardar' | 'borrar' | null>(null)
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

  useEffect(() => {
    if (!tarea?.serie_id) return
    leerSerie(tarea.serie_id).then((s) => {
      const v = s ? { regla: s.regla, fin: s.fin } : null
      setRepetir(v)
      setRepetirAntes(v)
      setCargandoSerie(false)
    })
  }, [tarea?.serie_id])

  const repeticionCambio = !(repetir === null && repetirAntes === null) && !(
    repetir &&
    repetirAntes &&
    mismaRegla(repetir.regla, repetirAntes.regla) &&
    repetir.fin.hasta === repetirAntes.fin.hasta &&
    repetir.fin.conteo === repetirAntes.fin.conteo
  )

  function correr(accion: () => Promise<Resultado>, despues?: () => void) {
    setAviso('')
    empezar(async () => {
      const r = await accion()
      if (!r.ok) return setAviso(r.mensaje)
      cerrar()
      despues?.()
    })
  }

  // Vista previa en vivo: el calendario pinta el color, el título y la actividad mientras editas, antes de guardar.
  useEffect(() => {
    if (!tarea) return
    ponerVivo({ color: form.color || null, titulo: form.titulo.trim() || tarea.titulo, clase: form.clase })
  }, [tarea, form.color, form.titulo, form.clase, ponerVivo])

  const cambio = JSON.stringify(form) !== original || repeticionCambio

  /** Salir (clic fuera o Esc): lo editado se guarda solo; si es de un grupo, primero pregunta a cuáles. Cancel descarta. */
  function salir() {
    if (ocupada) return
    if (alcance) return setAlcance(null)
    if (!cambio || (!tarea && !form.titulo.trim())) return dialogo.current?.close()
    guardar()
  }

  function guardar() {
    if (dias) return correr(() => crearEnVariosDias(form, dias))
    if (!tarea) return correr(() => (repetir ? crearRepetida(form, repetir.regla, repetir.fin) : guardarTarea({ ...form, id: '' }, notaId)))
    // Solo cambió cómo termina (Never / On date / After): aplica a toda la calendarización, y si además editaste
    // algo de esta task, también se guarda.
    if (repeticionCambio && tarea.serie_id && repetir && repetirAntes && mismaRegla(repetir.regla, repetirAntes.regla)) {
      const soloFin = JSON.stringify(form) === original
      return correr(async () => {
        const r = await cambiarFin(tarea.id, repetir.fin)
        if (!r.ok || soloFin) return r
        return soloEsta(tarea.id, form)
      })
    }
    // Cambiar la regla aplica a esta y las siguientes (como Notion).
    if (repeticionCambio) return correr(() => cambiarDesdeAqui(tarea.id, form, repetir?.regla ?? null, repetir?.fin ?? null))
    if (tarea.serie_id) return setAlcance('guardar')
    correr(() => guardarTarea({ ...form, id: tarea.id }, notaId))
  }

  /** Borrar esta (con Deshacer). */
  const borrarSoloEsta = (t: NonNullable<typeof tarea>) =>
    correr(
      () => borrarTarea(t.id),
      // La hoja ya se cerró: el Deshacer corre fuera de ella y avisa si falla.
      () =>
        avisar('Deleted', () =>
          startTransition(async () => {
            const d = await borrarTarea(t.id, false)
            if (!d.ok) avisar(d.mensaje)
          }),
        ),
    )

  return (
    <dialog
      ref={dialogo}
      className={`v-hoja${tarea ? '' : ' nueva'}`}
      aria-label={tarea ? 'Edit task' : 'New task'}
      onClose={cerrar}
      // Esc o tocar el fondo: salir guardando (ver `salir`).
      onCancel={(e) => {
        e.preventDefault()
        salir()
      }}
      onClick={(e) => e.target === e.currentTarget && salir()}
    >
      <form
        className="cuerpo"
        onSubmit={(e) => {
          e.preventDefault()
          guardar()
        }}
      >
        <header className="hoja-cabeza">
          <span className="hoja-punto" aria-hidden />
          <h3>{tarea ? 'Task' : dias ? `New task · ${dias.length} days` : 'New task'}</h3>
          <button type="button" className="hoja-esc" onClick={salir} aria-label="Close">
            <kbd>esc</kbd>
          </button>
        </header>

        {/* Enter en el título envía el formulario. */}
        <input
          className="v-campo hoja-titulo"
          autoFocus
          maxLength={200}
          placeholder="What needs to be done?"
          aria-label="Title"
          value={form.titulo}
          onChange={(e) => poner('titulo', e.target.value)}
        />

        <div className="props">
        <Prop icono={Shapes} etq="Activity">
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
        </Prop>

        {/* Desde una nota, el frente es el de la nota: la tarea y la nota van juntas. */}
        {frentes.length > 1 && !notaId && (
          <Prop icono={Layers} etq="Space">
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
                  <span className={`v-foto v-color-${f.color}`} style={{ width: 20, height: 20, fontSize: 11, borderRadius: 5 }}>
                    {f.inicial}
                  </span>
                  {f.nombre}
                </button>
              ))}
            </div>
          </Prop>
        )}

        {dias && (
          <Prop icono={CalendarDays} etq="Days">
            <div className="grupo" aria-label="Days">
              {dias.map((d) => (
                <span key={d} className="v-chip v-dia-chip">
                  {new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(`${d}T12:00:00Z`))}
                </span>
              ))}
            </div>
          </Prop>
        )}
        {!dias && (
          <Prop icono={CalendarDays} etq={form.fecha_fin ? 'Starts' : 'Date'} htmlFor="hoja-fecha">
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
          </Prop>
        )}

        <Prop icono={Clock} etq="Time">
        <div className="grupo">
          <input type="time" className="v-campo" aria-label="Start time" value={form.hora} onChange={(e) => poner('hora', e.target.value)} />
          <input type="time" className="v-campo" aria-label="End time" value={form.hora_fin} onChange={(e) => poner('hora_fin', e.target.value)} />
        </div>
        </Prop>

        {form.hora && (
          <Prop icono={Bell} etq="Alert" htmlFor="hoja-aviso">
            <select id="hoja-aviso" className="v-campo" value={form.aviso_min} onChange={(e) => poner('aviso_min', e.target.value)}>
              {/* Un aviso que puso Klo fuera de la lista (p. ej. 20 min) también se ve. */}
              {(AVISOS.some(([v]) => v === form.aviso_min) ? AVISOS : [...AVISOS, [form.aviso_min, `${form.aviso_min} min before`] as const]).map(([valor, texto]) => (
                <option key={valor} value={valor}>
                  {texto}
                </option>
              ))}
            </select>
          </Prop>
        )}

        {/* Termina otro día (lunes 5 pm → martes 4 pm): un solo evento. */}
        {dias ? null : form.fecha_fin ? (
          <Prop icono={CalendarRange} etq="Ends" htmlFor="hoja-fecha-fin">
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
          </Prop>
        ) : (
          form.fecha && (
            <Prop icono={CalendarRange} etq="Ends">
              <div className="grupo">
                <button type="button" className="v-boton chico" onClick={() => poner('fecha_fin', sumarDias(form.fecha, 1))}>
                  ＋ Another day
                </button>
              </div>
            </Prop>
          )
        )}

        <Prop icono={Palette} etq="Color">
          <SelectorColor
            valor={form.color}
            colorEspacio={frentes.find((f) => f.id === form.espacio_id)?.color ?? 'azul'}
            cambiar={(c) => poner('color', c)}
          />
        </Prop>

        {delFrente.length > 0 && (
          <Prop icono={Folder} etq="Project" htmlFor="hoja-proyecto">
            <select id="hoja-proyecto" className="v-campo" value={form.proyecto_id} onChange={(e) => poner('proyecto_id', e.target.value)}>
              <option value="">No project</option>
              {delFrente.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </Prop>
        )}

        {!dias && (
          <Prop icono={Repeat} etq="Repeat">
            {cargandoSerie ? <p className="v-sub">Loading…</p> : <SelectorRepetir fecha={form.fecha} valor={repetir} cambiar={setRepetir} />}
          </Prop>
        )}
        </div>

        <p className="v-aviso" role="status">
          {aviso}
        </p>

        <div className="pie">
          <small className="hoja-pista" aria-hidden>
            Enter to save · Esc to close
          </small>
          {tarea && (
            <>
              <button
                type="button"
                className="v-boton"
                disabled={ocupada}
                onClick={() => {
                  // Al momento en todos los renglones de esta task; si el servidor falla, regresa.
                  const nueva = !tarea.completada_en
                  marcar(tarea.id, nueva)
                  correr(async () => {
                    const r = await completarTarea(tarea.id, nueva)
                    if (!r.ok) soltar(tarea.id)
                    return r
                  })
                }}
              >
                {tarea.completada_en ? 'Reopen' : 'Complete'}
              </button>
              <button
                type="button"
                className="v-boton"
                disabled={ocupada}
                onClick={() => (tarea.serie_id ? setAlcance('borrar') : borrarSoloEsta(tarea))}
              >
                Delete
              </button>
            </>
          )}
          <button type="button" className="v-boton" onClick={() => dialogo.current?.close()}>
            Cancel
          </button>
          <button type="submit" className="v-boton primario" disabled={ocupada}>
            {ocupada ? 'Saving…' : dias ? `Save ${dias.length} tasks` : !tarea && repetir ? 'Save repeating' : 'Save'}
          </button>
        </div>

        {/* A cuáles aplicar: una ventana al centro de la pantalla, como en Notion. */}
        {tarea && alcance && (
          <div className="v-alcance-velo" onClick={(e) => e.target === e.currentTarget && setAlcance(null)}>
            <div className="v-alcance-modal" role="alertdialog" aria-modal="true" aria-labelledby="alcance-titulo">
              <h4 id="alcance-titulo">{alcance === 'borrar' ? 'Delete repeating task' : 'Edit repeating task'}</h4>
              <p>{alcance === 'borrar' ? 'This task is part of a series. Which ones do you want to delete?' : 'This task is part of a series. Apply your changes to:'}</p>
              <button
                type="button"
                className="v-alcance-opcion"
                autoFocus
                disabled={ocupada}
                onClick={() => (alcance === 'borrar' ? borrarSoloEsta(tarea) : correr(() => soloEsta(tarea.id, form)))}
              >
                This task
              </button>
              <button
                type="button"
                className="v-alcance-opcion"
                disabled={ocupada}
                onClick={() =>
                  correr(() => (alcance === 'borrar' ? borrarDesdeAqui(tarea.id) : cambiarDesdeAqui(tarea.id, form, repetirAntes?.regla ?? null, repetirAntes?.fin ?? null)))
                }
              >
                This and following tasks
              </button>
              <button
                type="button"
                className="v-alcance-opcion"
                disabled={ocupada}
                onClick={() => correr(() => (alcance === 'borrar' ? borrarTodas(tarea.id) : cambiarTodas(tarea.id, form)))}
              >
                All tasks
              </button>
              <button type="button" className="v-alcance-cancelar" onClick={() => setAlcance(null)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </form>
    </dialog>
  )
}
