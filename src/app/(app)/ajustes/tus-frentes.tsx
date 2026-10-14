'use client'

import { useState, useTransition } from 'react'
import { COLORES, type Color, type FrenteVista } from '@/lib/frentes'
import { mover } from '@/lib/vista/resolver'
import { guardarFrente, ordenarFrentes, type Resultado } from './acciones'

const NOMBRE_COLOR: Record<Color, string> = { azul: 'Azul', sol: 'Sol', rosa: 'Rosa', violeta: 'Violeta' }

export function TusFrentes({ frentes: iniciales }: { frentes: FrenteVista[] }) {
  const [frentes, setFrentes] = useState(iniciales)
  const [aviso, setAviso] = useState('')
  const [, empezar] = useTransition()

  function correr(accion: () => Promise<Resultado>, siFalla: FrenteVista[]) {
    setAviso('Guardando…')
    empezar(async () => {
      const r = await accion()
      if (!r.ok) setFrentes(siFalla)
      setAviso(r.ok ? 'Guardado' : r.mensaje)
    })
  }

  function cambiarColor(f: FrenteVista, color: Color) {
    const antes = frentes
    setFrentes(frentes.map((x) => (x.id === f.id ? { ...x, color } : x)))
    correr(() => guardarFrente(f.id, { color }), antes)
  }

  function renombrar(f: FrenteVista, nombre: string) {
    if (nombre.trim() === f.nombre) return
    const antes = frentes
    setFrentes(frentes.map((x) => (x.id === f.id ? { ...x, nombre: nombre.trim() } : x)))
    correr(() => guardarFrente(f.id, { nombre }), antes)
  }

  function reordenar(id: string, direccion: -1 | 1) {
    const antes = frentes
    const nuevos = mover(frentes, id, direccion)
    setFrentes(nuevos)
    correr(() => ordenarFrentes(nuevos.map((x) => x.id)), antes)
  }

  return (
    <section className="v-t c2" aria-label="Tus frentes">
      <h3>Tus frentes</h3>
      <ul className="v-lista">
        {frentes.map((f, n) => (
          <li key={f.id} className="v-renglon" style={{ flexWrap: 'wrap' }}>
            <span className={`v-foto v-color-${f.color}`} style={{ width: 34, height: 34, fontSize: 15, borderRadius: 11 }}>
              {f.inicial}
            </span>
            <input
              className="v-campo"
              defaultValue={f.nombre}
              maxLength={40}
              aria-label={`Nombre de ${f.nombre}`}
              onBlur={(e) => renombrar(f, e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            />
            <div className="v-muestras" role="radiogroup" aria-label={`Color de ${f.nombre}`}>
              {COLORES.map((c) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  className="v-muestra"
                  aria-checked={f.color === c}
                  aria-label={NOMBRE_COLOR[c]}
                  style={{ background: `var(--v-f-${c})` }}
                  onClick={() => cambiarColor(f, c)}
                />
              ))}
            </div>
            <button type="button" className="v-flecha" aria-label={`Subir ${f.nombre}`} disabled={n === 0} onClick={() => reordenar(f.id, -1)}>
              ↑
            </button>
            <button
              type="button"
              className="v-flecha"
              aria-label={`Bajar ${f.nombre}`}
              disabled={n === frentes.length - 1}
              onClick={() => reordenar(f.id, 1)}
            >
              ↓
            </button>
          </li>
        ))}
      </ul>
      <p className="v-aviso" role="status">
        {aviso}
      </p>
    </section>
  )
}
