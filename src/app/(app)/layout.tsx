import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { HojaProvider } from '@/components/hoja/hoja-provider'
import { BarraArriba } from '@/components/vidrio/barra-arriba'
import { Pildoras } from '@/components/vidrio/pildoras'
import { Riel } from '@/components/vidrio/riel'
import { Ventana } from '@/components/vidrio/ventana'
import { esColor, type FrenteVista } from '@/lib/frentes'
import { crearClienteServidor } from '@/lib/supabase/servidor'
import { resolverVista } from '@/lib/vista/resolver'

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const supabase = await crearClienteServidor()
  const { data } = await supabase.auth.getClaims()
  if (!data?.claims) redirect('/entrar')

  const [{ data: perfil }, { data: espacios }, { data: proyectos }] = await Promise.all([
    supabase.from('perfiles').select('nombre, zona_horaria, vista').eq('user_id', data.claims.sub).single(),
    supabase.from('espacios').select('id, nombre, inicial, atajo, color').order('orden'),
    supabase.from('proyectos').select('id, espacio_id, nombre').eq('estado', 'activo').order('nombre'),
  ])
  if (!espacios?.length) redirect('/bienvenida')

  const frentes: FrenteVista[] = espacios.map((e) => ({ ...e, color: esColor(e.color) ? e.color : 'azul' }))
  const secciones = resolverVista(perfil?.vista).secciones.filter((s) => s.visible)

  // useSearchParams (frente abierto) vive en componentes cliente: van dentro de Suspense.
  return (
    <>
      <div className="v-auras" aria-hidden>
        <i />
        <i />
        <i />
      </div>
      {/* La hoja de edición se abre desde cualquier parte (el +, un renglón, una nota). */}
      <HojaProvider frentes={frentes} proyectos={proyectos ?? []}>
        <div className="v-escena">
          <Suspense>
            <Riel secciones={secciones} />
            <Ventana frentes={frentes}>
              <BarraArriba nombre={perfil?.nombre ?? null} zona={perfil?.zona_horaria ?? 'America/Monterrey'} frentes={frentes} />
              {children}
            </Ventana>
            {/* Fuera de la ventana: su backdrop-filter atraparía el position:fixed. */}
            <Pildoras frentes={frentes} />
          </Suspense>
        </div>
      </HojaProvider>
    </>
  )
}
