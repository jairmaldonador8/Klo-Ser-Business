export function saludoPorHora(hora: number, nombre?: string | null): string {
  const saludo = hora < 12 ? 'Good morning' : hora < 19 ? 'Good afternoon' : 'Good evening'
  const limpio = nombre?.trim()
  return limpio ? `${saludo}, ${limpio}` : saludo
}

const ZONA_POR_DEFECTO = 'America/Monterrey'

/** Una zona inválida en el perfil no debe tumbar la app: cae a la de fábrica. */
export function zonaValida(zona: string): string {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zona })
    return zona
  } catch {
    return ZONA_POR_DEFECTO
  }
}

export function horaEn(instante: Date, zona: string): number {
  const hora = new Intl.DateTimeFormat('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone: zonaValida(zona) }).format(instante)
  return Number(hora)
}

/** «Monday, October 12» en la zona del usuario. */
export function fechaLarga(instante: Date, zona: string): string {
  const partes = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: zonaValida(zona),
  }).formatToParts(instante)
  const parte = (tipo: Intl.DateTimeFormatPartTypes) => partes.find((p) => p.type === tipo)?.value ?? ''
  return `${parte('weekday')}, ${parte('month')} ${parte('day')}`
}
