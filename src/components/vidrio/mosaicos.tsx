import Image from 'next/image'
import Link from 'next/link'
import type { FrenteVista } from '@/lib/frentes'
import { conFrente } from '@/lib/rutas'

const retraso = (i: number) => ({ animationDelay: `${i * 55}ms` })

/** La tarjeta que manda en vidrio: media luna con el amanecer. */
export function MosaicoMedidor({ hechas, pendientes, siguiente, i }: { hechas: number; pendientes: number; siguiente: string | null; i: number }) {
  const total = hechas + pendientes
  const avance = total ? hechas / total : 0
  const largo = Math.PI * 130
  const angulo = Math.PI + avance * Math.PI
  const marcas = Array.from({ length: 31 }, (_, n) => {
    const a = Math.PI + (n * Math.PI) / 30
    const [r1, r2] = [148, n % 5 ? 154 : 160]
    return (
      <line
        key={n}
        x1={170 + r1 * Math.cos(a)}
        y1={170 + r1 * Math.sin(a)}
        x2={170 + r2 * Math.cos(a)}
        y2={170 + r2 * Math.sin(a)}
        stroke={`rgba(255,255,255,${n % 5 ? 0.18 : 0.4})`}
        strokeWidth={2}
        strokeLinecap="round"
      />
    )
  })

  return (
    <section className="v-t c2 r2" style={retraso(i)} aria-label="Tu día">
      <div className="v-fila">
        <h3>Tu día</h3>
        <span className="v-chip">
          {hechas} de {total} hechas
        </span>
      </div>
      <div className="v-medidor">
        <svg viewBox="0 0 340 190" role="img" aria-label={`${pendientes} por hacer hoy`}>
          <defs>
            <linearGradient id="v-amanecer" x1="0" x2="1">
              <stop offset="0" stopColor="#2a44ff" />
              <stop offset=".4" stopColor="#7b4dff" />
              <stop offset=".7" stopColor="#ff5f8f" />
              <stop offset="1" stopColor="#ffc933" />
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
              style={{ '--largo': largo, '--fin': largo * (1 - avance) } as React.CSSProperties}
            />
          )}
          <circle cx={170 + 130 * Math.cos(angulo)} cy={170 + 130 * Math.sin(angulo)} r={10} fill="#fff" stroke="#06071a" strokeWidth={4} />
        </svg>
        <div className="centro">
          <small>por hacer hoy</small>
          <b>{pendientes}</b>
        </div>
      </div>
      <p className="v-sub" style={{ textAlign: 'center' }}>
        {siguiente ? (
          <>
            Lo siguiente: <b style={{ color: 'var(--tinta)', fontWeight: 500 }}>{siguiente}</b>
          </>
        ) : (
          'Aún no hay tareas. Muy pronto las capturas con el +.'
        )}
      </p>
    </section>
  )
}

export function MosaicoKlo({ frase, i }: { frase: string; i: number }) {
  return (
    <section className="v-t c2" style={retraso(i)} aria-label="Klo">
      <div className="v-klo">
        <div className="v-disco">
          <Image src="/marca/azul/02-gallo-completo.svg" alt="" width={56} height={66} unoptimized />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
          <span className="v-sub">Klo te dice</span>
          <h3>«{frase}»</h3>
          <div className="v-ondas" aria-hidden>
            {Array.from({ length: 14 }, (_, n) => (
              <i key={n} style={{ animationDelay: `${n * 80}ms` }} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export function MosaicoFrente({ frente, ruta, i }: { frente: FrenteVista; ruta: string; i: number }) {
  return (
    <Link href={conFrente(ruta, frente.atajo)} className={`v-t v-color-${frente.color}`} style={retraso(i)}>
      <div style={{ minWidth: 0 }}>
        <h3>{frente.nombre}</h3>
        <div className="v-sub">abrir frente →</div>
      </div>
      <div className="v-pila" style={{ marginTop: 'auto' }}>
        <span>0 hoy · Al día</span>
      </div>
      <span className="v-ilus" aria-hidden>
        {frente.inicial}
      </span>
    </Link>
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
