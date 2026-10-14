import Image from 'next/image'
import { redirect } from 'next/navigation'
import { crearClienteServidor } from '@/lib/supabase/servidor'
import { FormaBienvenida } from './forma-bienvenida'

export default async function Bienvenida() {
  const supabase = await crearClienteServidor()
  const { data } = await supabase.auth.getClaims()
  if (!data?.claims) redirect('/entrar')

  const [{ count }, { data: perfil }] = await Promise.all([
    supabase.from('espacios').select('id', { count: 'exact', head: true }),
    supabase.from('perfiles').select('nombre').eq('user_id', data.claims.sub).single(),
  ])
  if (count && count > 0) redirect('/hoy')

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
        <div className="disco-sol size-24">
          <Image src="/marca/azul/02-gallo-completo.svg" alt="" width={60} height={72} unoptimized />
        </div>
        <h1 className="titulo text-3xl">
          ¿En qué <span className="text-amanecer">frentes</span> trabajas?
        </h1>
        <p className="text-tinta-2">
          Cada frente es un espacio: tu empresa, tu agencia, tu marca. Cámbiales el nombre; luego puedes agregar más.
        </p>
        <FormaBienvenida nombreInicial={perfil?.nombre ?? ''} />
      </div>
    </main>
  )
}
