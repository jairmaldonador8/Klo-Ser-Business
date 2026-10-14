import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './tipos'

/** Cliente por petición para Server Components, Server Actions y rutas. */
export async function crearClienteServidor() {
  const almacen = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => almacen.getAll(),
        setAll: (lista) => {
          try {
            lista.forEach(({ name, value, options }) => almacen.set(name, value, options))
          } catch {
            // Server Components no pueden escribir cookies; el proxy ya refrescó la sesión.
          }
        },
      },
    },
  )
}
