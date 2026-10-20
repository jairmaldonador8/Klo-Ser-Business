import type { Cliente, Deshacer } from './acciones'

/** Revierte lo que hizo Klo en un mensaje, del último cambio al primero. Devuelve cuántos fallaron. */
export async function aplicarDeshacer(sb: Cliente, lista: Deshacer[]): Promise<number> {
  let fallas = 0
  for (const d of [...lista].reverse()) {
    const ahora = new Date().toISOString()
    const { error } =
      d.tipo === 'borrar_tarea'
        ? await sb.from('tareas').update({ borrado_en: ahora }).eq('id', d.id)
        : d.tipo === 'restaurar_tarea'
          ? await sb.from('tareas').update(d.campos).eq('id', d.id)
          : d.tipo === 'borrar_nota'
            ? await sb.from('notas').update({ borrado_en: ahora }).eq('id', d.id)
            : d.tipo === 'borrar_aviso'
              ? await sb.from('avisos').delete().eq('id', d.id)
              : await sb.from('klo_memoria').delete().eq('id', d.id)
    if (error) {
      console.error('aplicarDeshacer', d, error)
      fallas++
    }
  }
  return fallas
}
