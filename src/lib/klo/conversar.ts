import Anthropic from '@anthropic-ai/sdk'
import type { Deshacer, Hecho } from './acciones'
import { decidir, esHerramienta, HERRAMIENTAS, type NombreHerramienta } from './herramientas'

// El bucle con Claude: pide, ejecuta (o retiene) herramientas y repite hasta la respuesta final.

export const MODELO_KLO = 'claude-haiku-5-5'
const MAX_VUELTAS = 6
const TOPE_MS = 20_000

export type Accion = { nombre: NombreHerramienta; resumen?: string; deshacer?: Deshacer }
export type Pendiente = { nombre: NombreHerramienta; input: unknown }
export type Uso = { entrada: number; salida: number; cacheLeidos: number; cacheEscritos: number }
export type Conversacion = { respuesta: string; acciones: Accion[]; pendientes: Pendiente[]; uso: Uso; error?: string }

type Opciones = {
  cliente: Pick<Anthropic, 'messages'>
  sistema: string
  panorama: string
  historia: Anthropic.MessageParam[]
  texto: string
  ejecutar: (nombre: NombreHerramienta, input: unknown) => Promise<Hecho>
}

export async function conversar({ cliente, sistema, panorama, historia, texto, ejecutar }: Opciones): Promise<Conversacion> {
  const mensajes: Anthropic.MessageParam[] = [...historia, { role: 'user', content: texto }]
  const acciones: Accion[] = []
  const pendientes: Pendiente[] = []
  const uso: Uso = { entrada: 0, salida: 0, cacheLeidos: 0, cacheEscritos: 0 }
  let cambios = 0
  const senal = AbortSignal.timeout(TOPE_MS)

  try {
    for (let vuelta = 0; vuelta < MAX_VUELTAS; vuelta++) {
      const r = await cliente.messages.create(
        {
          model: MODELO_KLO,
          max_tokens: 2000,
          output_config: { effort: 'low' },
          system: [
            { type: 'text', text: sistema, cache_control: { type: 'ephemeral' } },
            { type: 'text', text: `## Live context\n${panorama}` },
          ],
          tools: HERRAMIENTAS,
          messages: mensajes,
        },
        { signal: senal },
      )
      // Se suma cada vuelta: es lo que se cobra por esta respuesta.
      uso.entrada += r.usage?.input_tokens ?? 0
      uso.salida += r.usage?.output_tokens ?? 0
      uso.cacheLeidos += r.usage?.cache_read_input_tokens ?? 0
      uso.cacheEscritos += r.usage?.cache_creation_input_tokens ?? 0

      if (r.stop_reason === 'refusal') return { respuesta: '', acciones, pendientes, uso, error: 'refusal' }
      const usos = r.content.filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
      if (r.stop_reason !== 'tool_use' || !usos.length) {
        const respuesta = r.content
          .filter((b): b is Anthropic.TextBlock => b.type === 'text')
          .map((b) => b.text)
          .join('\n')
          .trim()
        return { respuesta: respuesta || 'Done.', acciones, pendientes, uso }
      }

      mensajes.push({ role: 'assistant', content: r.content })
      const resultados: Anthropic.ToolResultBlockParam[] = []
      for (const uso of usos) {
        if (!esHerramienta(uso.name)) {
          resultados.push({ type: 'tool_result', tool_use_id: uso.id, content: `Unknown tool ${uso.name}.`, is_error: true })
          continue
        }
        if (decidir(uso.name, cambios) === 'retener') {
          pendientes.push({ nombre: uso.name, input: uso.input })
          resultados.push({ type: 'tool_result', tool_use_id: uso.id, content: 'Held for confirmation: the user will confirm or cancel it in the app.' })
          continue
        }
        try {
          const hecho = await ejecutar(uso.name, uso.input)
          if (!hecho.error && uso.name !== 'buscar') {
            cambios++
            acciones.push({ nombre: uso.name, resumen: hecho.resumen, deshacer: hecho.deshacer })
          }
          resultados.push({ type: 'tool_result', tool_use_id: uso.id, content: hecho.texto, is_error: hecho.error })
        } catch (e) {
          console.error('klo: herramienta', uso.name, e)
          resultados.push({ type: 'tool_result', tool_use_id: uso.id, content: 'The tool failed unexpectedly.', is_error: true })
        }
      }
      // Todos los resultados en un solo mensaje: así Claude sigue haciendo llamadas en paralelo.
      mensajes.push({ role: 'user', content: resultados })
    }
    return { respuesta: 'I did what I could — check the rest.', acciones, pendientes, uso }
  } catch (e) {
    console.error('klo: claude', e)
    return { respuesta: '', acciones, pendientes, uso, error: e instanceof Error ? e.name : 'error' }
  }
}
