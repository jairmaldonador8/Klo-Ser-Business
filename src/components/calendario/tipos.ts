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

/** Lo que se está arrastrando. `agarre`: minutos entre el inicio del evento y donde se tomó.
 *  Estirar: `borde` es la orilla que tomaste; la contraria queda fija (y si la cruzas, se voltea). */
export type Origen =
  | { tipo: 'mover'; tarea: Tarea; agarre: number }
  | { tipo: 'estirar'; tarea: Tarea; borde: 'inicio' | 'fin' }
  | { tipo: 'crear'; dia: string; desde: number }
  | { tipo: 'meta'; meta: Meta }

/** Dónde caería: una columna de horas (con minuto), el renglón «todo el día» o una celda del mes. */
export type Destino = { dia: string; zona: 'hora' | 'dia' | 'mes'; min: number | null }

/** Lo que se pinta en la rejilla mientras arrastras. `contorno`: al mover, solo el lugar donde caerá (la copia
 *  flotante va con el puntero). `borrador`: la zona que seleccionaste, que se queda mientras llenas la hoja. */
export type Previa = {
  dia: string
  zona: Destino['zona']
  ini: number | null
  fin: number | null
  titulo: string
  color: string
  id: string | null
  contorno?: boolean
  borrador?: boolean
  /** Si cruza días, sus pedazos por día (lunes 5 pm → medianoche, martes 0:00 → 4 pm). */
  tramos?: { dia: string; ini: number; fin: number }[]
  /** «5 pm – 6 pm» o «Mon 5 pm – Tue 4 pm». */
  etiqueta?: string
}

/** Empieza un arrastre desde un `pointerdown`; `alTocar` corre si fue un toque sin mover. */
export type Empezar = (e: React.PointerEvent, origen: Origen, alTocar?: () => void) => void

export type ColorDe = (espacioId: string) => FrenteVista['color']
