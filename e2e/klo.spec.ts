import { expect, test } from '@playwright/test'

// Klo con Claude simulado: el panel abre, manda, muestra lo que hizo con Undo y lo que espera tu OK.
// Sin service worker: con él registrado, page.route no ve las peticiones en WebKit.
test.use({ serviceWorkers: 'block' })

test('Klo responde, muestra lo que hizo y deja deshacer', async ({ page }, info) => {
  let deshecho = false
  await page.route('**/api/klo', (r) =>
    r.fulfill({
      json: {
        id: '11111111-1111-4111-8111-111111111111',
        respuesta: 'Moved it to Thursday at 4. One delete is waiting for your OK.',
        acciones: ['Moved · Ana call → Thu, Oct 22, 4:00 PM'],
        pendientes: ['Delete · Old draft'],
      },
    }),
  )
  await page.route('**/api/klo/deshacer', (r) => ((deshecho = true), r.fulfill({ json: { ok: true } })))
  await page.route('**/api/klo/confirmar', (r) => r.fulfill({ json: { acciones: ['Deleted · Old draft'] } }))

  await page.goto('/hoy')
  await page.getByRole('button', { name: 'Tell Klo' }).click()
  const panel = page.getByRole('dialog', { name: 'Klo' })
  await expect(panel).toBeVisible()

  await panel.getByRole('textbox', { name: 'Message for Klo' }).fill('move the Ana call to thursday at 4 and delete the old draft')
  await panel.getByRole('textbox', { name: 'Message for Klo' }).press('Enter')

  await expect(panel.getByText('Moved it to Thursday at 4.', { exact: false })).toBeVisible()
  await expect(panel.getByText('Moved · Ana call')).toBeVisible()
  await expect(panel.getByText('Needs your OK')).toBeVisible()
  await page.screenshot({ path: `test-results/capturas/klo-${info.project.name}.png` })

  await panel.getByRole('button', { name: 'Confirm' }).click()
  await expect(panel.getByText('Deleted · Old draft')).toBeVisible()

  await panel.getByRole('button', { name: 'Undo' }).click()
  await expect(panel.getByRole('button', { name: 'Undone' })).toBeDisabled()
  expect(deshecho).toBe(true)

  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
})
