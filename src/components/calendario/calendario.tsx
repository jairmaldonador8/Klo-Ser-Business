'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { startTransition, useCallback, useEffect, useMemo, useOptimistic, useRef, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { moverMeta, reprogramarTarea } from '@/app/(app)/calendario/acciones'
import { useHoja } from '@/components/hoja/hoja-provider'
import { useToast } from '@/components/tareas/toast'
import {
  aMinutos,
  ajustar,
  deMinutos,
  horaCorta,
  dentro,
  diasVista,
  esVista,
  NOMBRE_VISTA,
  pasar,
  tituloVista,
  VISTAS,
  type Vista,
} from '@/lib/calendario/fechas'
import { fechaEn, horaMinEn } from '@/lib/fechas'
import type { FrenteVista } from '@/lib/frentes'
import { hhmm, type Tarea } from '@/lib/tareas/esquema'
import { Calendarios, Flecha, Metas, MiniMes, PorCalendarizar } from './lado'
import type { Destino, Empezar, Meta, Origen, Previa } from './tipos'
import { VistaHoras } from './vista-horas'
import { VistaMes } from './vista-mes'

export type { Meta } from './tipos'

type Props = {
  tareas: Tarea[]
  sinFecha: Tarea[]
  metas: Meta[]
  frentes: FrenteVista[]
  /** El frente abierto (`?frente=`), o null en «Todos». */
  frente: FrenteVista | null
  /** Lo que trajo el servidor: fuera de aquí hay que pedir otra vez. */
  rango: { desde: string; hasta: string }
  fechaInicial: string
  vistaInicial: Vista | null
  hoy: string
  zona: string
}

const ATAJOS: Record<string, Vista> = { d: 'dia', x: '3dias', w: 'semana', s: 'semana', m: 'mes' }
const GUARDADO = { vista: 'cal:vista', ocultos: 'cal:ocultos' }

function leer(clave: string): string | null {
  try {
    return localStorage.getItem(clave)
  } catch {
    return null
  }
}
function guardar(clave: string, valor: string) {
  try {
    localStorage.setItem(clave, valor)
  } catch {}
}

type Campos = { fecha: string | null; hora: string | null; hora_fin: string | null }
const camposDe = (t: Tarea): Campos => ({ fecha: t.fecha, hora: hhmm(t.hora), hora_fin: hhmm(t.hora_fin) })
const iguales = (a: Campos, b: Campos) => a.fecha === b.fecha && a.hora === b.hora && a.hora_fin === b.hora_fin

export function Calendario({ tareas, sinFecha, metas, frentes, frente, rango, fechaInicial, vistaInicial, hoy: hoyServidor, zona }: Props) {
  const router = useRouter()
  const params = useSearchParams()
  const abrir = useHoja()
  const avisar = useToast()
  const [cargando, pedir] = useTransition()

  const [vista, setVista] = useState<Vista>(vistaInicial ?? 'semana')
  const [fecha, setFecha] = useState(fechaInicial)
  const [ocultos, setOcultos] = useState<Set<string>>(new Set())
  const [hoy, setHoy] = useState(hoyServidor)
  const [ahora, setAhora] = useState<string | null>(null)

  // Lo que se mueve se ve en su lugar nuevo de inmediato; el servidor confirma después.
  const [tareasVivas, ponerTarea] = useOptimistic(tareas, (lista: Tarea[], t: Tarea) =>
    lista.some((x) => x.id === t.id) ? lista.map((x) => (x.id === t.id ? t : x)) : [...lista, t],
  )
  const [metasVivas, ponerMeta] = useOptimistic(metas, (lista: Meta[], m: { id: string; fecha: string }) =>
    lista.map((x) => (x.id === m.id ? { ...x, fecha_meta: m.fecha } : x)),
  )

  // Preferencias de este navegador: la vista (si la URL no la trae; en teléfono, 3 días) y los calendarios apagados.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- se leen al montar: el servidor no conoce el navegador */
    if (!vistaInicial) {
      const v = leer(GUARDADO.vista)
      if (esVista(v)) setVista(v)
      else if (window.matchMedia('(max-width: 700px)').matches) setVista('3dias')
    }
    try {
      setOcultos(new Set(JSON.parse(leer(GUARDADO.ocultos) ?? '[]')))
    } catch {}
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [vistaInicial])

  // El reloj: la línea de «ahora» camina y, pasada la medianoche, hoy cambia.
  useEffect(() => {
    const tic = () => {
      const d = new Date()
      setAhora(horaMinEn(d, zona))
      setHoy(fechaEn(d, zona))
    }
    tic()
    const reloj = setInterval(tic, 30_000)
    return () => clearInterval(reloj)
  }, [zona])

  const dias = useMemo(() => diasVista(vista, fecha), [vista, fecha])

  /** Cambia vista o fecha. Si cae dentro de lo cargado, solo cambia la URL; si no, se piden datos. */
  const ir = useCallback(
    (v: Vista, f: string) => {
      setVista(v)
      setFecha(f)
      guardar(GUARDADO.vista, v)
      const p = new URLSearchParams(params.toString())
      p.set('vista', v)
      if (f === hoy) p.delete('fecha')
      else p.set('fecha', f)
      const url = `/calendario?${p.toString()}`
      if (dentro(diasVista(v, f), rango)) window.history.replaceState(null, '', url)
      else pedir(() => router.replace(url, { scroll: false }))
    },
    [params, hoy, rango, router],
  )

  const visibles = useMemo(() => tareasVivas.filter((t) => !ocultos.has(t.espacio_id)), [tareasVivas, ocultos])
  const metasVis = useMemo(() => metasVivas.filter((m) => !ocultos.has(m.espacio_id)), [metasVivas, ocultos])
  const sueltas = useMemo(
    () => sinFecha.filter((t) => !ocultos.has(t.espacio_id) && !tareasVivas.some((x) => x.id === t.id && x.fecha)),
    [sinFecha, ocultos, tareasVivas],
  )
  const conAlgo = useMemo(() => new Set(visibles.filter((t) => !t.completada_en).map((t) => t.fecha!)), [visibles])
  const colores = useMemo(() => new Map(frentes.map((f) => [f.id, f.color])), [frentes])
  const colorDe = useCallback((id: string) => colores.get(id) ?? 'azul', [colores])

  // La zona que seleccionaste se queda pintada (borrador) mientras llenas la hoja; al cerrarla se va.
  const [borrador, setBorrador] = useState<{ dia: string; ini: number; fin: number; dias: string[] } | null>(null)

  const nuevaEn = useCallback(
    (dia: string, ini?: number, fin?: number, varios?: string[]) => {
      if (ini !== undefined && fin !== undefined) setBorrador({ dia, ini, fin, dias: varios ?? [dia] })
      abrir({
        dias: varios,
        valores: {
          fecha: dia,
          hora: ini === undefined ? null : deMinutos(ini),
          hora_fin: fin === undefined ? null : deMinutos(fin),
          ...(frente && { espacio_id: frente.id }),
        },
        alCerrar: () => setBorrador(null),
      })
    },
    [abrir, frente],
  )

  // ── Mover, estirar y reprogramar ─────────────────────────────────────
  const cambiar = useCallback(
    (t: Tarea, campos: Campos, texto: string) => {
      const antes = camposDe(t)
      startTransition(async () => {
        ponerTarea({ ...t, ...campos })
        const r = await reprogramarTarea({ id: t.id, ...campos })
        if (!r.ok) return avisar(r.mensaje)
        avisar(texto, () =>
          startTransition(async () => {
            const d = await reprogramarTarea({ id: t.id, ...antes })
            if (!d.ok) avisar(d.mensaje)
          }),
        )
      })
    },
    [ponerTarea, avisar],
  )

  /** Los días entre dos columnas de la vista (en cualquier orden), en orden de calendario. */
  const tramo = useCallback(
    (a: string, b: string) => {
      const i = dias.indexOf(a)
      const j = dias.indexOf(b)
      if (i < 0 || j < 0) return [a]
      return dias.slice(Math.min(i, j), Math.max(i, j) + 1)
    },
    [dias],
  )

  /** Rango que deja estirar: la orilla contraria a la que tomaste queda fija; si la cruzas, se voltea. Mínimo 15 min. */
  const rangoEstirado = useCallback((t: Tarea, borde: 'inicio' | 'fin', cursor: number): [number, number] => {
    const ini = aMinutos(t.hora!)
    const fin = t.hora_fin ? aMinutos(t.hora_fin) : ini + 30
    const ancla = borde === 'fin' ? ini : fin
    const a = Math.min(ancla, cursor)
    const b = Math.max(ancla, cursor)
    if (b - a >= 15) return [a, b]
    return borde === 'fin' ? [ancla, Math.min(1439, ancla + 15)] : [Math.max(0, ancla - 15), ancla]
  }, [])

  /** Lo que pasa al soltar. Devuelve false si no cambió nada (entonces cuenta como un toque). */
  const aplicar = useCallback(
    (o: Origen, d: Destino): boolean => {
      if (o.tipo === 'crear') {
        if (d.min === null) return false
        const a = Math.min(o.desde, d.min)
        const b = Math.max(o.desde + 15, d.min)
        const varios = tramo(o.dia, d.dia)
        nuevaEn(varios[0], a, Math.min(b, 1439), varios.length > 1 ? varios : undefined)
        return true
      }
      if (o.tipo === 'meta') {
        if (d.dia === o.meta.fecha_meta) return false
        startTransition(async () => {
          ponerMeta({ id: o.meta.id, fecha: d.dia })
          const r = await moverMeta(o.meta.id, d.dia)
          avisar(r.ok ? 'Goal moved' : r.mensaje)
        })
        return true
      }
      const t = o.tarea
      const antes = camposDe(t)
      let nuevos: Campos
      if (o.tipo === 'estirar') {
        if (d.min === null || !t.hora) return false
        const [a, b] = rangoEstirado(t, o.borde, d.min)
        nuevos = { ...antes, hora: deMinutos(a), hora_fin: deMinutos(b) }
      } else if (d.zona === 'hora' && d.min !== null) {
        const dur = t.hora ? (t.hora_fin ? aMinutos(t.hora_fin) - aMinutos(t.hora) : null) : 60
        nuevos = { fecha: d.dia, hora: deMinutos(d.min), hora_fin: dur === null ? null : deMinutos(Math.min(d.min + dur, 1439)) }
      } else if (d.zona === 'dia' && t.clase !== 'junta') {
        // Al renglón «todo el día»: pierde la hora (una junta la conserva: la necesita).
        nuevos = { fecha: d.dia, hora: null, hora_fin: null }
      } else {
        nuevos = { ...antes, fecha: d.dia }
      }
      if (iguales(antes, nuevos)) return false
      cambiar(t, nuevos, o.tipo === 'estirar' ? 'Resized' : antes.fecha ? 'Moved' : 'Scheduled')
      return true
    },
    [cambiar, nuevaEn, ponerMeta, avisar, rangoEstirado, tramo],
  )

  const [arrastre, setArrastre] = useState<{ origen: Origen; destino: Destino | null } | null>(null)
  // La copia flotante sigue al puntero sin pasar por React (se mueve con transform en cada cuadro).
  const flotante = useRef<HTMLDivElement | null>(null)
  const [tamFlotante, setTamFlotante] = useState<{ w: number; h: number; chip: boolean } | null>(null)
  // `ir` cambia en cada render; el arrastre lo lee de aquí para pasar de semana sin soltar.
  const irRef = useRef<(v: Vista, f: string) => void>(() => {})
  const pasoRef = useRef<{ vista: Vista; fecha: string }>({ vista, fecha })
  useEffect(() => {
    irRef.current = ir
    pasoRef.current = { vista, fecha }
  })

  /** Qué hay bajo el puntero. Estirar se queda en su día; crear sigue al puntero de columna en columna. */
  const destinoEn = useCallback((x: number, y: number, o: Origen): Destino | null => {
    if (o.tipo === 'crear') {
      // Por geometría (no por el elemento bajo el puntero): entre columnas, sobre la regla o fuera de la
      // rejilla, la selección se pega a la columna más cercana y nunca brinca.
      const cols = [...document.querySelectorAll<HTMLElement>('[data-zona="hora"]')]
      if (!cols.length) return null
      const cajas = cols.map((c) => c.getBoundingClientRect())
      let i = cajas.findIndex((r) => x >= r.left && x < r.right)
      if (i < 0) i = x < cajas[0].left ? 0 : cols.length - 1
      const r = cajas[i]
      return { dia: cols[i].dataset.dia!, zona: 'hora', min: Math.max(0, Math.min(1439, ajustar(((y - r.top) / r.height) * 1440))) }
    }
    const fijo = o.tipo === 'estirar' ? o.tarea.fecha : null
    const el = fijo
      ? document.querySelector<HTMLElement>(`[data-zona="hora"][data-dia="${fijo}"]`)
      : document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-dia]')
    if (!el) return null
    const zona = el.dataset.zona as Destino['zona']
    const dia = el.dataset.dia!
    if (zona !== 'hora') return o.tipo === 'estirar' ? null : { dia, zona, min: null }
    const r = el.getBoundingClientRect()
    const crudo = ((y - r.top) / r.height) * 1440
    if (o.tipo === 'mover') {
      const t = o.tarea
      const dur = t.hora && t.hora_fin ? aMinutos(t.hora_fin) - aMinutos(t.hora) : 30
      return { dia, zona, min: Math.max(0, Math.min(1440 - dur, ajustar(crudo - o.agarre))) }
    }
    return { dia, zona, min: Math.max(0, Math.min(1439, ajustar(crudo))) }
  }, [])

  const empezar: Empezar = useCallback(
    (e, origen, alTocar) => {
      if (e.button !== 0) return
      const tactil = e.pointerType !== 'mouse'
      const inicio = { x: e.clientX, y: e.clientY }
      const puntero = { x: e.clientX, y: e.clientY }
      const elemento = e.currentTarget as HTMLElement
      const scroll = elemento.closest<HTMLElement>('.cal-scroll') ?? document.querySelector<HTMLElement>('.cal-scroll')
      const principal = document.querySelector<HTMLElement>('.cal-principal')
      // Dónde se tomó el elemento, para que la copia flotante no brinque al puntero.
      const caja = elemento.getBoundingClientRect()
      const agarre = { dx: e.clientX - caja.left, dy: e.clientY - caja.top }
      const conCopia = origen.tipo === 'mover' || origen.tipo === 'meta'
      let activo = false
      let espera: ReturnType<typeof setTimeout> | undefined
      let cuadro = 0
      let clave = ''
      let orilla: { lado: -1 | 1; desde: number; ultimo: number } | null = null

      const actualizar = () => {
        const d = destinoEn(puntero.x, puntero.y, origen)
        const nueva = d ? `${d.dia}|${d.zona}|${d.min}` : '-'
        // Solo se re-pinta React cuando cambia el bloque de 15 min o el día, no en cada pixel.
        if (nueva !== clave) {
          clave = nueva
          setArrastre({ origen, destino: d })
        }
      }

      const tic = () => {
        if (!activo) return
        cuadro = requestAnimationFrame(tic)
        const f = flotante.current
        if (f) f.style.transform = `translate3d(${puntero.x - agarre.dx}px, ${puntero.y - agarre.dy}px, 0)`
        // Autoscroll: más rápido entre más cerca de la orilla (hasta 14 px por cuadro).
        if (scroll) {
          const r = scroll.getBoundingClientRect()
          const zona = 64
          const arriba = puntero.y - r.top
          const abajo = r.bottom - puntero.y
          const vel = arriba < zona ? -(1 - Math.max(0, arriba) / zona) * 14 : abajo < zona ? (1 - Math.max(0, abajo) / zona) * 14 : 0
          if (vel) scroll.scrollTop += vel
        }
        // En la orilla izquierda o derecha medio segundo: pasa de página (y sigue cada 1.1 s) sin soltar.
        if (conCopia && principal) {
          const r = principal.getBoundingClientRect()
          const lado = puntero.x < r.left + 36 ? -1 : puntero.x > r.right - 36 ? 1 : 0
          const ahora = performance.now()
          if (!lado) orilla = null
          else if (!orilla || orilla.lado !== lado) orilla = { lado, desde: ahora, ultimo: 0 }
          else if (ahora - orilla.desde > 500 && ahora - orilla.ultimo > 1100) {
            orilla.ultimo = ahora
            const { vista: v, fecha: f } = pasoRef.current
            irRef.current(v, pasar(v, f, lado))
          }
        }
        actualizar()
      }

      const activar = () => {
        activo = true
        document.documentElement.classList.add('cal-arrastrando')
        if (origen.tipo === 'estirar') document.documentElement.classList.add('cal-estirando')
        navigator.vibrate?.(8)
        if (conCopia) setTamFlotante({ w: caja.width, h: caja.height, chip: origen.tipo === 'meta' || !(origen.tipo === 'mover' && origen.tarea.hora && elemento.classList.contains('cal-ev')) })
        actualizar()
        cuadro = requestAnimationFrame(tic)
      }
      // En el teléfono, arrastrar pide dejar el dedo un momento: si no, es scroll. Crear es solo con toque.
      if (tactil && origen.tipo !== 'crear') espera = setTimeout(activar, 280)

      const mover = (ev: PointerEvent) => {
        puntero.x = ev.clientX
        puntero.y = ev.clientY
        if (!activo) {
          const d = Math.hypot(ev.clientX - inicio.x, ev.clientY - inicio.y)
          if (tactil) {
            if (d > 8) limpiar()
            return
          }
          if (d < 4) return
          activar()
        }
      }
      const soltar = (ev: PointerEvent) => {
        const eraActivo = activo
        puntero.x = ev.clientX
        puntero.y = ev.clientY
        const d = eraActivo ? destinoEn(ev.clientX, ev.clientY, origen) : null
        limpiar()
        if (!eraActivo) return alTocar?.()
        if (!d || !aplicar(origen, d)) alTocar?.()
      }
      const tecla = (ev: KeyboardEvent) => {
        if (ev.key === 'Escape') limpiar()
      }
      const bloquearScroll = (ev: TouchEvent) => {
        if (activo) ev.preventDefault()
      }
      function limpiar() {
        clearTimeout(espera)
        cancelAnimationFrame(cuadro)
        activo = false
        document.documentElement.classList.remove('cal-arrastrando', 'cal-estirando')
        setArrastre(null)
        setTamFlotante(null)
        window.removeEventListener('pointermove', mover)
        window.removeEventListener('pointerup', soltar)
        window.removeEventListener('pointercancel', limpiar)
        window.removeEventListener('keydown', tecla)
        document.removeEventListener('touchmove', bloquearScroll)
      }
      window.addEventListener('pointermove', mover)
      window.addEventListener('pointerup', soltar)
      window.addEventListener('pointercancel', limpiar)
      window.addEventListener('keydown', tecla)
      document.addEventListener('touchmove', bloquearScroll, { passive: false })
    },
    [destinoEn, aplicar],
  )

  const previa = useMemo((): Previa | null => {
    if (!arrastre?.destino) {
      if (!borrador) return null
      return { dia: borrador.dia, dias: borrador.dias, zona: 'hora', ini: borrador.ini, fin: borrador.fin, titulo: borrador.dias.length > 1 ? `New task · ${borrador.dias.length} days` : 'New task', color: frente?.color ?? 'azul', id: null, borrador: true }
    }
    const { origen: o, destino: d } = arrastre
    if (o.tipo === 'crear') {
      if (d.min === null) return null
      const varios = tramo(o.dia, d.dia)
      return { dia: o.dia, dias: varios, zona: 'hora', ini: Math.min(o.desde, d.min), fin: Math.max(o.desde + 15, d.min), titulo: varios.length > 1 ? `New task · ${varios.length} days` : 'New task', color: frente?.color ?? 'azul', id: null }
    }
    if (o.tipo === 'meta') return { dia: d.dia, zona: d.zona, ini: null, fin: null, titulo: o.meta.nombre, color: colorDe(o.meta.espacio_id), id: o.meta.id, contorno: true }
    const t = o.tarea
    const base = { titulo: t.titulo, color: colorDe(t.espacio_id), id: t.id }
    if (o.tipo === 'estirar') {
      const [ini, fin] = d.min === null ? [aMinutos(t.hora!), aMinutos(t.hora!) + 15] : rangoEstirado(t, o.borde, d.min)
      return { ...base, dia: t.fecha!, zona: 'hora', ini, fin }
    }
    if (d.zona === 'hora' && d.min !== null) {
      const dur = t.hora && t.hora_fin ? aMinutos(t.hora_fin) - aMinutos(t.hora) : t.hora ? 30 : 60
      return { ...base, dia: d.dia, zona: 'hora', ini: d.min, fin: d.min + dur, contorno: true }
    }
    return { ...base, dia: d.dia, zona: d.zona, ini: null, fin: null, contorno: true }
  }, [arrastre, borrador, colorDe, frente, rangoEstirado, tramo])

  const arrastrando = arrastre?.destino ? (arrastre.origen.tipo === 'meta' ? arrastre.origen.meta.id : arrastre.origen.tipo === 'crear' ? null : arrastre.origen.tarea.id) : null

  // La copia que flota con el puntero (mover y metas): va al body para que ningún scroll la recorte.
  const copia =
    arrastre && tamFlotante && previa && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={flotante}
            className={`cal-flotante${tamFlotante.chip ? ' chip' : ''}`}
            style={{ width: tamFlotante.w, height: tamFlotante.chip ? undefined : tamFlotante.h, '--c': `var(--v-p-${previa.color})` } as React.CSSProperties}
            aria-hidden
          >
            <b>{previa.titulo}</b>
            {previa.ini !== null && previa.fin !== null && (
              <small>
                {horaCorta(deMinutos(previa.ini))} – {horaCorta(deMinutos(previa.fin))}
              </small>
            )}
          </div>,
          document.body,
        )
      : null

  // ── Teclado: T hoy · D/X/W/M vista · ←/→ o J/K página · N nueva ─────
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const el = e.target as HTMLElement
      if (el.closest('input, textarea, select, [contenteditable="true"]') || document.querySelector('dialog[open]')) return
      const k = e.key.toLowerCase()
      if (k === 't') ir(vista, hoy)
      else if (ATAJOS[k]) ir(ATAJOS[k], fecha)
      else if (k === 'arrowleft' || k === 'k') ir(vista, pasar(vista, fecha, -1))
      else if (k === 'arrowright' || k === 'j') ir(vista, pasar(vista, fecha, 1))
      else if (k === 'n' || k === 'c') nuevaEn(vista === 'mes' ? hoy : dias.includes(hoy) ? hoy : dias[0])
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [ir, vista, fecha, hoy, dias, nuevaEn])

  const alternar = (id: string) =>
    setOcultos((o) => {
      const n = new Set(o)
      if (!n.delete(id)) n.add(id)
      guardar(GUARDADO.ocultos, JSON.stringify([...n]))
      return n
    })

  const titulo = tituloVista(vista, fecha)
  const pendientes = visibles.filter((t) => !t.completada_en && dias.includes(t.fecha!)).length

  return (
    <section className="cal" aria-label="Calendar" aria-busy={cargando}>
      <header className="cal-cab">
        <div className="cal-titulo">
          <h2>{titulo.charAt(0).toUpperCase() + titulo.slice(1)}</h2>
          <small>
            {pendientes === 0 ? 'Nothing pending here' : `${pendientes} pending`}
            {frente ? ` · ${frente.nombre}` : ''}
          </small>
        </div>
        <div className="cal-mandos">
          <button type="button" className="cal-boton" onClick={() => ir(vista, hoy)} title="Today (T)">
            Today
          </button>
          <div className="cal-flechas">
            <button type="button" className="cal-icono" aria-label="Previous" title="Previous (←)" onClick={() => ir(vista, pasar(vista, fecha, -1))}>
              <Flecha dir={-1} />
            </button>
            <button type="button" className="cal-icono" aria-label="Next" title="Next (→)" onClick={() => ir(vista, pasar(vista, fecha, 1))}>
              <Flecha dir={1} />
            </button>
          </div>
          <div className="cal-vistas" role="radiogroup" aria-label="View">
            {VISTAS.map((v) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={vista === v}
                title={`${NOMBRE_VISTA[v]} (${Object.keys(ATAJOS).find((k) => ATAJOS[k] === v)!.toUpperCase()})`}
                onClick={() => ir(v, fecha)}
              >
                {NOMBRE_VISTA[v]}
              </button>
            ))}
          </div>
          <button type="button" className="cal-boton primario" onClick={() => nuevaEn(dias.includes(hoy) ? hoy : dias[0])} title="New (N)">
            <svg viewBox="0 0 16 16" aria-hidden>
              <path d="M8 3v10M3 8h10" />
            </svg>
            <span>New</span>
          </button>
        </div>
        <i className="cal-carga" aria-hidden />
      </header>

      <div className="cal-cuerpo">
        <div className="cal-principal">
          {vista === 'mes' ? (
            <VistaMes
              dias={dias}
              fecha={fecha}
              tareas={visibles}
              metas={metasVis}
              hoy={hoy}
              colorDe={colorDe}
              empezar={empezar}
              previa={previa}
              arrastrando={arrastrando}
              irADia={(d) => ir('dia', d)}
              nuevaEn={nuevaEn}
            />
          ) : (
            <VistaHoras
              key={vista}
              dias={dias}
              tareas={visibles}
              metas={metasVis}
              hoy={hoy}
              ahora={ahora}
              colorDe={colorDe}
              empezar={empezar}
              previa={previa}
              arrastrando={arrastrando}
              irADia={(d) => ir('dia', d)}
              nuevaEn={nuevaEn}
            />
          )}
        </div>

        <aside className="cal-lado">
          <MiniMes fecha={fecha} visibles={dias} hoy={hoy} conAlgo={conAlgo} elegir={(d) => ir(vista, d)} />
          <PorCalendarizar tareas={sueltas} colorDe={colorDe} empezar={empezar} arrastrando={arrastrando} />
          <Metas metas={metasVis} hoy={hoy} colorDe={colorDe} ir={(f) => ir(vista === 'dia' || vista === '3dias' ? vista : 'semana', f)} />
          {!frente && frentes.length > 1 && <Calendarios frentes={frentes} ocultos={ocultos} alternar={alternar} />}
          <p className="cal-atajos">
            <kbd>T</kbd> today · <kbd>D</kbd> <kbd>X</kbd> <kbd>W</kbd> <kbd>M</kbd> view · <kbd>←</kbd> <kbd>→</kbd> · <kbd>N</kbd> new
          </p>
        </aside>
      </div>
      {copia}
    </section>
  )
}
