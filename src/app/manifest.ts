import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Klo-Ser Business',
    short_name: 'Business',
    description: 'El sistema con el que organizas tu trabajo de founder.',
    start_url: '/hoy',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    lang: 'es-MX',
    icons: [
      { src: '/iconos/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/iconos/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
