import { Calendario, type Meta } from '@/components/calendario/calendario'
import { contextoAhora, leerProyectos, leerSinFecha, leerTareasRango } from '@/lib/datos'
import { esFecha, esVista, rangoCarga } from '@/lib/calendario/fechas'
import { esColor, frenteAbierto, type FrenteVista } from '@/lib/frentes'
import { avance } from '@/lib/proyectos/avance'
import { crearClienteServidor } from '@/lib/supabase/servidor'

type Props = { searchParams: Promise<{ frente?: string | string[]; fecha?: string | string[]; vista?: string | string[] }> }

/** El calendario: tus tareas con fecha, las metas de tus proyectos y lo que falta por calendarizar. */
export default async function PaginaCalendario({ searchParams }: Props) {
  const { frente: atajo, fecha: f, vista: v } = await searchParams
  const supabase = await crearClienteServidor()
  const [{ data: espacios }, ctx] = await Promise.all([
    supabase.from('espacios').select('id, nombre, inicial, atajo, color').order('orden'),
    contextoAhora(),
  ])
  const frentes: FrenteVista[] = (espacios ?? []).map((e) => ({ ...e, color: esColor(e.color) ? e.color : 'azul' }))
  const frente = frenteAbierto(frentes, typeof atajo === 'string' ? atajo : null)
  const fecha = esFecha(f) ? f : ctx.hoy
  const rango = rangoCarga(fecha)

  const [tareas, sinFecha, proyectos] = await Promise.all([
    leerTareasRango(rango.desde, rango.hasta, frente?.id),
    leerSinFecha(frente?.id),
    leerProyectos({ espacioId: frente?.id }),
  ])
  const metas: Meta[] = proyectos
    .filter((p) => p.fecha_meta)
    .map((p) => ({
      id: p.id,
      espacio_id: p.espacio_id,
      nombre: p.nombre,
      fecha_inicio: p.fecha_inicio,
      fecha_meta: p.fecha_meta!,
      avance: avance(p, p),
    }))

  return (
    <Calendario
      // Al cambiar de rango llegan datos nuevos; la vista y la fecha viven en el cliente.
      tareas={tareas}
      sinFecha={sinFecha}
      metas={metas}
      frentes={frentes}
      frente={frente}
      rango={rango}
      fechaInicial={fecha}
      vistaInicial={esVista(v) ? v : null}
      hoy={ctx.hoy}
      zona={ctx.zona}
    />
  )
}
