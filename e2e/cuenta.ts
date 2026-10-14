import { createClient } from '@supabase/supabase-js'

export const CORREO = process.env.E2E_CORREO ?? 'pruebas-e2e@example.com'
export const CONTRASENA = process.env.E2E_CONTRASENA ?? 'pruebas-e2e-klo-ser-2026'

/** Deja lista la cuenta de pruebas: permitida, confirmada y con la contraseña esperada. */
export async function asegurarCuenta() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false },
  })
  const permitido = await supabase.rpc('permitir_correo', { p_correo: CORREO })
  if (permitido.error) throw new Error(`No se pudo permitir ${CORREO}: ${permitido.error.message}`)

  const { error } = await supabase.auth.admin.createUser({
    email: CORREO,
    password: CONTRASENA,
    email_confirm: true,
    user_metadata: { full_name: 'Pruebas' },
  })
  if (!error) return
  if (error.code !== 'email_exists') throw new Error(`No se pudo crear la cuenta de pruebas: ${error.message}`)

  const { data, error: errorLista } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  if (errorLista) throw errorLista
  const usuario = data.users.find((u) => u.email === CORREO)
  if (!usuario) throw new Error(`La cuenta ${CORREO} existe pero no aparece en la lista`)
  const { error: errorClave } = await supabase.auth.admin.updateUserById(usuario.id, { password: CONTRASENA })
  if (errorClave) throw errorClave
}
