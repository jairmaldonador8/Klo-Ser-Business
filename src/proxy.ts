import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { esRutaPublica } from '@/lib/rutas'

/**
 * Refresca la sesión (ÚNICO lugar donde se refresca: los refresh tokens son de un solo uso)
 * y manda a /entrar a quien no tenga sesión.
 */
export async function proxy(request: NextRequest) {
  let respuesta = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (lista, encabezados?: Record<string, string>) => {
          lista.forEach(({ name, value }) => request.cookies.set(name, value))
          respuesta = NextResponse.next({ request })
          lista.forEach(({ name, value, options }) => respuesta.cookies.set(name, value, options))
          // Evita que un CDN guarde la cookie de sesión de un usuario y se la sirva a otro.
          Object.entries(encabezados ?? {}).forEach(([clave, valor]) => respuesta.headers.set(clave, valor))
        },
      },
    },
  )

  const { data } = await supabase.auth.getClaims()

  if (!data?.claims && !esRutaPublica(request.nextUrl.pathname)) {
    const destino = request.nextUrl.clone()
    destino.pathname = '/entrar'
    destino.search = ''
    const redireccion = NextResponse.redirect(destino)
    respuesta.cookies.getAll().forEach((cookie) => redireccion.cookies.set(cookie))
    return redireccion
  }

  return respuesta
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|apple-icon.png|manifest.webmanifest|marca/|iconos/).*)'],
}
