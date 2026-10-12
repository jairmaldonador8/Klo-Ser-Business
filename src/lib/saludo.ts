export function saludoPorHora(hora: number, nombre?: string | null): string {
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches'
  const limpio = nombre?.trim()
  return limpio ? `${saludo}, ${limpio}` : saludo
}

const ZONA_POR_DEFECTO = 'America/Monterrey'

/** Una zona inválida en el perfil no debe tumbar la app: cae a la de fábrica. */
function zonaValida(zona: string): string {
  try {
    new Intl.DateTimeFormat('es-MX', { timeZone: zona })
    return zona
  } catch {
    return ZONA_POR_DEFECTO
  }
}

export function horaEn(instante: Date, zona: string): number {
  const hora = new Intl.DateTimeFormat('es-MX', { hour: 'numeric', hourCycle: 'h23', timeZone: zonaValida(zona) }).format(instante)
  return Number(hora)
}

/** «Lunes 12 de octubre» en la zona del usuario. */
export function fechaLarga(instante: Date, zona: string): string {
  const partes = new Intl.DateTimeFormat('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: zonaValida(zona),
  }).formatToParts(instante)
  const parte = (tipo: Intl.DateTimeFormatPartTypes) => partes.find((p) => p.type === tipo)?.value ?? ''
  const texto = `${parte('weekday')} ${parte('day')} de ${parte('month')}`
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}
