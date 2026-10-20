import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // El indicador de desarrollo tapa la barra del teléfono (y los clics de Playwright).
  devIndicators: false,
  // El service worker nunca se cachea: así cada deploy lo actualiza (guía de PWA de Next).
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
    ]
  },
  // Tailwind v4 se procesa con el loader de Turbopack (lo trae create-next-app 16.4).
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
}

export default nextConfig
