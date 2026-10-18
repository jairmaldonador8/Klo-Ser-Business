import { RenglonTarea } from '@/components/tareas/renglon-tarea'
import { EditorHoy, type ItemHoy } from '@/components/vidrio/editor-hoy'
import { MosaicoFrente, MosaicoKlo, MosaicoLista, MosaicoMedidor, MosaicoProyectos, MosaicoSimple } from '@/components/vidrio/mosaicos'
import { contextoAhora, leerMisTareas, leerProyectos } from '@/lib/datos'
import { etiquetaDia } from '@/lib/fechas'
import { esColor, frenteAbierto, type FrenteVista } from '@/lib/frentes'
import { calcularHoy, enRiesgo, resumenPorFrente } from '@/lib/hoy/calcular'
import { crearClienteServidor } from '@/lib/supabase/servidor'
import { hhmm, type Tarea } from '@/lib/tareas/esquema'
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

/** Cuántos renglones caben en un mosaico de lista; el resto es «y N más». */
const TOPE = 6

/** ¿Ocurre ahora? Entre su hora y su fin; sin fin, dentro de su misma hora. */
function ocurreAhora(t: Tarea, ahora: string): boolean {
  const inicio = hhmm(t.hora)
  if (!inicio || inicio > ahora) return false
  const fin = hhmm(t.hora_fin)
  return fin ? ahora < fin : ahora.slice(0, 2) === inicio.slice(0, 2)
}

/** La frase de Klo según cómo va tu día. */
function fraseKlo(pendientes: number, siguiente: string | null): string {
  if (pendientes === 0) return 'Hoy vas libre. Si algo sale, dale al +.'
  if (siguiente) return `Lo que sigue: ${siguiente}.`
  return `Te quedan ${pendientes} por hacer hoy.`
}

export default async function Hoy({ searchParams }: Props) {
  const { frente: atajo } = await searchParams
  const supabase = await crearClienteServidor()
  const { data } = await supabase.auth.getClaims()
  const [{ data: perfil }, { data: espacios }, tareas, proyectos, ctx] = await Promise.all([
    supabase.from('perfiles').select('vista').eq('user_id', data!.claims.sub).single(),
    supabase.from('espacios').select('id, nombre, inicial, atajo, color').order('orden'),
    // Todas: el panorama de frentes necesita las de cada uno; el frente abierto se filtra aquí.
    leerMisTareas(),
    leerProyectos(),
    contextoAhora(),
  ])
  const frentes: FrenteVista[] = (espacios ?? []).map((e) => ({ ...e, color: esColor(e.color) ? e.color : 'azul' }))
  const frente = frenteAbierto(frentes, typeof atajo === 'string' ? atajo : null)
  const mosaicos = resolverVista(perfil?.vista).mosaicos

  const delFrente = frente ? tareas.filter((t) => t.espacio_id === frente.id) : tareas
  const hoyCalc = calcularHoy(delFrente, ctx)
  const riesgo = enRiesgo(delFrente, ctx.hoy)
  const resumen = resumenPorFrente(tareas, ctx)
  const frenteDe = new Map(frentes.map((f) => [f.id, f]))
  const vencida = (t: Tarea) => t.fecha !== null && t.fecha < ctx.hoy
  // «vencida · ayer 10:00» o «hoy».
  const detalle = (t: Tarea) => (vencida(t) ? `vencida · ${etiquetaDia(t.fecha!, ctx.hoy)}${t.hora ? ' ' + hhmm(t.hora) : ''}` : 'hoy')
  const rango = (t: Tarea) => [hhmm(t.hora), hhmm(t.hora_fin)].filter(Boolean).join('–')

  /** Renglones cortados al tope; el frente solo se nombra en «Todos». */
  const renglones = (lista: Tarea[], props: (t: Tarea) => { detalle: string; vencida?: boolean; ahora?: boolean }) =>
    lista.slice(0, TOPE).map((t) => <RenglonTarea key={t.id} tarea={t} frente={frente ? undefined : frenteDe.get(t.espacio_id)} {...props(t)} />)
  const mas = (lista: Tarea[]) => Math.max(0, lista.length - TOPE)

  const proyectosVista = frente ? proyectos.filter((p) => p.espacio_id === frente.id) : proyectos.slice(0, 2)

  const nodo = (id: IdMosaico, i: number): React.ReactNode => {
    switch (id) {
      case 'medidor':
        return <MosaicoMedidor key={id} hechas={hoyCalc.hechas} pendientes={hoyCalc.pendientes} siguiente={hoyCalc.siguiente?.titulo ?? null} i={i} />
      case 'klo':
        return <MosaicoKlo key={id} frase={fraseKlo(hoyCalc.pendientes, hoyCalc.siguiente?.titulo ?? null)} i={i} />
      case 'frentes':
        return (
          <div key={id} className="v-grupo c2" aria-label="Tus frentes">
            {frentes.map((f, n) => (
              <MosaicoFrente key={f.id} frente={f} ruta="/hoy" resumen={resumen.get(f.id)} proyectos={proyectos.filter((p) => p.espacio_id === f.id).length} i={i + n} />
            ))}
          </div>
        )
      case 'en_riesgo':
        return (
          <MosaicoLista key={id} titulo="En riesgo" vacio="Nada en riesgo." mas={mas(riesgo)} i={i}>
            {renglones(riesgo, (t) => ({ detalle: vencida(t) ? 'vencida' : etiquetaDia(t.fecha!, ctx.hoy), vencida: vencida(t) }))}
          </MosaicoLista>
        )
      case 'meta':
        return <MosaicoSimple key={id} titulo="La meta" vacio="Elige un proyecto para destacarlo aquí." punteada i={i} />
      case 'de_un_toque': {
        const lista = hoyCalc.deUnToque
        return (
          <MosaicoLista key={id} titulo="De un toque" vacio="Nada por palomear." chip={lista.length ? `${lista.length}` : undefined} ancho={2} mas={mas(lista)} i={i}>
            {renglones(lista, (t) => ({ detalle: detalle(t), vencida: vencida(t) }))}
          </MosaicoLista>
        )
      }
      case 'tu_dia': {
        const lista = hoyCalc.tuDia
        return (
          <MosaicoLista key={id} titulo="Agenda de hoy" vacio="Sin horas fijas hoy." ancho={2} mas={mas(lista)} i={i}>
            {renglones(lista, (t) => ({ detalle: rango(t), ahora: ocurreAhora(t, ctx.ahora) }))}
          </MosaicoLista>
        )
      }
      case 'proyectos':
        return <MosaicoProyectos key={id} proyectos={proyectosVista} hoy={ctx.hoy} frente={frente} i={i} />
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

  // Se personaliza desde «Todos». La key reinicia el editor al abrir un frente: ahí cambian los mosaicos.
  return <EditorHoy key={frente?.id ?? 'todos'} items={items} editable={!frente} />
}
