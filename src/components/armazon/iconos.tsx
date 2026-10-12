import type { Icono as NombreIcono } from '@/lib/navegacion'

const TRAZOS: Record<NombreIcono | 'mas', React.ReactNode> = {
  hoy: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  proyectos: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  semana: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  clientes: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18.5 14.8c1.6.8 2.6 2.5 3 5.2" />
    </>
  ),
  notas: (
    <>
      <path d="M5 3h10l4 4v14H5z" />
      <path d="M9 11h6M9 15h4" />
    </>
  ),
  mas: <path d="M12 5v14M5 12h14" />,
}

export function Icono({ nombre }: { nombre: NombreIcono | 'mas' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
      {TRAZOS[nombre]}
    </svg>
  )
}
