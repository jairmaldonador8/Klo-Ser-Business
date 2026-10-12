import Image from 'next/image'

type Props = { antes: string; palabra: string; texto: string }

/** El vacío con Klo del prototipo: titular con una palabra de amanecer. */
export function Vacio({ antes, palabra, texto }: Props) {
  return (
    <div className="vacio">
      <div className="disco-sol">
        <Image src="/marca/azul/02-gallo-completo.svg" alt="" width={76} height={90} unoptimized />
      </div>
      <h2>
        {antes} <span className="text-amanecer">{palabra}</span>
      </h2>
      <p>{texto}</p>
    </div>
  )
}
