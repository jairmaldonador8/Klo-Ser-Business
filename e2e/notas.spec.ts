import { expect, test } from '@playwright/test'

// El + captura notas; Notes las muestra por día y «Maybe task» las marca para volverlas task después.

test('capturar una nota desde el +, marcarla como posible task y verla en su día', async ({ page }, info) => {
  test.slow()
  const texto = `Idea ${info.project.name} ${Date.now()}: podcast con clientes`
  await page.goto('/hoy', { waitUntil: 'networkidle' })

  await page.getByRole('button', { name: 'New' }).click()
  await page.getByRole('tab', { name: 'Note' }).click()
  const hoja = page.getByRole('dialog', { name: 'New note' })
  await hoja.getByLabel('Note').fill(texto)
  await hoja.getByRole('button', { name: 'Flag it' }).click()
  await page.screenshot({ path: `test-results/capturas/nota-nueva-${info.project.name}.png` })
  await hoja.getByRole('button', { name: 'Save note' }).click()
  await expect(hoja).toBeHidden()

  await page.goto('/notas', { waitUntil: 'networkidle' })
  const hoy = page.getByRole('region', { name: 'Today' })
  const nota = hoy.locator('.nota').filter({ hasText: texto })
  await expect(nota).toBeVisible()
  await expect(nota.getByText('Maybe task')).toBeVisible()

  // El filtro deja solo las marcadas; quitar la bandera la saca.
  await page.getByRole('button', { name: /Maybe tasks/ }).click()
  await expect(nota).toBeVisible()
  await page.waitForTimeout(500)
  await page.screenshot({ path: `test-results/capturas/notas-${info.project.name}.png` })
  await nota.getByRole('button', { name: 'Unflag maybe task' }).click()
  await expect(nota).toBeHidden()

  // Limpieza: vuelve a «All» y la borra.
  await page.getByRole('button', { name: /^All/ }).click()
  await nota.getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByText(texto)).toHaveCount(0)

  // El + recuerda la última pestaña: se deja en Task para las demás pruebas.
  await page.getByRole('button', { name: 'New' }).click()
  await page.getByRole('tab', { name: 'Task' }).click()
  await page.keyboard.press('Escape')
})

test('el + en modo rápido: More options despliega lo demás', async ({ page }) => {
  await page.goto('/hoy', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'New' }).click()
  const hoja = page.getByRole('dialog', { name: 'New task' })
  await expect(hoja.getByLabel('Title')).toBeVisible()
  await expect(hoja.getByRole('button', { name: 'Meeting' })).toHaveCount(0)
  await hoja.getByRole('button', { name: /More options/ }).click()
  await expect(hoja.getByRole('button', { name: 'Meeting' })).toBeVisible()
  await hoja.getByRole('button', { name: 'Cancel' }).click()
})
