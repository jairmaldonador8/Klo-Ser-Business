import 'server-only'
import type { Cliente, Ctx } from './acciones'
import { cuando } from './acciones'
import type { Pendiente } from './conversar'

// Lo que comparten las rutas de Klo: el contexto de quien escribe y los textos de lo pendiente.

export async function leerCtx(sb: Cliente, userId: string) {
  const [{ data: perfil }, { data: espacios }] = await Promise.all([
    sb.from('perfiles').select('nombre, zona_horaria, espacio_predeterminado_id, actividades, klo_brief').eq('user_id', userId).single(),
    sb.from('espacios').select('id, nombre, atajo').order('orden'),
  ])
  const lista = espacios ?? []
  const ctx: Ctx = {
    usuario: userId,
    espacios: new Set(lista.map((e) => e.id)),
    predeterminado: perfil?.espacio_predeterminado_id ?? lista[0]?.id ?? null,
    zona: perfil?.zona_horaria ?? 'America/Monterrey',
  }
  return { ctx, perfil, espacios: lista }
}

/** Chips de lo que espera tu OK («Delete · Ana call»), con el título real de cada task. */
export async function describirPendientes(sb: Cliente, pendientes: Pendiente[]): Promise<string[]> {
  const ids = pendientes.map((p) => (p.input as { id?: string }).id).filter((x): x is string => !!x)
  const { data } = ids.length ? await sb.from('tareas').select('id, titulo').in('id', ids) : { data: [] }
  const titulo = new Map((data ?? []).map((t) => [t.id, t.titulo]))
  return pendientes.map(({ nombre, input }) => {
    const i = input as Record<string, string | undefined>
    const de = (i.id && titulo.get(i.id)) || 'a task'
    switch (nombre) {
      case 'borrar_task':
        return (input as { toda_la_serie?: boolean }).toda_la_serie ? `Stop repeating · ${de}` : `Delete · ${de}`
      case 'crear_task':
        return `Add · ${i.titulo ?? 'task'} · ${cuando(i.fecha ?? null, i.hora ?? null)}${(input as { repetir?: object }).repetir ? ' · repeats' : ''}`
      case 'cambiar_task':
        return i.fecha || i.hora ? `Move · ${de} → ${cuando(i.fecha ?? null, i.hora ?? null)}` : `Edit · ${de}`
      case 'completar_task':
        return `Done · ${de}`
      case 'crear_nota':
        return `${(input as { posible_tarea?: boolean }).posible_tarea ? 'Maybe task' : 'Note'} · ${(i.texto ?? '').slice(0, 50)}`
      case 'crear_proyecto':
        return `New project · ${i.nombre ?? ''}`
      case 'cambiar_proyecto':
        return `Project · ${i.nombre ?? i.estado ?? 'edit'}`
      case 'programar_aviso':
        return `Reminder · ${i.texto ?? ''} · ${cuando(i.fecha ?? null, i.hora ?? null)}`
      default:
        return nombre
    }
  })
}
