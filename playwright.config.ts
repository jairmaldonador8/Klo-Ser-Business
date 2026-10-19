import { defineConfig, devices } from '@playwright/test'

// Las pruebas con sesión usan una cuenta propia en el proyecto DEV (ver e2e/sesion.setup.ts).
try {
  process.loadEnvFile('.env.local')
} catch {}

const SESION = 'test-results/.sesion.json'

export default defineConfig({
  testDir: 'e2e',
  // Un solo worker: comparten la cuenta de pruebas y, con el server de dev compilando y WebKit lento en
  // Windows, en paralelo salían fallas intermitentes por tiempo (no de la app).
  workers: 1,
  use: { baseURL: 'http://localhost:3200' },
  webServer: { command: 'npm run dev', url: 'http://localhost:3200/entrar', reuseExistingServer: true, timeout: 120_000 },
  projects: [
    { name: 'sesion', testMatch: /sesion\.setup\.ts/, use: { ...devices['Desktop Chrome'] } },
    {
      name: 'telefono',
      // Sin animaciones: WebKit en Windows las pinta lento y la prueba mide el reloj, no la app.
      use: { ...devices['iPhone 14'], viewport: { width: 390, height: 844 }, storageState: SESION, contextOptions: { reducedMotion: 'reduce' } },
      dependencies: ['sesion'],
    },
    {
      name: 'escritorio',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, storageState: SESION },
      dependencies: ['sesion'],
    },
  ],
})
