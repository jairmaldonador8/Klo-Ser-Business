import Image from 'next/image'
import { fechaLarga, horaEn, saludoPorHora } from '@/lib/saludo'

type Props = { nombre: string | null; zona: string; salir?: () => Promise<void> }

export function Encabezado({ nombre, zona, salir }: Props) {
  const ahora = new Date()
  const inicial = nombre?.trim().charAt(0).toUpperCase() || '·'

  return (
    <header className="barra">
      <div className="marca-tel">
        <Image src="/marca/blanco/03-wordmark.svg" alt="Klo-Ser" width={96} height={24} unoptimized />
        <span>BUSINESS</span>
      </div>
      <div className="saludo">
        <h1>{saludoPorHora(horaEn(ahora, zona), nombre)}</h1>
        <p>{fechaLarga(ahora, zona)}</p>
      </div>
      {/* La captura de Klo se enciende en la Parte 3. */}
      <label className="captura">
        <span className="disco-sol">
          <Image src="/marca/azul/04-gallo-cabeza.svg" alt="" width={20} height={20} unoptimized />
        </span>
        <input placeholder="Díselo a Klo: «mañana entrego los carruseles de Aurora a las 5»" disabled aria-label="Díselo a Klo" />
        <kbd>⌘ K</kbd>
      </label>
      {salir ? (
        <form action={salir}>
          <button className="avatar" title="Salir" aria-label="Salir">
            <span>{inicial}</span>
          </button>
        </form>
      ) : (
        <div className="avatar">
          <span>{inicial}</span>
        </div>
      )}
    </header>
  )
}
