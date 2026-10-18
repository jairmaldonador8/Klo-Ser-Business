import type { Metadata, Viewport } from 'next'
import { Caveat, JetBrains_Mono, Poppins } from 'next/font/google'
import './globals.css'

const poppins = Poppins({ variable: '--font-poppins', subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] })
// Mono para metadatos y la captura de Klo (navegación tipo terminal).
const mono = JetBrains_Mono({ variable: '--font-mono', subsets: ['latin'], weight: ['400', '500'] })
// Notas a mano, con cuentagotas.
const caveat = Caveat({ variable: '--font-caveat', subsets: ['latin'], weight: ['700'] })

export const metadata: Metadata = {
  title: 'Klo-Ser Business',
  description: 'El sistema con el que organizas tu trabajo de founder.',
  appleWebApp: { capable: true, title: 'Business', statusBarStyle: 'black-translucent' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#000000',
  // Sin cover, env(safe-area-inset-*) vale 0 en iPhone.
  viewportFit: 'cover',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-MX" className={`${poppins.variable} ${mono.variable} ${caveat.variable}`}>
      <body>{children}</body>
    </html>
  )
}
