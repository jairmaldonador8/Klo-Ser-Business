import Image from 'next/image'
import type { FrenteVista } from '@/lib/frentes'

/** La marca del space: su logo (blanco, sobre el degradado de su color) o, si no tiene, su inicial. */
export function MarcaEspacio({ frente }: { frente: Pick<FrenteVista, 'inicial' | 'logo'> }) {
  if (!frente.logo) return <>{frente.inicial}</>
  return <Image className="v-logo-espacio" src={frente.logo} alt="" width={64} height={64} unoptimized draggable={false} />
}
