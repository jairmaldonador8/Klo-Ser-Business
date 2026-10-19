import Image from 'next/image'
import { AgregarTareaHoy, MicroWins } from '@/components/hoy/micro-wins'
import { RenglonTarea } from '@/components/tareas/renglon-tarea'
import { EditorHoy, type ItemHoy } from '@/components/vidrio/editor-hoy'
import { MosaicoKlo, MosaicoLista, MosaicoMedidor, MosaicoProyectos, MosaicoSimple, MosaicoTareas } from '@/components/vidrio/mosaicos'
import { contextoAhora, leerMisTareas, leerProyectos } from '@/lib/datos'
import { etiquetaDia } from '@/lib/fechas'
import { esColor, frenteAbierto, type FrenteVista } from '@/lib/frentes'
import { calcularHoy, enRiesgo } from '@/lib/hoy/calcular'
import { crearClienteServidor } from '@/lib/supabase/servidor'
import { extenderSeries } from '@/app/(app)/tareas/repetir'
import { hhmm, nombreClase, type Tarea } from '@/lib/tareas/esquema'
import type { IdMosaico } from '@/lib/vista/registro'
import { resolverVista } from '@/lib/vista/resolver'

type Props = { searchParams: Promise<{ frente?: string | string[] }> }

/** Cuánto ocupa cada mosaico en la rejilla (4 columnas en escritorio, 2 en teléfono). */
const CLASE: Record<IdMosaico, string> = {
  medidor: 'c2 r2',
  klo: 'c2',
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
  if (pendientes === 0) return 'You’re free today. If something comes up, hit +.'
  if (siguiente) return `Up next: ${siguiente}.`
  return `You have ${pendientes} left today.`
}

export default async function Hoy({ searchParams }: Props) {
  const { frente: atajo } = await searchParams
  // Las tasks que se repiten se generan por adelantado; si a alguna serie le falta, se extiende antes de leer.
  await extenderSeries()
  const supabase = await crearClienteServidor()
  const { data } = await supabase.auth.getClaims()
  const [{ data: perfil }, { data: espacios }, tareas, proyectos, ctx] = await Promise.all([
    supabase.from('perfiles').select('vista').eq('user_id', data!.claims.sub).single(),
    supabase.from('espacios').select('id, nombre, inicial, atajo, color, logo, logo_ancho').order('orden'),
    // Todas: el panorama de frentes necesita las de cada uno; el frente abierto se filtra aquí.
    leerMisTareas(),
    leerProyectos(),
    contextoAhora(),
  ])
  // Micro wins: los tuyos y cuáles ya palomeaste hoy (en tu zona).
  const [{ data: microWins }, { data: hechosHoy }] = await Promise.all([
    supabase.from('micro_wins').select('id, nombre').is('borrado_en', null).order('orden').order('creado_en'),
    supabase.from('micro_wins_hechos').select('micro_win_id').eq('fecha', ctx.hoy),
  ])
  const palomeados = new Set((hechosHoy ?? []).map((h) => h.micro_win_id))
  const frentes: FrenteVista[] = (espacios ?? []).map((e) => ({ ...e, color: esColor(e.color) ? e.color : 'azul' }))
  const frente = frenteAbierto(frentes, typeof atajo === 'string' ? atajo : null)
  const mosaicos = resolverVista(perfil?.vista).mosaicos

  const delFrente = frente ? tareas.filter((t) => t.espacio_id === frente.id) : tareas
  const hoyCalc = calcularHoy(delFrente, ctx)
  const riesgo = enRiesgo(delFrente, ctx.hoy)
  const frenteDe = new Map(frentes.map((f) => [f.id, f]))
  const vencida = (t: Tarea) => t.fecha !== null && t.fecha < ctx.hoy
  // «vencida · ayer 10:00» o «hoy».
  const detalle = (t: Tarea) => (vencida(t) ? `overdue · ${etiquetaDia(t.fecha!, ctx.hoy)}${t.hora ? ' ' + hhmm(t.hora) : ''}` : 'today')
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
      case 'en_riesgo':
        return (
          <MosaicoLista key={id} titulo="At risk" vacio="Nothing at risk." mas={mas(riesgo)} i={i}>
            {renglones(riesgo, (t) => ({ detalle: vencida(t) ? 'overdue' : etiquetaDia(t.fecha!, ctx.hoy), vencida: vencida(t) }))}
          </MosaicoLista>
        )
      case 'meta':
        return <MosaicoSimple key={id} titulo="Goal" vacio="Pick a project to spotlight it here." punteada i={i} />
      case 'de_un_toque': {
        const lista = hoyCalc.tareasHoy
        const tope = 20
        return (
          <MosaicoTareas
            key={id}
            hechas={lista.filter((t) => t.completada_en).length}
            total={lista.length}
            microWins={<MicroWins inicial={(microWins ?? []).map((m) => ({ ...m, hecho: palomeados.has(m.id) }))} />}
            accion={<AgregarTareaHoy espacioId={frente?.id} />}
            mas={Math.max(0, lista.length - tope)}
            i={i}
          >
            {lista.slice(0, tope).map((t) => (
              <RenglonTarea
                key={t.id}
                tarea={t}
                frente={frente ? undefined : frenteDe.get(t.espacio_id)}
                detalle={vencida(t) ? detalle(t) : [rango(t), t.clase !== 'tarea' && nombreClase(t.clase)].filter(Boolean).join(' · ') || 'today'}
                vencida={vencida(t)}
              />
            ))}
          </MosaicoTareas>
        )
      }
      case 'tu_dia': {
        const lista = hoyCalc.tuDia
        return (
          <MosaicoLista key={id} titulo="Today’s agenda" vacio="No fixed times today." ancho={2} mas={mas(lista)} i={i}>
            {renglones(lista, (t) => ({ detalle: rango(t), ahora: ocurreAhora(t, ctx.ahora) }))}
          </MosaicoLista>
        )
      }
      case 'proyectos':
        return <MosaicoProyectos key={id} proyectos={proyectosVista} hoy={ctx.hoy} frente={frente} i={i} />
    }
  }

  // Dentro de un frente, La meta sobra. A cada frente se llega por las píldoras de abajo.
  const aplica = (id: IdMosaico) => !(id === 'meta' && frente)
  const items: ItemHoy[] = mosaicos
    .filter((m) => aplica(m.id))
    .map((m, i) => ({ id: m.id, nombre: m.nombre, clase: CLASE[m.id], obligatorio: m.obligatorio, visible: m.visible, nodo: nodo(m.id, i) }))

  if (frente) {
    items.push({
      id: 'clientes',
      nombre: 'Clients',
      clase: 'c2',
      visible: true,
      nodo: <MosaicoSimple key="clientes" titulo="Clients" vacio={`${frente.nombre} clients go here.`} ancho={2} punteada i={items.length} />,
    })
  }

  // Se personaliza desde «Todos». La key reinicia el editor al abrir un frente: ahí cambian los mosaicos.
  return (
    <>
      {/* El lockup oficial (wordmark sin redibujar) encabeza Today; dentro de un space, a su lado va el wordmark del space. */}
      <div className="v-encabezado-hoy">
        <div className="v-lockup-hoy">
          <Image src="/marca/blanco/03-wordmark.svg" alt="Klo-Ser" width={220} height={55} unoptimized priority />
          <span>
            <i aria-hidden />
            Business
            <i aria-hidden />
          </span>
        </div>
        {frente?.logo_ancho && (
          <>
            <i className="v-separador" aria-hidden />
            <Image key={frente.id} className="v-wordmark-espacio" src={frente.logo_ancho} alt={frente.nombre} width={240} height={60} unoptimized priority />
          </>
        )}
      </div>
      <EditorHoy key={frente?.id ?? 'todos'} items={items} editable={!frente} />
    </>
  )
}
