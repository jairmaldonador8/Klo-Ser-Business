import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
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
