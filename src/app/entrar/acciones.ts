'use server'

import { redirect } from 'next/navigation'
import { crearClienteServidor } from '@/lib/supabase/servidor'

export type EstadoEntrar = { mensaje: string | null }

export async function entrarConCorreo(_previo: EstadoEntrar, datos: FormData): Promise<EstadoEntrar> {
  const correo = String(datos.get('correo') ?? '').trim().toLowerCase()
  const contrasena = String(datos.get('contrasena') ?? '')
  if (!correo || !contrasena) return { mensaje: 'Enter your email and password.' }

  const supabase = await crearClienteServidor()
  const { error } = await supabase.auth.signInWithPassword({ email: correo, password: contrasena })
  if (error) {
    // Mismo mensaje para correo inexistente o contraseña mala: no revela quién tiene cuenta.
    return { mensaje: 'Email or password don’t match.' }
  }
  redirect('/hoy')
}
