import type { Metadata, Viewport } from 'next'
import { Caveat, JetBrains_Mono, Urbanist } from 'next/font/google'
import './globals.css'

// Geométrica redonda y ligera: la letra de toda la app (DISENO §12).
const urbanist = Urbanist({ variable: '--font-urbanist', subsets: ['latin'], weight: ['200', '300', '400', '500', '600', '700', '800'] })
// Mono solo para atajos de teclado.
const mono = JetBrains_Mono({ variable: '--font-mono', subsets: ['latin'], weight: ['400', '500'] })
// Notas a mano, con cuentagotas.
const caveat = Caveat({ variable: '--font-caveat', subsets: ['latin'], weight: ['700'] })

export const metadata: Metadata = {
  title: 'Klo-Ser Business',
  description: 'The system you run your founder work with.',
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
    <html lang="en" className={`${urbanist.variable} ${mono.variable} ${caveat.variable}`}>
      <body>{children}</body>
    </html>
  )
}
