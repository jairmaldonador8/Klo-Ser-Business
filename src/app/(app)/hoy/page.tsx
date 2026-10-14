import { EditorHoy, type ItemHoy } from '@/components/vidrio/editor-hoy'
import { MosaicoFrente, MosaicoKlo, MosaicoMedidor, MosaicoSimple } from '@/components/vidrio/mosaicos'
import { esColor, frenteAbierto, type FrenteVista } from '@/lib/frentes'
import { crearClienteServidor } from '@/lib/supabase/servidor'
import type { IdMosaico } from '@/lib/vista/registro'
import { resolverVista } from '@/lib/vista/resolver'

type Props = { searchParams: Promise<{ frente?: string | string[] }> }

/** Cuánto ocupa cada mosaico en la rejilla (4 columnas en escritorio, 2 en teléfono). */
const CLASE: Record<IdMosaico, string> = {
  medidor: 'c2 r2',
  klo: 'c2',
  frentes: 'c2',
  en_riesgo: '',
  meta: '',
  de_un_toque: 'c2',
  tu_dia: 'c2',
  proyectos: 'c2',
}

export default async function Hoy({ searchParams }: Props) {
  const { frente: atajo } = await searchParams
  const supabase = await crearClienteServidor()
  const { data } = await supabase.auth.getClaims()
  const [{ data: perfil }, { data: espacios }] = await Promise.all([
    supabase.from('perfiles').select('vista').eq('user_id', data!.claims.sub).single(),
    supabase.from('espacios').select('id, nombre, inicial, atajo, color').order('orden'),
  ])
  const frentes: FrenteVista[] = (espacios ?? []).map((e) => ({ ...e, color: esColor(e.color) ? e.color : 'azul' }))
  const frente = frenteAbierto(frentes, typeof atajo === 'string' ? atajo : null)
  const mosaicos = resolverVista(perfil?.vista).mosaicos

  const nodo = (id: IdMosaico, i: number): React.ReactNode => {
    switch (id) {
      case 'medidor':
        return <MosaicoMedidor key={id} hechas={0} pendientes={0} siguiente={null} i={i} />
      case 'klo':
        return <MosaicoKlo key={id} frase="Cuando me escribas, aquí te digo qué sigue." i={i} />
      case 'frentes':
        return (
          <div key={id} className="v-grupo c2" aria-label="Tus frentes">
            {frentes.map((f, n) => (
              <MosaicoFrente key={f.id} frente={f} ruta="/hoy" i={i + n} />
            ))}
          </div>
        )
      case 'en_riesgo':
        return <MosaicoSimple key={id} titulo="En riesgo" vacio="Nada en riesgo." i={i} />
      case 'meta':
        return <MosaicoSimple key={id} titulo="La meta" vacio="Elige un proyecto para destacarlo aquí." punteada i={i} />
      case 'de_un_toque':
        return <MosaicoSimple key={id} titulo="De un toque" vacio="Nada por palomear." ancho={2} i={i} />
      case 'tu_dia':
        return <MosaicoSimple key={id} titulo="Agenda de hoy" vacio="Sin horas fijas hoy." ancho={2} i={i} />
      case 'proyectos':
        return (
          <MosaicoSimple
            key={id}
            titulo="Proyectos"
            vacio={frente ? `Los proyectos activos de ${frente.nombre} van aquí.` : 'Tus proyectos activos más cerca de su meta van aquí.'}
            ancho={2}
            punteada
            i={i}
          />
        )
    }
  }

  // Dentro de un frente, o con uno solo, el panorama de frentes sobra; dentro de un frente, La meta también.
  const aplica = (id: IdMosaico) => !(id === 'frentes' && (frente || frentes.length < 2)) && !(id === 'meta' && frente)
  const items: ItemHoy[] = mosaicos
    .filter((m) => aplica(m.id))
    .map((m, i) => ({ id: m.id, nombre: m.nombre, clase: CLASE[m.id], obligatorio: m.obligatorio, visible: m.visible, nodo: nodo(m.id, i) }))

  if (frente) {
    items.push({
      id: 'clientes',
      nombre: 'Clientes',
      clase: 'c2',
      visible: true,
      nodo: <MosaicoSimple key="clientes" titulo="Clientes" vacio={`Los clientes de ${frente.nombre} van aquí.`} ancho={2} punteada i={items.length} />,
    })
  }

  // Se personaliza desde «Todos»: dentro de un frente cambian los mosaicos que aplican.
  return <EditorHoy items={items} editable={!frente} />
}
