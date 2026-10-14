// Da de alta a alguien con correo y contraseña (el registro público está cerrado).
// Uso: node --env-file=.env.local scripts/crear-usuario.mjs persona@correo.com "contraseña" ["Nombre"]
import { createClient } from '@supabase/supabase-js'

const [correoCrudo, contrasena, nombre = ''] = process.argv.slice(2)
if (!correoCrudo || !contrasena) {
  console.error('Uso: node --env-file=.env.local scripts/crear-usuario.mjs persona@correo.com "contraseña" ["Nombre"]')
  process.exit(1)
}
const correo = correoCrudo.trim().toLowerCase()

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
})

// El hook de lista permitida corre también aquí: primero se permite el correo.
const permitido = await supabase.rpc('permitir_correo', { p_correo: correo })
if (permitido.error) {
  console.error('No se pudo permitir el correo:', permitido.error.message)
  process.exit(1)
}

const { error } = await supabase.auth.admin.createUser({
  email: correo,
  password: contrasena,
  email_confirm: true,
  user_metadata: { full_name: nombre },
})
if (error) {
  console.error('No se pudo crear la cuenta:', error.message)
  process.exit(1)
}
console.log(`Listo: ${correo} ya puede entrar en /entrar.`)
