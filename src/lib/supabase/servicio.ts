import 'server-only'
import { createClient } from '@supabase/supabase-js'
import type { Database } from './tipos'

/** Cliente con la llave secreta: se salta RLS. Solo para el cron de avisos, que recorre a todos. */
export function crearClienteServicio() {
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
