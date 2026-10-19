import { Vacio } from '@/components/armazon/vacio'
import { contextoAhora } from '@/lib/datos'
import { esColor, frenteAbierto, type FrenteVista } from '@/lib/frentes'
import { crearClienteServidor } from '@/lib/supabase/servidor'
import { ListaNotas, type NotaVista } from './lista-notas'

type Props = { searchParams: Promise<{ frente?: string | string[] }> }

export default async function Notas({ searchParams }: Props) {
  const { frente: atajo } = await searchParams
  const supabase = await crearClienteServidor()
  const [{ data: espacios }, { data: filas }, ctx] = await Promise.all([
    supabase.from('espacios').select('id, nombre, inicial, atajo, color, logo, logo_ancho').order('orden'),
    supabase
      .from('notas')
      .select('id, espacio_id, texto, creado_en')
      .is('borrado_en', null)
      .is('convertida_en_tarea_id', null)
      .order('creado_en', { ascending: false }),
    contextoAhora(),
  ])
  const frentes: FrenteVista[] = (espacios ?? []).map((e) => ({ ...e, color: esColor(e.color) ? e.color : 'azul' }))
  const frente = frenteAbierto(frentes, typeof atajo === 'string' ? atajo : null)

  const formato = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', timeZone: ctx.zona })
  const notas: NotaVista[] = (filas ?? [])
    .filter((n) => !frente || n.espacio_id === frente.id)
    .map((n) => ({ id: n.id, espacio_id: n.espacio_id, texto: n.texto, fecha: formato.format(new Date(n.creado_en)) }))

  return (
    <section className="v-bento">
      <ListaNotas key={frente?.id ?? 'todos'} notas={notas} frentes={frentes} abierto={frente?.id ?? null}>
        {notas.length === 0 && (
          <Vacio antes="Your loose" palabra="ideas" texto="Write down whatever comes to mind and it shows up here, sorted by space." />
        )}
      </ListaNotas>
    </section>
  )
}
