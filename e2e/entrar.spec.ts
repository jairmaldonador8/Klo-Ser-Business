import { expect, test } from '@playwright/test'

// Estas pruebas son sin sesión.
test.use({ storageState: { cookies: [], origins: [] } })

test('entrar se ve completo y sin scroll horizontal', async ({ page }, info) => {
  await page.goto('/entrar')
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
  await expect(page.getByLabel('Email')).toBeVisible()
  await expect(page.getByLabel('Password')).toBeVisible()
  // body tiene overflow-x:hidden, así que se mide el contenido del body, no el viewport.
  const anchoDocumento = await page.evaluate(() => document.body.scrollWidth)
  expect(anchoDocumento).toBeLessThanOrEqual(page.viewportSize()!.width)
  await page.screenshot({ path: `test-results/capturas/entrar-${info.project.name}.png`, fullPage: true })
})

test('sin sesión, Hoy manda a entrar', async ({ page }) => {
  await page.goto('/hoy')
  await expect(page).toHaveURL(/\/entrar$/)
})

test('contraseña mala da un mensaje que no revela si la cuenta existe', async ({ page }) => {
  await page.goto('/entrar')
  await page.getByLabel('Email').fill('nadie@example.com')
  await page.getByLabel('Password').fill('no-es-esta')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'match' })).toHaveText('Email or password don’t match.')
  await expect(page).toHaveURL(/\/entrar$/)
})
