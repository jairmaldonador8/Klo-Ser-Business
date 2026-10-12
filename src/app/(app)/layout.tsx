import { BarraLateral } from '@/components/armazon/barra-lateral'
import { BarraTelefono } from '@/components/armazon/barra-telefono'
import { Encabezado } from '@/components/armazon/encabezado'

export default function LayoutApp({ children }: { children: React.ReactNode }) {
  return (
    <div className="app">
      <BarraLateral frentes={[]} fraseKlo="Cuando me escribas, aquí te digo qué sigue." />
      <main className="principal">
        <Encabezado nombre={null} zona="America/Monterrey" />
        {children}
      </main>
      <BarraTelefono />
    </div>
  )
}
