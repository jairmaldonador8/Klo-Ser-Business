'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { startTransition, useCallback, useEffect, useMemo, useOptimistic, useRef, useState, useTransition } from 'react'
import { moverMeta, reprogramarTarea } from '@/app/(app)/calendario/acciones'
import { useHoja } from '@/components/hoja/hoja-provider'
import { useToast } from '@/components/tareas/toast'
import {
  aMinutos,
  ajustar,
  deMinutos,
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

  const nuevaEn = useCallback(
    (dia: string, ini?: number, fin?: number) =>
      abrir({
        valores: {
          fecha: dia,
          hora: ini === undefined ? null : deMinutos(ini),
          hora_fin: fin === undefined ? null : deMinutos(fin),
          ...(frente && { espacio_id: frente.id }),
        },
      }),
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

  /** Lo que pasa al soltar. Devuelve false si no cambió nada (entonces cuenta como un toque). */
  const aplicar = useCallback(
    (o: Origen, d: Destino): boolean => {
      if (o.tipo === 'crear') {
        if (d.min === null) return false
        const a = Math.min(o.desde, d.min)
        const b = Math.max(o.desde + 15, d.min)
        nuevaEn(o.dia, a, Math.min(b, 1439))
        return true
      }
      if (o.tipo === 'meta') {
        if (d.dia === o.meta.fecha_meta) return false
        startTransition(async () => {
          ponerMeta({ id: o.meta.id, fecha: d.dia })
          const r = await moverMeta(o.meta.id, d.dia)
          avisar(r.ok ? 'Meta movida' : r.mensaje)
        })
        return true
      }
      const t = o.tarea
      const antes = camposDe(t)
      let nuevos: Campos
      if (o.tipo === 'estirar') {
        if (d.min === null || !t.hora) return false
        nuevos = { ...antes, hora_fin: deMinutos(Math.max(aMinutos(t.hora) + 15, d.min)) }
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
      cambiar(t, nuevos, antes.fecha ? 'Movida' : 'Calendarizada')
      return true
    },
    [cambiar, nuevaEn, ponerMeta, avisar],
  )

  const [arrastre, setArrastre] = useState<{ origen: Origen; destino: Destino | null } | null>(null)
  const scrollRef = useRef<HTMLElement | null>(null)

  /** Qué hay bajo el puntero. Crear y estirar se quedan en su día. */
  const destinoEn = useCallback((x: number, y: number, o: Origen): Destino | null => {
    const fijo = o.tipo === 'crear' ? o.dia : o.tipo === 'estirar' ? o.tarea.fecha : null
    const el = fijo
      ? document.querySelector<HTMLElement>(`[data-zona="hora"][data-dia="${fijo}"]`)
      : document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-dia]')
    if (!el) return null
    const zona = el.dataset.zona as Destino['zona']
    const dia = el.dataset.dia!
    if (zona !== 'hora') return o.tipo === 'crear' || o.tipo === 'estirar' ? null : { dia, zona, min: null }
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
      scrollRef.current = (e.currentTarget as HTMLElement).closest('.cal-scroll')
      let activo = false
      let espera: ReturnType<typeof setTimeout> | undefined

      const activar = () => {
        activo = true
        document.documentElement.classList.add('cal-arrastrando')
        navigator.vibrate?.(8)
        setArrastre({ origen, destino: destinoEn(inicio.x, inicio.y, origen) })
      }
      // En el teléfono, arrastrar pide dejar el dedo un momento: si no, es scroll. Crear es solo con toque.
      if (tactil && origen.tipo !== 'crear') espera = setTimeout(activar, 280)

      const mover = (ev: PointerEvent) => {
        if (!activo) {
          const d = Math.hypot(ev.clientX - inicio.x, ev.clientY - inicio.y)
          if (tactil) {
            if (d > 8) limpiar()
            return
          }
          if (d < 4) return
          activar()
        }
        const s = scrollRef.current
        if (s) {
          const r = s.getBoundingClientRect()
          if (ev.clientY < r.top + 36) s.scrollTop -= 14
          else if (ev.clientY > r.bottom - 36) s.scrollTop += 14
        }
        setArrastre({ origen, destino: destinoEn(ev.clientX, ev.clientY, origen) })
      }
      const soltar = (ev: PointerEvent) => {
        const eraActivo = activo
        limpiar()
        if (!eraActivo) return alTocar?.()
        const d = destinoEn(ev.clientX, ev.clientY, origen)
        if (!d || !aplicar(origen, d)) alTocar?.()
      }
      const bloquearScroll = (ev: TouchEvent) => {
        if (activo) ev.preventDefault()
      }
      function limpiar() {
        clearTimeout(espera)
        activo = false
        document.documentElement.classList.remove('cal-arrastrando')
        setArrastre(null)
        window.removeEventListener('pointermove', mover)
        window.removeEventListener('pointerup', soltar)
        window.removeEventListener('pointercancel', limpiar)
        document.removeEventListener('touchmove', bloquearScroll)
      }
      window.addEventListener('pointermove', mover)
      window.addEventListener('pointerup', soltar)
      window.addEventListener('pointercancel', limpiar)
      document.addEventListener('touchmove', bloquearScroll, { passive: false })
    },
    [destinoEn, aplicar],
  )

  const previa = useMemo((): Previa | null => {
    if (!arrastre?.destino) return null
    const { origen: o, destino: d } = arrastre
    if (o.tipo === 'crear') {
      if (d.min === null) return null
      return { dia: o.dia, zona: 'hora', ini: Math.min(o.desde, d.min), fin: Math.max(o.desde + 15, d.min), titulo: 'Nueva tarea', color: frente?.color ?? 'azul', id: null }
    }
    if (o.tipo === 'meta') return { dia: d.dia, zona: d.zona, ini: null, fin: null, titulo: o.meta.nombre, color: colorDe(o.meta.espacio_id), id: o.meta.id }
    const t = o.tarea
    const base = { titulo: t.titulo, color: colorDe(t.espacio_id), id: t.id }
    if (o.tipo === 'estirar') {
      const ini = aMinutos(t.hora!)
      return { ...base, dia: t.fecha!, zona: 'hora', ini, fin: Math.max(ini + 15, d.min ?? ini) }
    }
    if (d.zona === 'hora' && d.min !== null) {
      const dur = t.hora && t.hora_fin ? aMinutos(t.hora_fin) - aMinutos(t.hora) : t.hora ? 30 : 60
      return { ...base, dia: d.dia, zona: 'hora', ini: d.min, fin: d.min + dur }
    }
    return { ...base, dia: d.dia, zona: d.zona, ini: null, fin: null }
  }, [arrastre, colorDe, frente])

  const arrastrando = arrastre?.destino ? (arrastre.origen.tipo === 'meta' ? arrastre.origen.meta.id : arrastre.origen.tipo === 'crear' ? null : arrastre.origen.tarea.id) : null

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
    <section className="cal" aria-label="Calendario" aria-busy={cargando}>
      <header className="cal-cab">
        <div className="cal-titulo">
          <h2>{titulo.charAt(0).toUpperCase() + titulo.slice(1)}</h2>
          <small>
            {pendientes === 0 ? 'Nada pendiente aquí' : `${pendientes} ${pendientes === 1 ? 'pendiente' : 'pendientes'}`}
            {frente ? ` · ${frente.nombre}` : ''}
          </small>
        </div>
        <div className="cal-mandos">
          <button type="button" className="cal-boton" onClick={() => ir(vista, hoy)} title="Hoy (T)">
            Hoy
          </button>
          <div className="cal-flechas">
            <button type="button" className="cal-icono" aria-label="Anterior" title="Anterior (←)" onClick={() => ir(vista, pasar(vista, fecha, -1))}>
              <Flecha dir={-1} />
            </button>
            <button type="button" className="cal-icono" aria-label="Siguiente" title="Siguiente (→)" onClick={() => ir(vista, pasar(vista, fecha, 1))}>
              <Flecha dir={1} />
            </button>
          </div>
          <div className="cal-vistas" role="radiogroup" aria-label="Vista">
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
          <button type="button" className="cal-boton primario" onClick={() => nuevaEn(dias.includes(hoy) ? hoy : dias[0])} title="Nueva (N)">
            <svg viewBox="0 0 16 16" aria-hidden>
              <path d="M8 3v10M3 8h10" />
            </svg>
            <span>Nueva</span>
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
            <kbd>T</kbd> hoy · <kbd>D</kbd> <kbd>X</kbd> <kbd>W</kbd> <kbd>M</kbd> vista · <kbd>←</kbd> <kbd>→</kbd> · <kbd>N</kbd> nueva
          </p>
        </aside>
      </div>
    </section>
  )
}
