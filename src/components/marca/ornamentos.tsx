import { cn } from '@/lib/utils'

/**
 * Ornamentos v0.3 (de la biblioteca de recursos de Jair, 2026-09-10): las
 * piezas chicas que le dan vida al sistema sin gritar. Cuentagotas:
 * un sol en el saludo, un destello junto a Klo, las colinas al pie de un
 * vacío. Nunca decoran texto operativo ni compiten con la cifra que manda.
 *
 * Todos son SVG en línea y camaleón: el sol es siempre `--sol` (amarillo,
 * funciona en los dos temas); lo azul usa `currentColor` o los tokens
 * `--vivo` / `--azul-suave`, que ya se invierten solos. `aria-hidden`.
 * Los archivos equivalentes viven en public/marca/v03/ornamentos/.
 */
type Props = React.ComponentProps<'svg'>

/** Sol pleno con rayos: la mañana, un logro, un momento de Klo. */
export function Sol({ className, ...props }: Props) {
  return (
    <svg aria-hidden viewBox="0 0 100 100" fill="none" strokeLinecap="round" className={cn('size-8 shrink-0', className)} {...props}>
      <circle cx="50" cy="50" r="24" fill="var(--sol)" />
      <g stroke="var(--sol)" strokeWidth="7">
        <line x1="84" y1="50" x2="94" y2="50" /><line x1="74" y1="74" x2="81.1" y2="81.1" />
        <line x1="50" y1="84" x2="50" y2="94" /><line x1="26" y1="74" x2="18.9" y2="81.1" />
        <line x1="16" y1="50" x2="6" y2="50" /><line x1="26" y1="26" x2="18.9" y2="18.9" />
        <line x1="50" y1="16" x2="50" y2="6" /><line x1="74" y1="26" x2="81.1" y2="18.9" />
      </g>
    </svg>
  )
}

/** Sol asomando en el horizonte: la tarde, algo que apenas empieza. */
export function SolMedio({ className, ...props }: Props) {
  return (
    <svg aria-hidden viewBox="0 0 100 70" fill="none" strokeLinecap="round" className={cn('h-6 w-8 shrink-0', className)} {...props}>
      <path d="M14 62a36 36 0 0 1 72 0z" fill="var(--sol)" />
      <g stroke="var(--sol)" strokeWidth="6">
        <line x1="6.8" y1="46.3" x2="16" y2="49.6" /><line x1="18" y1="26" x2="26" y2="32" />
        <line x1="38" y1="12.5" x2="42" y2="22" /><line x1="62" y1="12.5" x2="58" y2="22" />
        <line x1="82" y1="26" x2="74" y2="32" /><line x1="93.2" y1="46.3" x2="84" y2="49.6" />
      </g>
      <line x1="8" y1="62" x2="92" y2="62" stroke="currentColor" strokeWidth="4" opacity=".35" />
    </svg>
  )
}

/** Tres rayitas de sol: el «¡ajá!» junto a una cifra, una nota o Klo. */
export function Rayitas({ className, ...props }: Props) {
  return (
    <svg aria-hidden viewBox="0 0 60 50" fill="none" strokeLinecap="round" className={cn('h-5 w-6 shrink-0', className)} {...props}>
      <g stroke="var(--sol)" strokeWidth="6">
        <line x1="30" y1="6" x2="33" y2="26" /><line x1="8" y1="18" x2="24" y2="32" /><line x1="52" y1="18" x2="38" y2="32" />
      </g>
    </svg>
  )
}

/** Destello de cuatro puntas, en el color del texto (azul con `text-vivo`). */
export function Destello({ className, ...props }: Props) {
  return (
    <svg aria-hidden viewBox="0 0 100 100" className={cn('size-4 shrink-0', className)} {...props}>
      <path d="M50 8c3 22 12 31 34 34-22 3-31 12-34 34-3-22-12-31-34-34 22-3 31-12 34-34z" fill="currentColor" />
    </svg>
  )
}

/**
 * Colinas al pie: dos lomas en azul suave y azul medio. Se estiran a lo
 * ancho de su contenedor (`preserveAspectRatio="none"`), pensadas para vivir
 * absolutas en el fondo de un vacío o de una pantalla de entrada.
 */
export function Colinas({ className, ...props }: Props) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 600 60"
      preserveAspectRatio="none"
      className={cn('block h-14 w-full', className)}
      {...props}
    >
      {/* Cuatro lomas a lo ancho: dibujadas para ~600 px, así en un panel
          ancho apenas se estiran y en el teléfono se empinan un poco. */}
      <path d="M0 60V34C60 10 120 12 180 26s100 14 160-2 120-18 180 2 60 12 80 6V60z" fill="var(--azul-suave)" />
      <path d="M0 60V48C70 28 130 34 200 44s120 10 180-4 130-12 170 2 40 6 50 4V60z" fill="var(--vivo)" opacity=".35" />
    </svg>
  )
}

/**
 * El sol con nube de la lámina de Jair (hero de la landing), redibujado a
 * vector para que no se pixele a ningún tamaño ni densidad. Colores fijos,
 * no camaleón: es el recorte de su biblioteca tal cual, sol con brillo
 * arriba a la izquierda, corona de ocho rayos (para que al girar siempre se vea
 * entero) y dos nubes en azul suave. Se anima en calma con
 * las clases `sol-nube-*` de globals.css (rayos que giran, sol que respira,
 * nubes que se mecen); con movimiento reducido queda quieto.
 */
export function SolNube({ className, ...props }: Props) {
  return (
    <svg aria-hidden viewBox="0 0 258 186" fill="none" strokeLinecap="round" className={cn('h-auto w-40 shrink-0', className)} {...props}>
      <defs>
        <radialGradient id="sol-nube-brillo" cx="0.36" cy="0.32" r="0.8">
          <stop offset="0" stopColor="#ffd95a" />
          <stop offset="1" stopColor="#ffbe1a" />
        </radialGradient>
        {/* Los rayos solo viven arriba de las nubes: al girar, nada se asoma por debajo. */}
        <clipPath id="sol-nube-cielo">
          <rect x="0" y="0" width="258" height="150" />
        </clipPath>
      </defs>
      <circle className="sol-nube-disco" cx="112" cy="104" r="40" fill="url(#sol-nube-brillo)" />
      <g clipPath="url(#sol-nube-cielo)">
        <g className="sol-nube-rayos" stroke="#ffc933" strokeWidth="9">
          <line x1="164.0" y1="104.0" x2="182.0" y2="104.0" /><line x1="148.8" y1="67.2" x2="161.5" y2="54.5" /><line x1="112.0" y1="52.0" x2="112.0" y2="34.0" /><line x1="75.2" y1="67.2" x2="62.5" y2="54.5" /><line x1="60.0" y1="104.0" x2="42.0" y2="104.0" /><line x1="75.2" y1="140.8" x2="62.5" y2="153.5" /><line x1="112.0" y1="156.0" x2="112.0" y2="174.0" /><line x1="148.8" y1="140.8" x2="161.5" y2="153.5" />
        </g>
      </g>
      <g className="sol-nube-atras" fill="#c6d5ff">
        <circle cx="198" cy="124" r="36" /><circle cx="233" cy="144" r="24" /><rect x="180" y="138" width="77" height="32" rx="15" />
      </g>
      <g className="sol-nube-frente" fill="#dfe6ff">
        <circle cx="74" cy="144" r="26" /><circle cx="114" cy="129" r="34" /><circle cx="160" cy="136" r="31" /><circle cx="203" cy="147" r="24" />
        <rect x="48" y="142" width="180" height="28" rx="14" />
      </g>
    </svg>
  )
}
