'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import type { FrenteVista } from '@/lib/frentes'
import { conFrente } from '@/lib/rutas'
import { crearProyecto } from './acciones'

export type FormProyecto = { nombre: string; meta: string; fecha_meta: string; modo_avance: 'tareas' | 'manual'; cifra_meta: string }

type Campos = {
  form: FormProyecto
  poner: <K extends keyof FormProyecto>(campo: K, valor: FormProyecto[K]) => void
  /** Prefijo de los id (hay un formulario en la rejilla y otro en el detalle). */
  prefijo: string
  /** En el detalle se guarda al salir de cada campo. */
  alSalir?: () => void
}

/** Los campos que comparten el alta y el detalle. */
export function CamposProyecto({ form, poner, prefijo, alSalir }: Campos) {
  return (
    <>
      <label className="etq" htmlFor={`${prefijo}-nombre`}>
        Nombre
      </label>
      <input
        id={`${prefijo}-nombre`}
        className="v-campo"
        maxLength={80}
        placeholder="Por ejemplo, Lanzar la tienda"
        value={form.nombre}
        onChange={(e) => poner('nombre', e.target.value)}
        onBlur={alSalir}
      />

      <label className="etq" htmlFor={`${prefijo}-meta`}>
        Meta
      </label>
      <input
        id={`${prefijo}-meta`}
        className="v-campo"
        maxLength={200}
        placeholder="¿Qué quieres lograr?"
        value={form.meta}
        onChange={(e) => poner('meta', e.target.value)}
        onBlur={alSalir}
      />

      <label className="etq" htmlFor={`${prefijo}-fecha`}>
        Fecha meta
      </label>
      <input id={`${prefijo}-fecha`} type="date" className="v-campo" value={form.fecha_meta} onChange={(e) => poner('fecha_meta', e.target.value)} onBlur={alSalir} />

      <span className="etq">Cómo mides el avance</span>
      <div className="grupo" aria-label="Cómo mides el avance">
        <button type="button" className="v-boton chico" aria-pressed={form.modo_avance === 'tareas'} onClick={() => poner('modo_avance', 'tareas')}>
          Por tareas
        </button>
        <button type="button" className="v-boton chico" aria-pressed={form.modo_avance === 'manual'} onClick={() => poner('modo_avance', 'manual')}>
          Por cifra
        </button>
      </div>

      {form.modo_avance === 'manual' && (
        <>
          <label className="etq" htmlFor={`${prefijo}-cifra`}>
            Cifra meta
          </label>
          <input
            id={`${prefijo}-cifra`}
            type="number"
            inputMode="decimal"
            min={1}
            className="v-campo"
            placeholder="Por ejemplo, 60"
            value={form.cifra_meta}
            onChange={(e) => poner('cifra_meta', e.target.value)}
            onBlur={alSalir}
          />
        </>
      )}
    </>
  )
}

const VACIO: FormProyecto = { nombre: '', meta: '', fecha_meta: '', modo_avance: 'tareas', cifra_meta: '' }

type Props = { frentes: FrenteVista[]; abierto: string | null; atajo: string | null; activos: number }

/** El mosaico de arriba de la rejilla: cuántos llevas y el alta corta. */
export function NuevoProyecto({ frentes, abierto, atajo, activos }: Props) {
  const router = useRouter()
  const [abiertoForm, setAbiertoForm] = useState(false)
  const [form, setForm] = useState(VACIO)
  const [espacio, setEspacio] = useState(abierto ?? frentes[0]?.id ?? '')
  const [aviso, setAviso] = useState('')
  const [ocupado, empezar] = useTransition()
  const poner = <K extends keyof FormProyecto>(campo: K, valor: FormProyecto[K]) => setForm((f) => ({ ...f, [campo]: valor }))

  function crear(e: React.FormEvent) {
    e.preventDefault()
    setAviso('')
    empezar(async () => {
      const r = await crearProyecto({ ...form, espacio_id: espacio })
      if (!r.ok) return setAviso(r.mensaje)
      router.push(conFrente('/proyectos/' + r.id, atajo))
    })
  }

  return (
    <section className="v-t c2" aria-label="Nuevo proyecto">
      <div className="v-fila">
        <div>
          <h3>Tus proyectos</h3>
          <p className="v-sub">{activos === 0 ? 'Aún no tienes proyectos activos.' : activos === 1 ? '1 activo' : `${activos} activos`}</p>
        </div>
        {!abiertoForm && (
          <button type="button" className="v-boton primario chico" onClick={() => setAbiertoForm(true)}>
            Nuevo proyecto
          </button>
        )}
      </div>

      {abiertoForm && (
        <form className="v-formulario" onSubmit={crear}>
          <CamposProyecto form={form} poner={poner} prefijo="nuevo" />

          {frentes.length > 1 && (
            <>
              <span className="etq">Frente</span>
              <div className="grupo" role="radiogroup" aria-label="Frente">
                {frentes.map((f) => (
                  <button key={f.id} type="button" role="radio" className="v-boton chico" aria-checked={espacio === f.id} onClick={() => setEspacio(f.id)}>
                    <span className={`v-foto v-color-${f.color}`} style={{ width: 20, height: 20, fontSize: 11, borderRadius: 6 }}>
                      {f.inicial}
                    </span>
                    {f.nombre}
                  </button>
                ))}
              </div>
            </>
          )}

          <p className="v-aviso" role="status">
            {aviso}
          </p>
          <div className="v-fila" style={{ justifyContent: 'flex-start' }}>
            <button type="submit" className="v-boton primario chico" disabled={ocupado || !form.nombre.trim()}>
              {ocupado ? 'Creando…' : 'Crear proyecto'}
            </button>
            <button
              type="button"
              className="v-boton chico"
              onClick={() => {
                setAbiertoForm(false)
                setForm(VACIO)
                setAviso('')
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
