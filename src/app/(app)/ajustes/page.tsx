import { esColor, type FrenteVista } from '@/lib/frentes'
import { crearClienteServidor } from '@/lib/supabase/servidor'
import { resolverVista } from '@/lib/vista/resolver'
import { salir } from '../acciones'
import { KloBrief } from './klo-brief'
import { Notificaciones } from './notificaciones'
import { TuApp } from './tu-app'
import { TusActividades } from './tus-actividades'
import { TusFrentes } from './tus-frentes'

export default async function Ajustes() {
  const supabase = await crearClienteServidor()
  const { data } = await supabase.auth.getClaims()
  const [{ data: perfil }, { data: espacios }, { data: memoria }] = await Promise.all([
    supabase.from('perfiles').select('vista, actividades, klo_brief, resumen_hora').eq('user_id', data!.claims.sub).single(),
    supabase.from('espacios').select('id, nombre, inicial, atajo, color, logo, logo_ancho').order('orden'),
    supabase.from('klo_memoria').select('id, texto').order('creado_en'),
  ])
  const frentes: FrenteVista[] = (espacios ?? []).map((e) => ({ ...e, color: esColor(e.color) ? e.color : 'azul' }))
  const { secciones, mosaicos } = resolverVista(perfil?.vista)

  return (
    <div className="v-bento">
      <Notificaciones resumenHora={perfil?.resumen_hora ?? null} />
      <KloBrief brief={perfil?.klo_brief ?? ''} memoria={memoria ?? []} />
      <TusFrentes frentes={frentes} />
      <TusActividades actividades={perfil?.actividades ?? []} />
      <section className="v-t c2" aria-label="Your account">
        <h3>Your account</h3>
        <p className="v-sub">More settings (time zone, Google Calendar) are coming.</p>
        <form action={salir} style={{ marginTop: 'auto' }}>
          <button className="v-boton">Sign out</button>
        </form>
      </section>
      <TuApp secciones={secciones} mosaicos={mosaicos} />
    </div>
  )
}
