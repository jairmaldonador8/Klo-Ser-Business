import { ArrowUp } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { AbrirKlo } from '@/components/klo/campo-klo'
import type { ProyectoLista } from '@/lib/datos'
import type { FrenteVista } from '@/lib/frentes'
import { avance, porcentaje, textoFaltan } from '@/lib/proyectos/avance'
import { conFrente } from '@/lib/rutas'

const retraso = (i: number) => ({ animationDelay: `${i * 55}ms` })

/** La tarjeta que manda: media luna en azul sobre negro. */
export function MosaicoMedidor({ hechas, pendientes, siguiente, i }: { hechas: number; pendientes: number; siguiente: string | null; i: number }) {
  const total = hechas + pendientes
  const avance = total ? hechas / total : 0
  const largo = Math.round(Math.PI * 130 * 100) / 100
  const angulo = Math.PI + avance * Math.PI
  // Redondeado: el medidor también se pinta en el navegador y sus decimales deben coincidir con los del servidor.
  const r2 = (x: number) => Math.round(x * 100) / 100
  const marcas = Array.from({ length: 31 }, (_, n) => {
    const a = Math.PI + (n * Math.PI) / 30
    const [radio1, radio2] = [148, n % 5 ? 154 : 160]
    return (
      <line
        key={n}
        x1={r2(170 + radio1 * Math.cos(a))}
        y1={r2(170 + radio1 * Math.sin(a))}
        x2={r2(170 + radio2 * Math.cos(a))}
        y2={r2(170 + radio2 * Math.sin(a))}
        stroke={`rgba(255,255,255,${n % 5 ? 0.18 : 0.4})`}
        strokeWidth={2}
        strokeLinecap="round"
      />
    )
  })

  return (
    <section className="v-t c2 r2" style={retraso(i)} aria-label="Your day">
      <div className="v-fila">
        <h3>Your day</h3>
        <span className="v-chip">
          {hechas} of {total} done
        </span>
      </div>
      <div className="v-medidor">
        <svg viewBox="0 0 340 190" role="img" aria-label={`${pendientes} to do today`}>
          <defs>
            <linearGradient id="v-amanecer" x1="0" x2="1">
              <stop offset="0" stopColor="#c8643a" />
              <stop offset="1" stopColor="#ffb38a" />
            </linearGradient>
          </defs>
          {marcas}
          <path d="M40 170 A130 130 0 0 1 300 170" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth={16} strokeLinecap="round" />
          {avance > 0 && (
            <path
              className="v-arco"
              d="M40 170 A130 130 0 0 1 300 170"
              fill="none"
              stroke="url(#v-amanecer)"
              strokeWidth={16}
              strokeLinecap="round"
              strokeDasharray={largo}
              style={{ '--largo': largo, '--fin': r2(largo * (1 - avance)) } as React.CSSProperties}
            />
          )}
          <circle cx={r2(170 + 130 * Math.cos(angulo))} cy={r2(170 + 130 * Math.sin(angulo))} r={10} fill="#fff" stroke="#000" strokeWidth={4} />
        </svg>
        <div className="centro">
          <small>to do today</small>
          <b>{pendientes}</b>
        </div>
      </div>
      <p className="v-sub" style={{ textAlign: 'center' }}>
        {siguiente ? (
          <>
            Up next: <b style={{ color: 'var(--tinta)', fontWeight: 500 }}>{siguiente}</b>
          </>
        ) : total === 0 ? (
          'Nothing left today. Capture with the +.'
        ) : pendientes === 0 ? (
          'All done for today!'
        ) : (
          `You have ${pendientes} left today.`
        )}
      </p>
    </section>
  )
}

export function MosaicoKlo({ frase, i }: { frase: string; i: number }) {
  return (
    <section className="v-t c2" style={retraso(i)} aria-label="Klo">
      <AbrirKlo className="v-klo klo-boton klo-tarjeta">
        <span className="klo-orbe" data-grande aria-hidden>
          <Image src="/marca/azul/02-gallo-completo.svg" alt="" width={30} height={35} unoptimized />
        </span>
        <span className="klo-tarjeta-cuerpo">
          <span className="klo-tarjeta-quien">
            <b>Klo</b>
            <i className="klo-punto" aria-hidden />
            Ready
          </span>
          <h3>“{frase}”</h3>
          <span className="klo-tarjeta-campo">
            Tell Klo anything…
            <span className="klo-enviar" aria-hidden>
              <ArrowUp size={16} strokeWidth={2.5} />
            </span>
          </span>
        </span>
      </AbrirKlo>
    </section>
  )
}

type Simple = { titulo: string; vacio: string; ancho?: 1 | 2; punteada?: boolean; chip?: string; i: number }

/** Mosaico con título y su estado vacío (los datos llegan con 0002/0003). */
export function MosaicoSimple({ titulo, vacio, ancho = 1, punteada, chip, i }: Simple) {
  return (
    <section className={`v-t ${ancho === 2 ? 'c2' : ''} ${punteada ? 'punteada' : ''}`} style={retraso(i)} aria-label={titulo}>
      <div className="v-fila">
        <h3>{titulo}</h3>
        {chip && <span className="v-chip">{chip}</span>}
      </div>
      <p className="v-sub">{vacio}</p>
    </section>
  )
}

type Lista = { titulo: string; vacio: string; ancho?: 1 | 2; chip?: string; mas?: number; i: number; children?: React.ReactNode[] }

/** Mosaico con renglones (la página ya los cortó a 6; `mas` dice cuántos quedaron fuera). */
export function MosaicoLista({ titulo, vacio, ancho = 1, chip, mas = 0, i, children = [] }: Lista) {
  return (
    // Con renglones, el de una columna se abre a lo ancho en el teléfono: a media columna no caben.
    <section className={`v-t ${ancho === 2 ? 'c2' : children.length ? 'lleno' : ''}`} style={retraso(i)} aria-label={titulo}>
      <div className="v-fila">
        <h3>{titulo}</h3>
        {chip && <span className="v-chip">{chip}</span>}
      </div>
      {children.length ? <ul className="v-lista">{children}</ul> : <p className="v-sub">{vacio}</p>}
      {mas > 0 && <p className="v-sub">and {mas} more</p>}
    </section>
  )
}

type Proyectos = { proyectos: ProyectoLista[]; hoy: string; frente?: FrenteVista | null; i: number }

/** Los proyectos activos más cerca de su meta, con su barra de avance. */
export function MosaicoProyectos({ proyectos, hoy, frente, i }: Proyectos) {
  const ruta = conFrente('/proyectos', frente?.atajo)
  return (
    <section className={`v-t c2 ${proyectos.length ? '' : 'punteada'}`} style={retraso(i)} aria-label="Projects">
      <div className="v-fila">
        <h3>Projects</h3>
        {proyectos.length > 0 && (
          <Link href={ruta} className="v-chip">
            See all →
          </Link>
        )}
      </div>
      {proyectos.length ? (
        <ul className="v-lista">
          {proyectos.map((p) => {
            const x = avance(p, p)
            return (
              <li key={p.id}>
                <Link href={conFrente('/proyectos/' + p.id, frente?.atajo)} className="v-proyecto">
                <div className="v-fila">
                  <b>{p.nombre}</b>
                  <span className="v-sub">{porcentaje(x)}</span>
                </div>
                <div className="v-barra-avance" role="progressbar" aria-label={`${p.nombre} progress`} aria-valuenow={Math.floor(x * 100)} aria-valuemin={0} aria-valuemax={100}>
                  <i style={{ width: `${x * 100}%` }} />
                </div>
                <small className="v-sub">{textoFaltan(p.fecha_meta, hoy)}</small>
                </Link>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="v-sub">
          {frente ? `${frente.nombre} has no active projects yet. ` : 'No active projects yet. '}
          <Link href={ruta} style={{ color: 'var(--tinta)', textDecoration: 'underline' }}>
            New project
          </Link>
        </p>
      )}
    </section>
  )
}

type Tareas = { hechas: React.ReactNode; total: number; microWins: React.ReactNode; accion: React.ReactNode; mas?: number; i: number; children?: React.ReactNode[] }

/** Tu lista de trabajo del día: micro wins arriba y tus tasks abajo; lo hecho se queda tachado hasta mañana. */
export function MosaicoTareas({ hechas, total, microWins, accion, mas = 0, i, children = [] }: Tareas) {
  return (
    <section className="v-t c2 v-tareas" style={retraso(i)} aria-label="Tasks">
      <div className="v-fila">
        <h3>Tasks</h3>
        <div className="v-fila" style={{ gap: 8 }}>
          {total > 0 && (
            <span className="v-chip">
              {hechas} of {total} done
            </span>
          )}
          {accion}
        </div>
      </div>
      {microWins}
      <span className="etq">Today</span>
      {children.length ? <ul className="v-lista">{children}</ul> : <p className="v-sub">Nothing on your list yet. Plan your day with “+ Add task”.</p>}
      {mas > 0 && <p className="v-sub">and {mas} more</p>}
    </section>
  )
}
