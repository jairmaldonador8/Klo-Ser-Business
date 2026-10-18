import Link from 'next/link'
import { Vacio } from '@/components/armazon/vacio'
import { contextoAhora, leerProyectos, type ProyectoLista } from '@/lib/datos'
import { esColor, frenteAbierto, type FrenteVista } from '@/lib/frentes'
import { avance, cuenta, porcentaje, textoFaltan } from '@/lib/proyectos/avance'
import { conFrente } from '@/lib/rutas'
import { crearClienteServidor } from '@/lib/supabase/servidor'
import { NuevoProyecto } from './nuevo-proyecto'

type Props = { searchParams: Promise<{ frente?: string | string[] }> }

const ESTADO: Record<string, string> = { activo: 'Activo', pausado: 'En pausa', cerrado: 'Archivado' }

function Tarjeta({ p, frente, hoy, atajo }: { p: ProyectoLista; frente?: FrenteVista; hoy: string; atajo: string | null }) {
  const x = avance(p, p)
  return (
    <Link href={conFrente('/proyectos/' + p.id, atajo)} className="v-t c2" aria-label={`${p.nombre}, ${porcentaje(x)}`}>
      <div className="v-fila">
        <div className="v-fila" style={{ justifyContent: 'flex-start', minWidth: 0 }}>
          {frente && (
            <span className={`v-foto v-color-${frente.color}`} style={{ width: 28, height: 28, fontSize: 14, borderRadius: 9 }} title={frente.nombre}>
              {frente.inicial}
            </span>
          )}
          <h3 style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nombre}</h3>
        </div>
        <span className="v-chip">{p.estado === 'activo' ? porcentaje(x) : ESTADO[p.estado]}</span>
      </div>
      {p.meta && <p className="v-sub">{p.meta}</p>}
      <div className="v-barra-avance" role="progressbar" aria-label={`Avance de ${p.nombre}`} aria-valuenow={Math.floor(x * 100)} aria-valuemin={0} aria-valuemax={100}>
        <i style={{ width: `${x * 100}%` }} />
      </div>
      <div className="v-fila">
        <small className="v-sub">{cuenta(p)}</small>
        <small className="v-sub">{textoFaltan(p.fecha_meta, hoy)}</small>
      </div>
    </Link>
  )
}

export default async function Proyectos({ searchParams }: Props) {
  const { frente: crudo } = await searchParams
  const supabase = await crearClienteServidor()
  const { data: espacios } = await supabase.from('espacios').select('id, nombre, inicial, atajo, color').order('orden')
  const frentes: FrenteVista[] = (espacios ?? []).map((e) => ({ ...e, color: esColor(e.color) ? e.color : 'azul' }))
  const frente = frenteAbierto(frentes, typeof crudo === 'string' ? crudo : null)
  const atajo = frente?.atajo ?? null
  const [proyectos, ctx] = await Promise.all([leerProyectos({ espacioId: frente?.id, soloActivos: false }), contextoAhora()])

  const frenteDe = new Map(frentes.map((f) => [f.id, f]))
  const activos = proyectos.filter((p) => p.estado === 'activo')
  const resto = proyectos.filter((p) => p.estado !== 'activo')
  const tarjeta = (p: ProyectoLista) => <Tarjeta key={p.id} p={p} frente={frenteDe.get(p.espacio_id)} hoy={ctx.hoy} atajo={atajo} />

  return (
    <section className="v-bento">
      <NuevoProyecto key={frente?.id ?? 'todos'} frentes={frentes} abierto={frente?.id ?? null} atajo={atajo} activos={activos.length} />
      {activos.map(tarjeta)}
      {resto.length > 0 && (
        <details className="v-t c2">
          <summary>
            <h3>Pausados y archivados</h3>
            <span className="v-sub" style={{ marginLeft: 'auto' }}>
              {resto.length}
            </span>
          </summary>
          <div className="v-lista">
            {resto.map((p) => (
              <Link key={p.id} href={conFrente('/proyectos/' + p.id, atajo)} className="v-proyecto">
                <div className="v-fila">
                  <b>{p.nombre}</b>
                  <span className="v-sub">{ESTADO[p.estado]}</span>
                </div>
                <small className="v-sub">
                  {porcentaje(avance(p, p))} · {cuenta(p)}
                </small>
              </Link>
            ))}
          </div>
        </details>
      )}
      {proyectos.length === 0 && (
        <div className="c2">
          <Vacio antes="Tus metas, con" palabra="avance" texto="Cada proyecto con su meta, su fecha y su siguiente paso." />
        </div>
      )}
    </section>
  )
}
