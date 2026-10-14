import { redirect } from 'next/navigation'
import { BarraLateral } from '@/components/armazon/barra-lateral'
import { BarraTelefono } from '@/components/armazon/barra-telefono'
import { Encabezado } from '@/components/armazon/encabezado'
import { crearClienteServidor } from '@/lib/supabase/servidor'
import { salir } from './acciones'

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const supabase = await crearClienteServidor()
  const { data } = await supabase.auth.getClaims()
  if (!data?.claims) redirect('/entrar')

  const [{ data: perfil }, { data: espacios }] = await Promise.all([
    supabase.from('perfiles').select('nombre, zona_horaria').eq('user_id', data.claims.sub).single(),
    supabase.from('espacios').select('id, nombre, inicial').order('orden'),
  ])
  if (!espacios?.length) redirect('/bienvenida')

  return (
    <div className="app">
      <BarraLateral frentes={espacios} fraseKlo="Cuando me escribas, aquí te digo qué sigue." />
      <main className="principal">
        <Encabezado nombre={perfil?.nombre ?? null} zona={perfil?.zona_horaria ?? 'America/Monterrey'} salir={salir} />
        {children}
      </main>
      <BarraTelefono />
    </div>
  )
}
