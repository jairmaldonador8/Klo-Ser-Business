import Link from 'next/link'
import { notFound } from 'next/navigation'
import { z } from 'zod'
import { RenglonTarea } from '@/components/tareas/renglon-tarea'
import { contextoAhora } from '@/lib/datos'
import { etiquetaDia } from '@/lib/fechas'
import { esColor } from '@/lib/frentes'
import { avance, cuenta, porcentaje, textoFaltan } from '@/lib/proyectos/avance'
import { conFrente } from '@/lib/rutas'
import { crearClienteServidor } from '@/lib/supabase/servidor'
import { hhmm, type Clase, type Tarea } from '@/lib/tareas/esquema'
import { AgregarTarea, ControlesProyecto, EditarProyecto } from './editar-proyecto'

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ frente?: string | string[] }> }

export default async function DetalleProyecto({ params, searchParams }: Props) {
  const [{ id }, { frente: crudo }] = await Promise.all([params, searchParams])
  if (!z.uuid().safeParse(id).success) notFound()
  const atajo = typeof crudo === 'string' ? crudo : null

  const supabase = await crearClienteServidor()
  const [{ data: p }, { data: filas }, ctx] = await Promise.all([
    supabase
      .from('proyectos')
      .select('id, espacio_id, nombre, meta, fecha_inicio, fecha_meta, modo_avance, cifra_actual, cifra_meta, estado, espacios(nombre, inicial, color)')
      .eq('id', id)
      .maybeSingle(),
    supabase
      .from('tareas')
      .select('id, espacio_id, titulo, clase, fecha, hora, hora_fin, proyecto_id, completada_en')
      .eq('proyecto_id', id)
      .is('borrado_en', null)
      .order('fecha', { nullsFirst: false })
      .order('hora', { nullsFirst: true }),
    contextoAhora(),
  ])
  if (!p) notFound()

  const tareas: Tarea[] = (filas ?? []).map((t) => ({ ...t, clase: t.clase as Clase }))
  const conteo = { total: tareas.length, hechas: tareas.filter((t) => t.completada_en).length }
  // Hitos aún no existe en la app: se muestra como «por tareas».
  const modo = p.modo_avance === 'manual' ? 'manual' : 'tareas'
  const proyecto = { ...p, modo_avance: modo, cifra_actual: Number(p.cifra_actual), cifra_meta: p.cifra_meta === null ? null : Number(p.cifra_meta) } as const
  const x = avance(proyecto, conteo)
  const frente = p.espacios
  const color = frente && esColor(frente.color) ? frente.color : 'azul'

  const vencida = (t: Tarea) => !t.completada_en && t.fecha !== null && t.fecha < ctx.hoy
  const detalle = (t: Tarea) => (t.fecha ? `${etiquetaDia(t.fecha, ctx.hoy)}${t.hora ? ' ' + hhmm(t.hora) : ''}` : 'sin fecha')

  return (
    <section className="v-bento">
      <section className="v-t c2 r2" aria-label="Datos del proyecto">
        <div className="v-fila">
          <Link href={conFrente('/proyectos', atajo)} className="v-chip">
            ← Proyectos
          </Link>
          {frente && (
            <span className="v-chip">
              <i className={`v-inicial v-color-${color}`} aria-hidden>
                {frente.inicial}
              </i>
              {frente.nombre}
            </span>
          )}
        </div>
        <EditarProyecto
          key={p.id}
          id={p.id}
          inicial={{
            nombre: p.nombre,
            meta: p.meta,
            fecha_meta: p.fecha_meta ?? '',
            modo_avance: modo,
            cifra_meta: p.cifra_meta === null ? '' : String(p.cifra_meta),
          }}
        />
      </section>

      <section className="v-t c2" aria-label="Avance">
        <div className="v-fila">
          <h3>Avance</h3>
          <span className="v-sub">{textoFaltan(p.fecha_meta, ctx.hoy)}</span>
        </div>
        <div className="v-fila" style={{ alignItems: 'flex-end' }}>
          <span className="v-cifra">{porcentaje(x)}</span>
          <span className="v-sub">{cuenta({ ...proyecto, ...conteo })}</span>
        </div>
        <div className="v-barra-avance" role="progressbar" aria-label={`Avance de ${p.nombre}`} aria-valuenow={Math.floor(x * 100)} aria-valuemin={0} aria-valuemax={100}>
          <i style={{ width: `${x * 100}%` }} />
        </div>
        <ControlesProyecto id={p.id} estado={p.estado} manual={modo === 'manual'} />
      </section>

      <section className="v-t c2" aria-label="Tareas del proyecto">
        <div className="v-fila">
          <h3>Tareas</h3>
          {p.estado === 'activo' && <AgregarTarea espacioId={p.espacio_id} proyectoId={p.id} />}
        </div>
        {tareas.length ? (
          <ul className="v-lista">
            {tareas.map((t) => (
              <RenglonTarea key={t.id} tarea={t} detalle={detalle(t)} vencida={vencida(t)} />
            ))}
          </ul>
        ) : (
          <p className="v-sub">
            {modo === 'tareas' ? 'Agrega tareas y el avance se mide con las que palomees.' : 'Aún no hay tareas ligadas a este proyecto.'}
          </p>
        )}
      </section>
    </section>
  )
}
