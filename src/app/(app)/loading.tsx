import { MarcaCargando } from '@/components/vidrio/apertura'

/** Mientras carga una sección: el logo con su anillo, en el color del space abierto (lo toma de la ventana). */
export default function Cargando() {
  return (
    <div className="v-cargando" role="status" aria-label="Loading">
      <MarcaCargando frente={null} />
    </div>
  )
}
