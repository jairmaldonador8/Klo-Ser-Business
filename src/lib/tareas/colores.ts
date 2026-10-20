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

/** Gama ampliada («More colors»): 10 matices en tres intensidades y neutros cálidos, afinados para el negro. */
export const GAMA_AMPLIADA: { nombre: string; tonos: { hex: string; nombre: string }[] }[] = [
  {
    nombre: 'Vivid',
    tonos: [
      { hex: '#ff6b6b', nombre: 'Coral' },
      { hex: '#ff8a3d', nombre: 'Orange' },
      { hex: '#ffc046', nombre: 'Amber' },
      { hex: '#c6dc5a', nombre: 'Lime' },
      { hex: '#4cd2a0', nombre: 'Jade' },
      { hex: '#3ec5d6', nombre: 'Teal' },
      { hex: '#4f9dff', nombre: 'Azure' },
      { hex: '#7c7dff', nombre: 'Indigo' },
      { hex: '#b57cff', nombre: 'Violet' },
      { hex: '#ff6fae', nombre: 'Magenta' },
    ],
  },
  {
    nombre: 'Soft',
    tonos: [
      { hex: '#f2a7a2', nombre: 'Blush' },
      { hex: '#f4bc93', nombre: 'Peach' },
      { hex: '#f0d595', nombre: 'Butter' },
      { hex: '#d3e2a6', nombre: 'Pistachio' },
      { hex: '#a3dcc5', nombre: 'Seafoam' },
      { hex: '#9fd6df', nombre: 'Aqua' },
      { hex: '#a9c7f3', nombre: 'Powder' },
      { hex: '#bbbcf3', nombre: 'Periwinkle' },
      { hex: '#d3bbf2', nombre: 'Lilac' },
      { hex: '#f1b3cd', nombre: 'Rose' },
    ],
  },
  {
    nombre: 'Deep',
    tonos: [
      { hex: '#c94a3f', nombre: 'Brick' },
      { hex: '#c96a2e', nombre: 'Rust' },
      { hex: '#bf8f22', nombre: 'Ochre' },
      { hex: '#7f9b31', nombre: 'Olive' },
      { hex: '#2b9470', nombre: 'Emerald' },
      { hex: '#22838f', nombre: 'Petrol' },
      { hex: '#3166c2', nombre: 'Cobalt' },
      { hex: '#5150bd', nombre: 'Ink' },
      { hex: '#8045b8', nombre: 'Plum' },
      { hex: '#b4447d', nombre: 'Berry' },
    ],
  },
  {
    nombre: 'Neutral',
    tonos: [
      { hex: '#e8e4dc', nombre: 'Ivory' },
      { hex: '#c4bbae', nombre: 'Sand' },
      { hex: '#8f877d', nombre: 'Stone' },
    ],
  },
]

export const esHex = (v: unknown): v is string => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v)

/** El color en CSS: un hex tal cual; una clave de paleta (de task o de frente), su variable --v-p-<clave>. */
export const colorCss = (color: string) => (esHex(color) ? color : `var(--v-p-${color})`)
