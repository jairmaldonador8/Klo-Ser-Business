import { fechaEn, instanteEn } from '@/lib/fechas'
import { esColor, type FrenteVista } from '@/lib/frentes'
import { sumarUso } from '@/lib/klo/costo'
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
    supabase.from('perfiles').select('vista, actividades, klo_brief, resumen_hora, zona_horaria').eq('user_id', data!.claims.sub).single(),
    supabase.from('espacios').select('id, nombre, inicial, atajo, color, logo, logo_ancho').order('orden'),
    supabase.from('klo_memoria').select('id, texto').order('creado_en'),
  ])
  // Lo que Klo gastó este mes y hoy, en tu zona horaria.
  const zona = perfil?.zona_horaria ?? 'America/Monterrey'
  const hoy = fechaEn(new Date(), zona)
  const inicioHoy = instanteEn(hoy, '00:00', zona).toISOString()
  const { data: respuestas } = await supabase
    .from('klo_mensajes')
    .select('creado_en, tokens_entrada, tokens_salida, tokens_cache_leidos, tokens_cache_escritos')
    .eq('rol', 'klo')
    .gte('creado_en', instanteEn(`${hoy.slice(0, 8)}01`, '00:00', zona).toISOString())
  const uso = { mes: sumarUso(respuestas ?? []), hoy: sumarUso((respuestas ?? []).filter((m) => m.creado_en >= inicioHoy)) }
  const frentes: FrenteVista[] = (espacios ?? []).map((e) => ({ ...e, color: esColor(e.color) ? e.color : 'azul' }))
  const { secciones, mosaicos } = resolverVista(perfil?.vista)

  return (
    <div className="v-bento">
      <Notificaciones resumenHora={perfil?.resumen_hora ?? null} />
      <KloBrief brief={perfil?.klo_brief ?? ''} memoria={memoria ?? []} uso={uso} />
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
