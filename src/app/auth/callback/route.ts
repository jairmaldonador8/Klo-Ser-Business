import { NextResponse, type NextRequest } from 'next/server'
import { destinoSeguro } from '@/lib/rutas'
import { crearClienteServidor } from '@/lib/supabase/servidor'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const codigo = searchParams.get('code')
  const destino = destinoSeguro(searchParams.get('next'))

  if (codigo) {
    const supabase = await crearClienteServidor()
    const { error } = await supabase.auth.exchangeCodeForSession(codigo)
    if (!error) return NextResponse.redirect(`${origin}${destino}`)
    console.error('auth/callback', error)
  }

  // Sin código: Google o el hook de lista permitida rechazaron la entrada.
  return NextResponse.redirect(`${origin}/entrar?error=1`)
}
