// Paleta para pintar una task (como Notion Calendar). Tonos afinados para el negro de la app;
// cada clave tiene su variable --v-p-<clave> en calendario.css, igual que los colores de los frentes.

export const COLORES_TAREA = ['brasa', 'oro', 'menta', 'cielo', 'azul', 'lavanda', 'rosa', 'rojo', 'grafito'] as const
export type ColorTarea = (typeof COLORES_TAREA)[number]

export const NOMBRE_COLOR_TAREA: Record<ColorTarea, string> = {
  brasa: 'Ember',
  oro: 'Gold',
  menta: 'Mint',
  cielo: 'Sky',
  azul: 'Blue',
  lavanda: 'Lavender',
  rosa: 'Pink',
  rojo: 'Red',
  grafito: 'Graphite',
}

export const esColorTarea = (v: unknown): v is ColorTarea => typeof v === 'string' && (COLORES_TAREA as readonly string[]).includes(v)
