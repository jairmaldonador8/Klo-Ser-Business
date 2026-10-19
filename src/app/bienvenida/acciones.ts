'use server'

import { redirect } from 'next/navigation'
import { prepararFrentes } from '@/lib/frentes'
import { crearClienteServidor } from '@/lib/supabase/servidor'

export type EstadoBienvenida = { mensaje: string | null }

export async function completarBienvenida(_previo: EstadoBienvenida, datos: FormData): Promise<EstadoBienvenida> {
  const supabase = await crearClienteServidor()
  const { data } = await supabase.auth.getClaims()
  if (!data?.claims) redirect('/entrar')

  const preparados = prepararFrentes(datos.getAll('frente').map(String))
  if (!preparados.ok) return { mensaje: preparados.mensaje }

  const { error } = await supabase.rpc('completar_bienvenida', {
    p_nombre: String(datos.get('nombre') ?? ''),
    p_frentes: preparados.frentes,
  })
  if (error) {
    console.error('completar_bienvenida', error)
    return { mensaje: 'Couldn’t save your spaces, try again.' }
  }
  redirect('/hoy')
}
