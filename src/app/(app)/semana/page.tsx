import { RenglonTarea } from '@/components/tareas/renglon-tarea'
import { MosaicoLista } from '@/components/vidrio/mosaicos'
import { contextoAhora, leerMisTareas } from '@/lib/datos'
import { etiquetaDia } from '@/lib/fechas'
import { esColor, frenteAbierto, type FrenteVista } from '@/lib/frentes'
import { agruparPendientes, type Grupo } from '@/lib/semana/agrupar'
import { crearClienteServidor } from '@/lib/supabase/servidor'
import { hhmm, nombreClase, type Tarea } from '@/lib/tareas/esquema'

type Props = { searchParams: Promise<{ frente?: string | string[] }> }

/** Los grupos que ocupan dos columnas: lo que pesa (vencidas, hoy) y las colas largas. */
const ANCHO_DOBLE = new Set(['vencidas', 'despues', 'sin-fecha'])

const mayuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** Tus pendientes por fecha: vencidas, la semana día por día, más adelante y sin fecha. */
export default async function Semana({ searchParams }: Props) {
  const { frente: atajo } = await searchParams
  const supabase = await crearClienteServidor()
  const [{ data: espacios }, ctx] = await Promise.all([
    supabase.from('espacios').select('id, nombre, inicial, atajo, color').order('orden'),
    contextoAhora(),
  ])
  const frentes: FrenteVista[] = (espacios ?? []).map((e) => ({ ...e, color: esColor(e.color) ? e.color : 'azul' }))
  const frente = frenteAbierto(frentes, typeof atajo === 'string' ? atajo : null)
  const tareas = await leerMisTareas(frente?.id)
  const grupos = agruparPendientes(tareas, ctx.hoy)
  const frenteDe = new Map(frentes.map((f) => [f.id, f]))

  const rango = (t: Tarea) => [hhmm(t.hora), hhmm(t.hora_fin)].filter(Boolean).join('–')
  const detalle = (g: Grupo, t: Tarea): string => {
    if (g.clave === 'vencidas') return `overdue · ${etiquetaDia(t.fecha!, ctx.hoy)}`
    if (g.clave === 'despues') return etiquetaDia(t.fecha!, ctx.hoy)
    if (g.clave === 'sin-fecha') return nombreClase(t.clase)
    return rango(t) || nombreClase(t.clase)
  }

  return (
    <section className="v-bento v-agenda">
      {grupos.map((g, i) => {
        const doble = ANCHO_DOBLE.has(g.clave) || g.marca === 'today'
        const vacio = g.marca === 'today' ? 'Nothing left today.' : 'Free.'
        return (
          <MosaicoLista
            key={g.clave}
            titulo={mayuscula(g.titulo)}
            vacio={vacio}
            ancho={doble ? 2 : 1}
            chip={g.marca ? `${g.marca}${g.tareas.length ? ` · ${g.tareas.length}` : ''}` : g.tareas.length ? String(g.tareas.length) : undefined}
            i={i}
          >
            {g.tareas.map((t) => (
              <RenglonTarea
                key={t.id}
                tarea={t}
                frente={frente ? undefined : frenteDe.get(t.espacio_id)}
                detalle={detalle(g, t)}
                vencida={g.clave === 'vencidas'}
              />
            ))}
          </MosaicoLista>
        )
      })}
    </section>
  )
}
