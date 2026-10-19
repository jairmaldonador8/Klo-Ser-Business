import { sumarDias } from '@/lib/fechas'

// Fechas del calendario: todo en «AAAA-MM-DD» y «HH:MM», sin zonas (la zona ya la resolvió el servidor).

export const VISTAS = ['dia', '3dias', 'semana', 'mes'] as const
export type Vista = (typeof VISTAS)[number]
export const NOMBRE_VISTA: Record<Vista, string> = { dia: 'Día', '3dias': '3 días', semana: 'Semana', mes: 'Mes' }

export const esVista = (v: unknown): v is Vista => typeof v === 'string' && (VISTAS as readonly string[]).includes(v)
export const esFecha = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v))

const utc = (fecha: string) => new Date(`${fecha}T12:00:00Z`)

/** 0 = lunes … 6 = domingo. La semana empieza en lunes. */
export const diaSemana = (fecha: string) => (utc(fecha).getUTCDay() + 6) % 7

export const inicioSemana = (fecha: string) => sumarDias(fecha, -diaSemana(fecha))

export const primeroDeMes = (fecha: string) => `${fecha.slice(0, 7)}-01`

export function sumarMeses(fecha: string, n: number): string {
  const d = utc(primeroDeMes(fecha))
  d.setUTCMonth(d.getUTCMonth() + n)
  return d.toISOString().slice(0, 10)
}

export const serie = (desde: string, n: number) => Array.from({ length: n }, (_, i) => sumarDias(desde, i))

/** Las semanas completas (lunes a domingo) que cubren el mes de `fecha`: 4 a 6 renglones. */
export function rejillaMes(fecha: string): string[] {
  const inicio = inicioSemana(primeroDeMes(fecha))
  const ultimo = sumarDias(sumarMeses(fecha, 1), -1)
  const fin = sumarDias(inicioSemana(ultimo), 6)
  const n = Math.round((utc(fin).getTime() - utc(inicio).getTime()) / 86_400_000) + 1
  return serie(inicio, n)
}

/** Los días que pinta cada vista. */
export function diasVista(vista: Vista, fecha: string): string[] {
  if (vista === 'dia') return [fecha]
  if (vista === '3dias') return serie(fecha, 3)
  if (vista === 'semana') return serie(inicioSemana(fecha), 7)
  return rejillaMes(fecha)
}

/** La fecha ancla al avanzar (+1) o retroceder (-1) una página de la vista. */
export function pasar(vista: Vista, fecha: string, dir: 1 | -1): string {
  if (vista === 'mes') return sumarMeses(fecha, dir)
  return sumarDias(fecha, dir * (vista === 'dia' ? 1 : vista === '3dias' ? 3 : 7))
}

/** Lo que el servidor carga alrededor de `fecha`: el mes completo con una semana de colchón. */
export function rangoCarga(fecha: string): { desde: string; hasta: string } {
  const r = rejillaMes(fecha)
  return { desde: sumarDias(r[0], -7), hasta: sumarDias(r[r.length - 1], 7) }
}

export const dentro = (dias: readonly string[], r: { desde: string; hasta: string }) =>
  dias[0] >= r.desde && dias[dias.length - 1] <= r.hasta

const mes = (f: string, conAnio: boolean) =>
  new Intl.DateTimeFormat('es-MX', { timeZone: 'UTC', month: 'long', ...(conAnio && { year: 'numeric' }) })
    .format(utc(f))
    .replace(' de ', ' ')

/** «octubre 2026», o «oct – nov 2026» si la vista cruza meses. */
export function tituloVista(vista: Vista, fecha: string): string {
  if (vista === 'mes') return mes(fecha, true)
  const dias = diasVista(vista, fecha)
  const a = dias[0]
  const b = dias[dias.length - 1]
  if (a.slice(0, 7) === b.slice(0, 7)) return mes(a, true)
  const corto = (f: string) => new Intl.DateTimeFormat('es-MX', { timeZone: 'UTC', month: 'short' }).format(utc(f)).replace('.', '')
  return a.slice(0, 4) === b.slice(0, 4) ? `${corto(a)} – ${corto(b)} ${b.slice(0, 4)}` : `${corto(a)} ${a.slice(0, 4)} – ${corto(b)} ${b.slice(0, 4)}`
}

/** «lun», «mar»… */
export const diaCorto = (fecha: string) =>
  new Intl.DateTimeFormat('es-MX', { timeZone: 'UTC', weekday: 'short' }).format(utc(fecha)).replace('.', '')

export const numeroDia = (fecha: string) => Number(fecha.slice(8, 10))

// ── Horas ──────────────────────────────────────────────────────────────
export const aMinutos = (h: string) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3, 5))
export function deMinutos(m: number): string {
  const x = Math.max(0, Math.min(24 * 60 - 1, Math.round(m)))
  return `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`
}
/** Redondea a la rejilla (15 min por defecto). */
export const ajustar = (m: number, paso = 15) => Math.round(m / paso) * paso

/** «9 am», «12 pm», «5:30 pm». */
export function horaCorta(h: string): string {
  const m = aMinutos(h)
  const hh = Math.floor(m / 60)
  const mm = m % 60
  const h12 = hh % 12 || 12
  return `${h12}${mm ? `:${String(mm).padStart(2, '0')}` : ''} ${hh < 12 ? 'am' : 'pm'}`
}
