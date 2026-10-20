import { NextResponse } from 'next/server'
import { textoAviso, textoResumen, tocaAviso, tocaResumen, type TareaAviso } from '@/lib/avisos/calcular'
import { enviarA } from '@/lib/avisos/enviar'
import { horaMinEn, sumarDias } from '@/lib/fechas'
import { crearClienteServicio } from '@/lib/supabase/servicio'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

const ZONA = 'America/Monterrey'

/** Lo llama pg_cron cada minuto. Cada aviso se reclama antes de mandarlo: dos pasadas cruzadas no avisan doble. */
export async function GET(req: Request) {
  const secreto = process.env.CRON_SECRET
  if (!secreto || req.headers.get('authorization') !== `Bearer ${secreto}`) return NextResponse.json({ mensaje: 'No.' }, { status: 401 })

  const sb = crearClienteServicio()
  const ahora = new Date()
  const hoyUtc = ahora.toISOString().slice(0, 10)
  const cuenta = { tareas: 0, avisos: 0, resumenes: 0 }

  // 1. Antes de cada task. Ventana amplia en fechas (las zonas cruzan el día UTC); el filtro fino lo hace tocaAviso.
  const [{ data: candidatas, error }, { data: perfiles }] = await Promise.all([
    sb
      .from('tareas')
      .select('id, titulo, fecha, hora, aviso_min, responsable_id')
      .is('avisado_en', null)
      .is('borrado_en', null)
      .is('completada_en', null)
      .not('hora', 'is', null)
      .not('aviso_min', 'is', null)
      .gte('fecha', sumarDias(hoyUtc, -1))
      .lte('fecha', sumarDias(hoyUtc, 2))
      .limit(1000),
    // responsable_id apunta a auth.users, no a perfiles: la zona sale de una segunda consulta.
    sb.from('perfiles').select('user_id, zona_horaria, resumen_hora, resumen_enviado'),
  ])
  if (error) console.error('avisos: tareas', error)
  const zonaDe = new Map((perfiles ?? []).map((p) => [p.user_id, p.zona_horaria ?? ZONA]))

  const tocan = (candidatas ?? [])
    .map((t) => {
      const aviso: TareaAviso = { id: t.id, titulo: t.titulo, fecha: t.fecha!, hora: t.hora!, aviso_min: t.aviso_min!, zona: zonaDe.get(t.responsable_id) ?? ZONA }
      return { t, aviso }
    })
    .filter(({ aviso }) => tocaAviso(aviso, ahora))
  if (tocan.length) {
    const { data: reclamadas } = await sb
      .from('tareas')
      .update({ avisado_en: ahora.toISOString() })
      .in('id', tocan.map(({ t }) => t.id))
      .is('avisado_en', null)
      .select('id')
    const mias = new Set((reclamadas ?? []).map((r) => r.id))
    for (const { t, aviso } of tocan.filter(({ t }) => mias.has(t.id))) {
      await enviarA(sb, t.responsable_id, { titulo: t.titulo, cuerpo: textoAviso(aviso, ahora), url: '/hoy', tag: `t-${t.id}` })
      cuenta.tareas++
    }
  }

  // 2. Avisos que programó Klo.
  const { data: avisos } = await sb
    .from('avisos')
    .update({ enviado_en: ahora.toISOString() })
    .is('enviado_en', null)
    .lte('enviar_en', ahora.toISOString())
    .select('id, owner_id, texto, url')
  for (const a of avisos ?? []) {
    await enviarA(sb, a.owner_id, { titulo: 'Klo', cuerpo: a.texto, url: a.url ?? '/hoy', tag: `a-${a.id}` })
    cuenta.avisos++
  }

  // 3. Resumen de la mañana.
  for (const p of perfiles ?? []) {
    const zona = p.zona_horaria ?? ZONA
    const hoy = tocaResumen({ resumen_hora: p.resumen_hora, resumen_enviado: p.resumen_enviado, zona }, ahora)
    if (!hoy) continue
    const { data: tomado } = await sb
      .from('perfiles')
      .update({ resumen_enviado: hoy })
      .eq('user_id', p.user_id)
      .or(`resumen_enviado.is.null,resumen_enviado.neq.${hoy}`)
      .select('user_id')
    if (!tomado?.length) continue
    const { data: deHoy } = await sb
      .from('tareas')
      .select('titulo, hora')
      .eq('responsable_id', p.user_id)
      .eq('fecha', hoy)
      .is('borrado_en', null)
      .is('completada_en', null)
    await enviarA(sb, p.user_id, { titulo: 'Your day', cuerpo: textoResumen(deHoy ?? [], horaMinEn(ahora, zona)), url: '/hoy', tag: `r-${hoy}` })
    cuenta.resumenes++
  }

  return NextResponse.json(cuenta)
}
