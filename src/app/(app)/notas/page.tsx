import { Vacio } from '@/components/armazon/vacio'
import { contextoAhora } from '@/lib/datos'
import { fechaEn } from '@/lib/fechas'
import { esColor, frenteAbierto, type FrenteVista } from '@/lib/frentes'
import { etiquetaDiaNota } from '@/lib/notas/dias'
import { crearClienteServidor } from '@/lib/supabase/servidor'
import { ListaNotas, type NotaVista } from './lista-notas'

type Props = { searchParams: Promise<{ frente?: string | string[] }> }

/** Cuántas notas se traen: suficientes para semanas de bitácora. */
const TOPE = 400

export default async function Notas({ searchParams }: Props) {
  const { frente: atajo } = await searchParams
  const supabase = await crearClienteServidor()
  const [{ data: espacios }, { data: filas }, ctx] = await Promise.all([
    supabase.from('espacios').select('id, nombre, inicial, atajo, color, logo, logo_ancho').order('orden'),
    // También las que ya se volvieron task: se quedan en su día, marcadas, para no perder el hilo.
    supabase
      .from('notas')
      .select('id, espacio_id, texto, creado_en, posible_tarea, convertida_en_tarea_id')
      .is('borrado_en', null)
      .order('creado_en', { ascending: false })
      .limit(TOPE),
    contextoAhora(),
  ])
  const frentes: FrenteVista[] = (espacios ?? []).map((e) => ({ ...e, color: esColor(e.color) ? e.color : 'azul' }))
  const frente = frenteAbierto(frentes, typeof atajo === 'string' ? atajo : null)

  const hora = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: ctx.zona })
  const notas: NotaVista[] = (filas ?? [])
    .filter((n) => !frente || n.espacio_id === frente.id)
    .map((n) => {
      const dia = fechaEn(new Date(n.creado_en), ctx.zona)
      return {
        id: n.id,
        espacio_id: n.espacio_id,
        texto: n.texto,
        hora: hora.format(new Date(n.creado_en)),
        dia,
        etiqueta: etiquetaDiaNota(dia, ctx.hoy),
        posible: n.posible_tarea,
        tarea: n.convertida_en_tarea_id !== null,
      }
    })

  return (
    <section className="v-bento">
      <ListaNotas key={frente?.id ?? 'todos'} notas={notas} frentes={frentes} abierto={frente?.id ?? null} hoy={ctx.hoy}>
        {notas.length === 0 && (
          <Vacio antes="Your loose" palabra="ideas" texto="Write down whatever comes to mind. Each day gets its own page, and you can flag the ones that might become tasks." />
        )}
      </ListaNotas>
    </section>
  )
}
