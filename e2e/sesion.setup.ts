import { expect, test as setup } from '@playwright/test'
import { asegurarCuenta, CONTRASENA, CORREO } from './cuenta'

setup('entrar con la cuenta de pruebas', async ({ page }) => {
  await asegurarCuenta()
  await page.goto('/entrar')
  await page.getByLabel('Email').fill(CORREO)
  await page.getByLabel('Password').fill(CONTRASENA)
  await page.getByRole('button', { name: 'Sign in' }).click()

  // Entrar manda a /hoy y, si la cuenta aún no tiene frentes, el armazón la rebota a /bienvenida:
  // se espera a ver una de las dos pantallas ya pintada, no solo la URL.
  const empezar = page.getByRole('button', { name: 'Get started' })
  const secciones = page.getByRole('navigation', { name: 'Sections' })
  await expect(empezar.or(secciones).first()).toBeVisible()
  if (await empezar.isVisible()) {
    await page.screenshot({ path: 'test-results/capturas/bienvenida.png', fullPage: true })
    await empezar.click()
  }
  await expect(secciones).toBeVisible()
  await expect(page).toHaveURL(/\/hoy$/)
  await page.context().storageState({ path: 'test-results/.sesion.json' })
})
