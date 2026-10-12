/**
 * El idioma tipográfico de Klo-Ser, en cadenas de clases reutilizables.
 *
 * v0.3 «Klo azul» (2026-09-10). La referencia —la ley— es la lámina
 * `design-propuestas/klo-ser-v03/sistema.html` (y `estilos.css` a su lado).
 * De ahí salen las reglas que aquí se vuelven constantes para que ninguna
 * pantalla las reinvente a ojo:
 *
 * 1. UN SOLO AZUL. El acento es el azul de la marca (`vivo`, `#1c36ee` de
 *    día y `#5e70f3` de noche) y pinta la acción y lo que está pasando
 *    AHORA: el botón principal, un interruptor encendido, el punto de «en
 *    vivo», la barra de avance. La urgencia se sigue diciendo con tinta y
 *    peso, nunca con rojos ni ámbares. El sol (`sol`) es solo de Klo.
 * 2. LA TARJETA QUE MANDA. Una por pantalla: tinta de día, carbón azulado
 *    de noche (`bg-manda text-manda-tinta`), con la cifra que importa en grande.
 *    Las demás son papel blanco con sombra azulada (`bg-white ring-1
 *    ring-slate-200`, que la capa global de `globals.css` viste sola).
 * 3. TITULARES REDONDOS. Saludos y títulos hablan en Fredoka
 *    600 (`font-logo`), la redonda hermana del wordmark; el cuerpo en
 *    Poppins. Las cifras héroe SIEMPRE usan `text-3xl` o mayor: de esa
 *    clase cuelga la fuente en `globals.css`.
 * 4. MICRO-ETIQUETAS. Mayúsculas chiquitas y espaciadas, en gris tenue.
 *
 * Todo se escribe con clases `slate`, que en esta app son camaleón: la misma
 * clase es tinta oscura de día y tinta clara de noche.
 */

/**
 * Micro-etiqueta: el nombrecito que va encima de un dato.
 * `.eyebrow` de la lámina — mayúsculas, chiquita, muy espaciada, gris tenue.
 */
export const MICRO = 'text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-slate-500'

/** La misma micro-etiqueta cuando lleva un icono delante. */
export const MICRO_CON_ICONO = `flex items-center gap-1.5 ${MICRO}`

/**
 * Número héroe: grande y compacto, en Poppins con cifras tabulares (`cifra`). Sin color semántico
 * — todos los números son tinta; lo urgente se distingue por el punto vivo.
 */
export const HEROE = 'cifra text-4xl leading-none text-slate-900'

/** El mismo héroe cuando comparte renglón con otras cosas (tarjeta de asesor). */
export const HEROE_CHICO =
  'cifra text-3xl leading-none text-slate-900'

/**
 * Dinero: un escalón por debajo del héroe.
 *
 * Un héroe es un conteo de una o dos cifras («4», «12»); un monto son once
 * caracteres («$36,610,000») y a `text-4xl` se come la pantalla y desordena
 * la jerarquía del bento (Jair, 2026-09-18: «que el número no sea tan
 * grandote, cuidar la esencia del sistema y los tamaños»). Mismo tamaño que
 * la cifra secundaria que ya usa el cuadro de Avance.
 */
export const DINERO = 'cifra text-2xl leading-none text-slate-900'

/** La cifra de la tarjeta que manda: el héroe más grande, en el color de la tarjeta. */
export const HEROE_MANDA = 'cifra text-6xl leading-none'

/**
 * El punto azul. Con cuentagotas: marca lo que está pasando ahora mismo
 * (alguien esperando respuesta, un plazo ya vencido), nunca una categoría.
 */
export const PUNTO_VIVO = 'size-1.5 shrink-0 rounded-full bg-vivo'

/**
 * Píldora de estado: borde tenue, sin relleno de color. Es la única forma
 * que tienen las colas de una tarjeta de asesor; la más urgente se distingue
 * porque lleva `PILDORA_VIVA` (misma píldora, tinta plena) y el punto azul.
 */
export const PILDORA =
  'inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-500'

/** La píldora de la cola más urgente: mismo monocromo, más peso. */
export const PILDORA_VIVA =
  'inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-900'

/**
 * Chip azul suave: el estado activo o lo que es de Klo (`.chip-azul` de la
 * lámina). Es la única píldora con relleno, y su relleno es azul suave, no
 * azul pleno: el azul pleno se reserva para el botón principal.
 */
export const CHIP_AZUL =
  'inline-flex items-center gap-1.5 rounded-full bg-azul-suave px-2.5 py-1 text-xs font-semibold text-azul-tinta'

/**
 * La tarjeta que manda: una por pantalla, tinta de día y carbón azulado de
 * noche (`--manda`; desde el 2026-09-16 ya no es papel blanco de noche:
 * armoniza con el fondo oscuro y la tinta es marfil), esquinas grandes. Lo
 * que va encima usa `text-manda-tinta` o `currentColor`; nunca `slate`
 * (aquí el camaleón va al revés). La sombra (`shadow-manda`) también cambia
 * con el tema: azulada de día, halo azul de noche.
 */
export const TARJETA_MANDA = 'relative overflow-hidden rounded-3xl bg-manda text-manda-tinta shadow-manda'

/**
 * El botón de WhatsApp: la única excepción de color de la ley (PLUMA §6), el
 * verde es la identidad del canal. Lleno y a lo ancho; va sobre `<Button>`.
 */
export const BOTON_WHATSAPP =
  'h-12 w-full gap-2 rounded-xl bg-emerald-600 text-sm font-medium text-blanco hover:bg-emerald-700'

/**
 * Escala monocroma para barras segmentadas: mismo color, distinta opacidad.
 * De lo más presente a lo más apagado. El tramo que está VIVO no sale de
 * aquí: se pinta con `bg-vivo`.
 */
export const TRAMOS_MONOCROMOS = ['bg-slate-900/70', 'bg-slate-900/40', 'bg-slate-900/18'] as const

/** El riel de la barra segmentada, para que se vean los huecos entre tramos. */
export const PISTA_BARRA = 'flex h-1.5 gap-1 overflow-hidden rounded-full bg-slate-900/8'

/**
 * El score de una captación, dicho en monocromo.
 *
 * La ley prohíbe el color como categoría, así que los tramos que antes eran
 * esmeralda/ámbar/rosa ahora se distinguen por PESO y presencia de tinta:
 * lo que ya está bien pesa, lo que va a medias se lee normal y lo que apenas
 * arranca se apaga. El avance en sí lo cuenta el arco azul del `AnilloScore`.
 */
export function claseScore(porcentaje: number): string {
  if (porcentaje >= 80) return 'font-medium text-slate-900'
  if (porcentaje >= 50) return 'text-slate-600'
  return 'text-slate-400'
}
