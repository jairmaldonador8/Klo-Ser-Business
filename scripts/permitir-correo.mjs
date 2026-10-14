// Uso: node --env-file=.env.local scripts/permitir-correo.mjs persona@correo.com
import { createClient } from '@supabase/supabase-js'

const correo = process.argv[2]
if (!correo) {
  console.error('Falta el correo: node --env-file=.env.local scripts/permitir-correo.mjs persona@correo.com')
  process.exit(1)
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
})
const { error } = await supabase.rpc('permitir_correo', { p_correo: correo })
if (error) {
  console.error('No se pudo permitir el correo:', error.message)
  process.exit(1)
}
console.log(`Listo: ${correo.toLowerCase()} ya puede entrar.`)
