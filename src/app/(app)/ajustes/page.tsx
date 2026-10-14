import { esColor, type FrenteVista } from '@/lib/frentes'
import { crearClienteServidor } from '@/lib/supabase/servidor'
import { resolverVista } from '@/lib/vista/resolver'
import { salir } from '../acciones'
import { TuApp } from './tu-app'
import { TusFrentes } from './tus-frentes'

export default async function Ajustes() {
  const supabase = await crearClienteServidor()
  const { data } = await supabase.auth.getClaims()
  const [{ data: perfil }, { data: espacios }] = await Promise.all([
    supabase.from('perfiles').select('vista').eq('user_id', data!.claims.sub).single(),
    supabase.from('espacios').select('id, nombre, inicial, atajo, color').order('orden'),
  ])
  const frentes: FrenteVista[] = (espacios ?? []).map((e) => ({ ...e, color: esColor(e.color) ? e.color : 'azul' }))
  const { secciones, mosaicos } = resolverVista(perfil?.vista)

  return (
    <div className="v-bento">
      <TusFrentes frentes={frentes} />
      <section className="v-t c2" aria-label="Tu cuenta">
        <h3>Tu cuenta</h3>
        <p className="v-sub">Más ajustes (zona horaria, Google Calendar) llegan después.</p>
        <form action={salir} style={{ marginTop: 'auto' }}>
          <button className="v-boton">Salir</button>
        </form>
      </section>
      <TuApp secciones={secciones} mosaicos={mosaicos} />
    </div>
  )
}
