'use client'

import { useState } from 'react'
import { COLORES_TAREA, esHex, GAMA_AMPLIADA, NOMBRE_COLOR_TAREA } from '@/lib/tareas/colores'

const enGama = (hex: string) => GAMA_AMPLIADA.some((g) => g.tonos.some((t) => t.hex === hex))

/**
 * El color de una task: el de su space, la paleta base y, en «More colors», la gama ampliada
 * más un selector libre. `valor` '' = el color del space.
 */
export function SelectorColor({ valor, colorEspacio, cambiar }: { valor: string; colorEspacio: string; cambiar: (c: string) => void }) {
  const libre = esHex(valor) && !enGama(valor) ? valor : null
  // Si la task ya trae un tono de la gama o uno libre, el panel abre desplegado.
  const [mas, setMas] = useState(esHex(valor))
  const css = (c: string) => ({ '--c': esHex(c) ? c : `var(--v-p-${c})` }) as React.CSSProperties

  return (
    <div className="v-colores-caja">
      <div className="v-colores" role="radiogroup" aria-label="Color">
        {/* Sin color propio: el de su space. */}
        <button type="button" role="radio" aria-checked={valor === ''} aria-label="Space color" title="Space color" className="auto" style={css(colorEspacio)} onClick={() => cambiar('')} />
        {COLORES_TAREA.map((c) => (
          <button key={c} type="button" role="radio" aria-checked={valor === c} aria-label={NOMBRE_COLOR_TAREA[c]} title={NOMBRE_COLOR_TAREA[c]} style={css(c)} onClick={() => cambiar(c)} />
        ))}
        <button
          type="button"
          className={`mas${esHex(valor) ? ' con-elegido' : ''}`}
          aria-expanded={mas}
          aria-label="More colors"
          title="More colors"
          style={esHex(valor) ? css(valor) : undefined}
          onClick={() => setMas((m) => !m)}
        >
          <svg viewBox="0 0 16 16" aria-hidden>
            <path d={mas ? 'M4 10l4-4 4 4' : 'M4 6l4 4 4-4'} />
          </svg>
        </button>
      </div>

      <div className="v-colores-mas" data-abierto={mas || undefined} aria-hidden={!mas}>
        <div>
          {GAMA_AMPLIADA.map((g) => (
            <div key={g.nombre} className="fila">
              <span>{g.nombre}</span>
              <div className="v-colores" role="radiogroup" aria-label={`${g.nombre} colors`}>
                {g.tonos.map((t) => (
                  <button
                    key={t.hex}
                    type="button"
                    role="radio"
                    tabIndex={mas ? 0 : -1}
                    aria-checked={valor === t.hex}
                    aria-label={t.nombre}
                    title={t.nombre}
                    style={css(t.hex)}
                    onClick={() => cambiar(t.hex)}
                  />
                ))}
              </div>
            </div>
          ))}
          <div className="fila">
            <span>Custom</span>
            <label className={`v-color-libre${libre ? ' elegido' : ''}`} style={libre ? css(libre) : undefined} title="Pick any color">
              <input type="color" tabIndex={mas ? 0 : -1} aria-label="Custom color" value={libre ?? '#7c7dff'} onChange={(e) => cambiar(e.target.value.toLowerCase())} />
              <i aria-hidden />
              <small>{libre ? libre.toUpperCase() : 'Pick any color'}</small>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
