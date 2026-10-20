import type Anthropic from '@anthropic-ai/sdk'
import { describe, expect, it, vi } from 'vitest'
import { conversar } from './conversar'

const uso = (id: string, name: string, input: object) => ({ type: 'tool_use', id, name, input })
const turno = (stop_reason: string, content: object[]) => ({ stop_reason, content }) as unknown as Anthropic.Message

/** Cliente falso que responde un guion y guarda lo que recibió. */
function guion(...turnos: Anthropic.Message[]) {
  const recibido: Anthropic.MessageCreateParams[] = []
  const create = vi.fn(async (p: Anthropic.MessageCreateParams) => {
    recibido.push(structuredClone(p))
    return turnos.shift()!
  })
  return { cliente: { messages: { create } } as unknown as Pick<Anthropic, 'messages'>, recibido }
}

const base = { sistema: 'S', panorama: 'P', historia: [] }

describe('conversar', () => {
  it('ejecuta una herramienta y regresa la respuesta con su acción', async () => {
    const { cliente, recibido } = guion(
      turno('tool_use', [uso('u1', 'crear_task', { titulo: 'Llamar a Ana' })]),
      turno('end_turn', [{ type: 'text', text: 'Added it.' }]),
    )
    const ejecutar = vi.fn(async () => ({ texto: 'Created task t1.', resumen: 'Added · Llamar a Ana', deshacer: { tipo: 'borrar_tarea' as const, id: 't1' } }))
    const r = await conversar({ ...base, cliente, texto: 'llamar a ana', ejecutar })
    expect(r).toEqual({ respuesta: 'Added it.', pendientes: [], acciones: [{ nombre: 'crear_task', resumen: 'Added · Llamar a Ana', deshacer: { tipo: 'borrar_tarea', id: 't1' } }] })
    // El sistema fijo va en caché; el panorama después.
    const sistema = recibido[0].system as Anthropic.TextBlockParam[]
    expect(sistema[0].cache_control).toEqual({ type: 'ephemeral' })
    expect(sistema[1].text).toContain('P')
    expect(recibido[1].messages.at(-1)).toMatchObject({ role: 'user', content: [{ type: 'tool_result', tool_use_id: 'u1' }] })
  })

  it('hace 3 cambios y retiene el resto y los borrados', async () => {
    const { cliente } = guion(
      turno('tool_use', [1, 2, 3, 4, 5].map((n) => uso(`u${n}`, 'crear_task', { titulo: `T${n}` }))),
      turno('tool_use', [uso('u6', 'borrar_task', { id: 'x' })]),
      turno('end_turn', [{ type: 'text', text: 'Done 3, 3 waiting.' }]),
    )
    const ejecutar = vi.fn(async () => ({ texto: 'ok', resumen: 'r' }))
    const r = await conversar({ ...base, cliente, texto: 'cinco cosas', ejecutar })
    expect(ejecutar).toHaveBeenCalledTimes(3)
    expect(r.acciones).toHaveLength(3)
    expect(r.pendientes.map((p) => p.nombre)).toEqual(['crear_task', 'crear_task', 'borrar_task'])
  })

  it('una herramienta que falla se le dice a Claude y sigue', async () => {
    const { cliente, recibido } = guion(
      turno('tool_use', [uso('u1', 'cambiar_task', { id: 'nope' })]),
      turno('end_turn', [{ type: 'text', text: 'I could not find it.' }]),
    )
    const ejecutar = vi.fn(async () => ({ texto: 'Unknown task id nope.', error: true }))
    const r = await conversar({ ...base, cliente, texto: 'mueve eso', ejecutar })
    expect(r.acciones).toEqual([])
    expect(recibido[1].messages.at(-1)).toMatchObject({ content: [{ is_error: true }] })
  })

  it('si Claude falla, regresa error sin tronar', async () => {
    const cliente = { messages: { create: vi.fn(async () => Promise.reject(new Error('boom'))) } } as unknown as Pick<Anthropic, 'messages'>
    const r = await conversar({ ...base, cliente, texto: 'hola', ejecutar: vi.fn() })
    expect(r.error).toBe('Error')
  })
})
