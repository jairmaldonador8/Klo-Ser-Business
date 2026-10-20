import type { Cliente, Deshacer } from './acciones'

type Resultado = { error: unknown }

/** Lo que revierte un cambio; algunos tocan dos tablas (la serie y sus tasks). */
async function revertir(sb: Cliente, d: Deshacer): Promise<Resultado[]> {
  const ahora = new Date().toISOString()
  switch (d.tipo) {
    case 'borrar_tarea':
      return [await sb.from('tareas').update({ borrado_en: ahora }).eq('id', d.id)]
    case 'restaurar_tarea':
      return [await sb.from('tareas').update(d.campos).eq('id', d.id)]
    case 'borrar_nota':
      return [await sb.from('notas').update({ borrado_en: ahora }).eq('id', d.id)]
    case 'borrar_aviso':
      return [await sb.from('avisos').delete().eq('id', d.id)]
    case 'borrar_memoria':
      return [await sb.from('klo_memoria').delete().eq('id', d.id)]
    case 'borrar_serie':
      return [await sb.from('tareas').update({ borrado_en: ahora }).eq('serie_id', d.id), await sb.from('series').update({ borrado_en: ahora }).eq('id', d.id)]
    case 'restaurar_serie':
      return [
        d.tareas.length ? await sb.from('tareas').update({ borrado_en: null }).in('id', d.tareas) : { error: null },
        await sb.from('series').update(d.campos).eq('id', d.id),
      ]
    case 'borrar_proyecto':
      return [await sb.from('proyectos').delete().eq('id', d.id)]
    case 'restaurar_proyecto':
      return [await sb.from('proyectos').update(d.campos).eq('id', d.id)]
  }
}

/** Revierte lo que hizo Klo en un mensaje, del último cambio al primero. Devuelve cuántos fallaron. */
export async function aplicarDeshacer(sb: Cliente, lista: Deshacer[]): Promise<number> {
  let fallas = 0
  for (const d of [...lista].reverse()) {
    const error = (await revertir(sb, d)).find((r) => r.error)?.error
    if (error) {
      console.error('aplicarDeshacer', d, error)
      fallas++
    }
  }
  return fallas
}
