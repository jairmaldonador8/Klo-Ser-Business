import { KloGallo } from '@/components/marca/klo'
import { Colinas, Sol } from '@/components/marca/ornamentos'
import { cn } from '@/lib/utils'

/**
 * El vacío de la casa (v0.3): Klo parado sobre unas colinas con el sol
 * detrás, un título en Fredoka y una línea que dice qué hacer. Sustituye a
 * los cuadros punteados con texto gris que había en cada pantalla — el
 * mensaje de la biblioteca de recursos: «Nothing here yet. Big things start
 * somewhere».
 *
 * `chico` es la versión para listas dentro de una pantalla (una cola vacía
 * en Inicio, un timeline sin eventos): sin colinas ni sol, Klo más pequeño y
 * en una sola línea, para que no pese más que las secciones con datos.
 */
export function VacioKlo({
  titulo,
  children,
  accion,
  chico = false,
  className,
  lema = 'Big things start somewhere.',
}: {
  titulo: string
  /** La línea de abajo: qué significa el vacío y qué hacer. */
  children?: React.ReactNode
  /** Un botón o enlace, opcional. */
  accion?: React.ReactNode
  chico?: boolean
  className?: string
  /** La frase a mano al pie (de la biblioteca de frases). `null` la quita. */
  lema?: string | null
}) {
  if (chico) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white/60 px-4 py-3',
          className
        )}
      >
        <KloGallo className="w-9 shrink-0 text-vivo" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">{titulo}</p>
          {children ? <p className="text-xs text-slate-500">{children}</p> : null}
        </div>
        {accion ? <div className="ml-auto shrink-0">{accion}</div> : null}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-3xl border border-dashed border-slate-300 bg-white/60 px-6 pt-10 pb-20 text-center lg:mx-auto lg:max-w-2xl',
        className
      )}
    >
      <div className="relative mx-auto flex w-28 items-end justify-center">
        {/* El sol asoma por detrás de la cola de Klo (arriba a la izquierda);
            a la derecha lo taparía la cabeza. */}
        <Sol className="absolute -top-2 -left-1 size-12" />
        <KloGallo className="relative w-24 text-vivo" />
      </div>
      <h2 className="mt-3 text-xl text-slate-900">{titulo}</h2>
      {children ? <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{children}</p> : null}
      {accion ? <div className="mt-4 flex justify-center">{accion}</div> : null}
      {lema ? (
        <p aria-hidden className="font-mano relative z-[1] mt-5 -rotate-2 text-xl font-bold text-vivo">
          {lema}
        </p>
      ) : null}
      <Colinas className="absolute inset-x-0 bottom-0 h-14" />
    </div>
  )
}
