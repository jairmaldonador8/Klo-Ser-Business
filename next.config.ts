import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // El indicador de desarrollo tapa la barra del teléfono (y los clics de Playwright).
  devIndicators: false,
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
