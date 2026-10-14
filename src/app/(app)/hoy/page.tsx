import { MosaicoFrente, MosaicoKlo, MosaicoMedidor, MosaicoSimple } from '@/components/vidrio/mosaicos'
import { esColor, frenteAbierto, type FrenteVista } from '@/lib/frentes'
import { crearClienteServidor } from '@/lib/supabase/servidor'
import type { IdMosaico } from '@/lib/vista/registro'
import { resolverVista } from '@/lib/vista/resolver'

type Props = { searchParams: Promise<{ frente?: string | string[] }> }

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
  const mosaicos = resolverVista(perfil?.vista).mosaicos.filter((m) => m.visible)

  let i = 0
  const pintar = (id: IdMosaico): React.ReactNode => {
    switch (id) {
      case 'medidor':
        return <MosaicoMedidor key={id} hechas={0} pendientes={0} siguiente={null} i={i++} />
      case 'klo':
        return <MosaicoKlo key={id} frase="Cuando me escribas, aquí te digo qué sigue." i={i++} />
      case 'frentes':
        // Dentro de un frente, o con uno solo, el panorama sobra.
        if (frente || frentes.length < 2) return null
        return frentes.map((f) => <MosaicoFrente key={f.id} frente={f} ruta="/hoy" i={i++} />)
      case 'en_riesgo':
        return <MosaicoSimple key={id} titulo="En riesgo" vacio="Nada en riesgo." i={i++} />
      case 'meta':
        if (frente) return null
        return <MosaicoSimple key={id} titulo="La meta" vacio="Elige un proyecto para destacarlo aquí." punteada i={i++} />
      case 'de_un_toque':
        return <MosaicoSimple key={id} titulo="De un toque" vacio="Nada por palomear." ancho={2} i={i++} />
      case 'tu_dia':
        return <MosaicoSimple key={id} titulo="Agenda de hoy" vacio="Sin horas fijas hoy." ancho={2} i={i++} />
      case 'proyectos':
        return [
          <MosaicoSimple key={id} titulo="Proyectos" vacio={frente ? `Los proyectos activos de ${frente.nombre} van aquí.` : 'Tus proyectos activos más cerca de su meta van aquí.'} ancho={2} punteada i={i++} />,
          frente && <MosaicoSimple key="clientes" titulo="Clientes" vacio={`Los clientes de ${frente.nombre} van aquí.`} ancho={2} punteada i={i++} />,
        ]
    }
  }

  const tieneProyectos = mosaicos.some((m) => m.id === 'proyectos')
  return (
    <div className="v-bento">
      {mosaicos.map((m) => pintar(m.id))}
      {frente && !tieneProyectos && (
        <MosaicoSimple titulo="Clientes" vacio={`Los clientes de ${frente.nombre} van aquí.`} ancho={2} punteada i={i++} />
      )}
    </div>
  )
}
