import Image from 'next/image'
import { redirect } from 'next/navigation'
import { crearClienteServidor } from '@/lib/supabase/servidor'
import { FormaEntrar } from './forma-entrar'

export default async function Entrar() {
  const supabase = await crearClienteServidor()
  const { data } = await supabase.auth.getClaims()
  if (data?.claims) redirect('/hoy')

  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className="relative flex w-full max-w-sm flex-col items-center gap-6 text-center">
        <div className="aura">
          <i />
          <i />
          <i />
        </div>
        <div className="lockup items-center">
          <Image src="/marca/blanco/03-wordmark.svg" alt="Klo-Ser" width={180} height={45} unoptimized priority />
          <span>BUSINESS</span>
        </div>
        <div className="disco-sol size-28">
          <Image src="/marca/azul/02-gallo-completo.svg" alt="" width={72} height={86} unoptimized />
        </div>
        <h1 className="titulo text-2xl">
          Your founder work, in <span className="text-amanecer">one place</span>
        </h1>
        <FormaEntrar />
      </div>
    </main>
  )
}
