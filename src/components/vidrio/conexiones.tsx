'use client'

import { useEffect, useRef, useState } from 'react'
import { cablesEntre, type Cable } from '@/lib/vista/cables'

// Cables entre los mosaicos de su bento (DISENO §14). Va como primer hijo del
// .v-bento: mide a sus hermanos .v-t y dibuja detrás los cables y encima los puertos.
// En teléfono (una columna) no se dibuja: no hay espacio entre cuadros.
export function Conexiones() {
  const ref = useRef<SVGSVGElement>(null)
  const [cables, setCables] = useState<Cable[]>([])

  useEffect(() => {
    const bento = ref.current?.parentElement
    if (!bento) return
    let cuadro = 0
    const medir = () => {
      cancelAnimationFrame(cuadro)
      cuadro = requestAnimationFrame(() => {
        if (window.innerWidth <= 700) return setCables([])
        const base = bento.getBoundingClientRect()
        const cajas = [...bento.querySelectorAll<HTMLElement>(':scope > .v-t')].map((t) => {
          const r = t.getBoundingClientRect()
          return { x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height }
        })
        setCables(cablesEntre(cajas))
      })
    }
    const observador = new ResizeObserver(medir)
    observador.observe(bento)
    medir()
    return () => {
      observador.disconnect()
      cancelAnimationFrame(cuadro)
    }
  }, [])

  return (
    <>
      <svg ref={ref} className="v-cables" aria-hidden>
        {cables.map((c, n) => (
          <g key={n}>
            {c.brasa && <path d={c.d} className="v-cable-brillo" />}
            <path d={c.d} className={c.brasa ? 'v-cable brasa' : 'v-cable'} />
            {c.brasa && <path d={c.d} className="v-cable-luz" pathLength={100} style={{ animationDelay: `${-n * 1.7}s` }} />}
          </g>
        ))}
      </svg>
      <svg className="v-puertos" aria-hidden>
        {cables.map((c, n) => (
          <g key={n} className={c.brasa ? 'brasa' : undefined}>
            <circle cx={c.a.x} cy={c.a.y} r={5.5} />
            <circle cx={c.b.x} cy={c.b.y} r={5.5} />
          </g>
        ))}
      </svg>
    </>
  )
}
