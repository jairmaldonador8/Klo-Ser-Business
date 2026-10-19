import type { FrenteVista } from '@/lib/frentes'
import type { Tarea } from '@/lib/tareas/esquema'

/** Un proyecto con fecha meta: se pinta como bandera en su día. */
export type Meta = {
  id: string
  espacio_id: string
  nombre: string
  fecha_inicio: string
  fecha_meta: string
  /** 0 a 1. */
  avance: number
}

/** Lo que se está arrastrando. `agarre`: minutos entre el inicio del evento y donde se tomó. */
export type Origen =
  | { tipo: 'mover'; tarea: Tarea; agarre: number }
  | { tipo: 'estirar'; tarea: Tarea }
  | { tipo: 'crear'; dia: string; desde: number }
  | { tipo: 'meta'; meta: Meta }

/** Dónde caería: una columna de horas (con minuto), el renglón «todo el día» o una celda del mes. */
export type Destino = { dia: string; zona: 'hora' | 'dia' | 'mes'; min: number | null }

/** La sombra que se pinta mientras arrastras. */
export type Previa = { dia: string; zona: Destino['zona']; ini: number | null; fin: number | null; titulo: string; color: string; id: string | null }

/** Empieza un arrastre desde un `pointerdown`; `alTocar` corre si fue un toque sin mover. */
export type Empezar = (e: React.PointerEvent, origen: Origen, alTocar?: () => void) => void

export type ColorDe = (espacioId: string) => FrenteVista['color']
