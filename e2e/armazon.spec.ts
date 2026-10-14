import { expect, test } from '@playwright/test'
import { SECCIONES, SECCIONES_TELEFONO } from '../src/lib/navegacion'

test('con sesión, entrar manda a Hoy', async ({ page }) => {
  await page.goto('/entrar')
  await expect(page).toHaveURL(/\/hoy$/)
})

test('se navegan las secciones sin scroll horizontal', async ({ page }, info) => {
  const secciones = info.project.name === 'telefono' ? SECCIONES_TELEFONO : SECCIONES
  await page.goto('/hoy')
  const nav = page.getByRole('navigation', { name: 'Secciones' })

  for (const s of secciones) {
    await nav.getByRole('link', { name: s.nombre }).click()
    await expect(page).toHaveURL(new RegExp(`${s.ruta}$`))
    await expect(nav.getByRole('link', { name: s.nombre })).toHaveAttribute('aria-current', 'page')
    const anchoDocumento = await page.evaluate(() => document.body.scrollWidth)
    expect(anchoDocumento, `scroll horizontal en ${s.ruta}`).toBeLessThanOrEqual(page.viewportSize()!.width)
    await page.screenshot({ path: `test-results/capturas/${s.ruta.slice(1)}-${info.project.name}.png`, fullPage: true })
  }
})
