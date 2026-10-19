import { z } from 'zod'
import { diaSemana, inicioSemana } from '@/lib/calendario/fechas'
import { sumarDias } from '@/lib/fechas'

// Reglas de repetición (como Notion Calendar / RRULE, en chico). Todo en «AAAA-MM-DD», sin zonas.

export const esquemaRegla = z.object({
  freq: z.enum(['dia', 'semana', 'mes', 'anio']),
  cada: z.number().int().min(1).max(99),
  /** Semana: 0 = lunes … 6 = domingo. */
  dias: z.array(z.number().int().min(0).max(6)).min(1).max(7).optional(),
  /** Mes: el mismo número de día (24) o la misma posición (4.º sábado / último sábado). */
  mes: z.enum(['dia', 'posicion']).optional(),
})
export type Regla = z.infer<typeof esquemaRegla>

export const esquemaFin = z.object({
  hasta: z.iso.date().nullable().default(null),
  conteo: z.number().int().min(1).max(1000).nullable().default(null),
})
export type Fin = z.infer<typeof esquemaFin>
export const SIN_FIN: Fin = { hasta: null, conteo: null }

const NOMBRE_DIA = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MES_CORTO = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const partes = (f: string) => ({ a: Number(f.slice(0, 4)), m: Number(f.slice(5, 7)), d: Number(f.slice(8, 10)) })
const fecha = (a: number, m: number, d: number) => `${a}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
const diasDelMes = (a: number, m: number) => new Date(Date.UTC(a, m, 0)).getUTCDate()
/** Suma meses a (año, mes) sin tocar el día. */
const mesMas = (a: number, m: number, n: number) => ({ a: a + Math.floor((m - 1 + n) / 12), m: ((m - 1 + n) % 12) + 1 })

/** Posición del día en su mes: 1.º…4.º, o -1 si es el último (un 5.º sábado se lee como «el último»). */
export function posicionEnMes(f: string): number {
  const { a, m, d } = partes(f)
  return d + 7 > diasDelMes(a, m) ? -1 : Math.ceil(d / 7)
}

/** El n-ésimo día de la semana `dow` del mes (n = -1: el último). */
function enesimo(a: number, m: number, dow: number, n: number): string | null {
  if (n === -1) {
    const ultimo = fecha(a, m, diasDelMes(a, m))
    return sumarDias(ultimo, -((diaSemana(ultimo) - dow + 7) % 7))
  }
  const primero = fecha(a, m, 1)
  const d = 1 + ((dow - diaSemana(primero) + 7) % 7) + (n - 1) * 7
  return d <= diasDelMes(a, m) ? fecha(a, m, d) : null
}

/**
 * Las fechas de la serie desde `inicio` hasta `tope` (incluido), respetando cómo termina.
 * Las de antes de `desde` se cuentan (para «tras N veces») pero no se devuelven.
 */
export function fechasDe(regla: Regla, inicio: string, tope: string, fin: Fin = SIN_FIN, desde = inicio): string[] {
  const limite = fin.hasta && fin.hasta < tope ? fin.hasta : tope
  const salida: string[] = []
  let contadas = 0
  const agregar = (f: string | null): boolean => {
    if (!f || f < inicio) return true
    if (f > limite) return false
    contadas++
    if (fin.conteo && contadas > fin.conteo) return false
    if (f >= desde) salida.push(f)
    return true
  }

  for (let k = 0, vueltas = 0; vueltas < 5000; k++, vueltas++) {
    if (regla.freq === 'dia') {
      if (!agregar(sumarDias(inicio, k * regla.cada))) break
    } else if (regla.freq === 'semana') {
      const semana = sumarDias(inicioSemana(inicio), k * 7 * regla.cada)
      if (semana > limite) break
      const dias = [...new Set(regla.dias ?? [diaSemana(inicio)])].sort((x, y) => x - y)
      let seguir = true
      for (const dow of dias) if (!agregar(sumarDias(semana, dow))) seguir = false
      if (!seguir) break
    } else if (regla.freq === 'mes') {
      const base = partes(inicio)
      const { a, m } = mesMas(base.a, base.m, k * regla.cada)
      if (fecha(a, m, 1) > limite) break
      const f = regla.mes === 'posicion' ? enesimo(a, m, diaSemana(inicio), posicionEnMes(inicio)) : base.d <= diasDelMes(a, m) ? fecha(a, m, base.d) : null
      if (!agregar(f)) break
    } else {
      const base = partes(inicio)
      const a = base.a + k * regla.cada
      if (fecha(a, 1, 1) > limite) break
      if (!agregar(base.d <= diasDelMes(a, base.m) ? fecha(a, base.m, base.d) : null)) break
    }
  }
  return salida
}

const ordinal = (n: number) => (n === -1 ? 'last' : `${n}${n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'}`)
const diaDelMes = (d: number) => `${d}${d % 10 === 1 && d !== 11 ? 'st' : d % 10 === 2 && d !== 12 ? 'nd' : d % 10 === 3 && d !== 13 ? 'rd' : 'th'}`

/** «Every week on Sat», «Every 2 weeks on Mon, Wed», «Every month on the 4th Sat»… y cómo termina. */
export function etiquetaRegla(regla: Regla, inicio: string, fin: Fin = SIN_FIN): string {
  const n = regla.cada
  const cada = (uno: string, varios: string) => (n === 1 ? `Every ${uno}` : `Every ${n} ${varios}`)
  let texto: string
  if (regla.freq === 'dia') texto = cada('day', 'days')
  else if (regla.freq === 'semana') {
    const dias = [...new Set(regla.dias ?? [diaSemana(inicio)])].sort((x, y) => x - y)
    const clave = dias.join()
    if (n === 1 && clave === '0,1,2,3,4') texto = 'Every weekday'
    else if (n === 1 && clave === '5,6') texto = 'Every weekend day'
    else if (n === 1 && dias.length === 7) texto = 'Every day'
    else texto = `${cada('week', 'weeks')} on ${dias.map((d) => NOMBRE_DIA[d]).join(', ')}`
  } else if (regla.freq === 'mes') {
    const { d } = partes(inicio)
    texto = regla.mes === 'posicion' ? `${cada('month', 'months')} on the ${ordinal(posicionEnMes(inicio))} ${NOMBRE_DIA[diaSemana(inicio)]}` : `${cada('month', 'months')} on the ${diaDelMes(d)}`
  } else {
    const { m, d } = partes(inicio)
    texto = `${cada('year', 'years')} on ${MES_CORTO[m - 1]} ${d}`
  }
  if (fin.hasta) {
    const { m, d } = partes(fin.hasta)
    texto += ` · until ${MES_CORTO[m - 1]} ${d}`
  } else if (fin.conteo) texto += ` · ${fin.conteo} times`
  return texto
}

/** Las opciones rápidas del menú «Repeat», armadas para el día elegido (como Notion). */
export function opcionesPara(inicio: string): { etiqueta: string; regla: Regla }[] {
  const dow = diaSemana(inicio)
  const reglas: Regla[] = [
    { freq: 'dia', cada: 1 },
    dow < 5 ? { freq: 'semana', cada: 1, dias: [0, 1, 2, 3, 4] } : { freq: 'semana', cada: 1, dias: [5, 6] },
    { freq: 'semana', cada: 1, dias: [dow] },
    { freq: 'semana', cada: 2, dias: [dow] },
    { freq: 'mes', cada: 1, mes: 'dia' },
    { freq: 'mes', cada: 1, mes: 'posicion' },
    { freq: 'anio', cada: 1 },
  ]
  return reglas.map((regla) => ({ etiqueta: etiquetaRegla(regla, inicio), regla }))
}

export { NOMBRE_DIA }

/** ¿Las dos reglas dicen lo mismo? (para marcar la opción elegida en el menú). */
export const mismaRegla = (a: Regla | null, b: Regla | null) =>
  !!a && !!b && a.freq === b.freq && a.cada === b.cada && (a.mes ?? 'dia') === (b.mes ?? 'dia') && [...(a.dias ?? [])].sort().join() === [...(b.dias ?? [])].sort().join()

/** Cuánto hacia adelante se generan las repeticiones (días). La app extiende antes de llegar al final. */
export const HORIZONTE = 180
export const EXTENDER_SI_FALTAN = 90
