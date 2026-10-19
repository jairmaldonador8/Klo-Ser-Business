import { expect, test } from '@playwright/test'

test('capturar una tarea y palomearla', async ({ page }, info) => {
  test.slow()
  // Único por corrida y por proyecto: telefono y escritorio comparten la cuenta de pruebas.
  const titulo = `Prueba ${info.project.name} ${Date.now()}`
  await page.goto('/hoy', { waitUntil: 'networkidle' })

  await page.getByRole('button', { name: 'New' }).click()
  const hoja = page.getByRole('dialog', { name: 'New task' })
  await hoja.getByLabel('Title').fill(titulo)
  // La fecha por defecto es hoy y sin hora: cae en «De un toque».
  await hoja.getByRole('button', { name: 'Save' }).click()
  await expect(hoja).toBeHidden()

  const deUnToque = page.getByRole('region', { name: 'Quick wins' })
  const palomita = deUnToque.getByRole('button', { name: `Check off “${titulo}”` })
  // El mosaico corta a 6 renglones («y N más»); la cuenta de pruebas se deja limpia, así que la nueva debe verse.
  await expect(palomita, 'la tarea nueva no aparece en De un toque (¿tope de 6 renglones?)').toBeVisible()

  await palomita.click()
  const zona = page.locator('.v-toast-zona')
  const toast = zona.getByText('Done', { exact: true })
  await expect(toast).toBeVisible()
  // Marcada, deja De un toque (solo lista pendientes).
  await expect(palomita).toHaveCount(0)

  // Deshacer la devuelve; así se puede abrir y borrar.
  await zona.getByRole('button', { name: 'Undo' }).click()
  const texto = deUnToque.getByRole('button', { name: titulo, exact: false }).filter({ hasText: titulo })
  await expect(texto).toBeVisible()

  await texto.click()
  const editar = page.getByRole('dialog', { name: 'Edit task' })
  await editar.getByRole('button', { name: 'Delete' }).click()
  await expect(editar).toBeHidden()
  await expect(page.getByText(titulo)).toHaveCount(0)
})

test('una tarea para mañana aparece en Semana, en su día', async ({ page }, info) => {
  test.slow()
  const titulo = `Semana ${info.project.name} ${Date.now()}`
  await page.goto('/semana', { waitUntil: 'networkidle' })

  await page.getByRole('button', { name: 'New' }).click()
  const hoja = page.getByRole('dialog', { name: 'New task' })
  await hoja.getByLabel('Title').fill(titulo)
  await expect(hoja).toBeVisible()
  await hoja.getByRole('button', { name: 'Tomorrow', exact: true }).click()
  await hoja.getByRole('button', { name: 'Save' }).click()
  await expect(hoja).toBeHidden()

  // El mosaico de mañana es el segundo día de la agenda; su chip dice «mañana · N».
  const manana = page.locator('.v-agenda > section').filter({ has: page.locator('.v-chip', { hasText: 'tomorrow' }) })
  const texto = manana.getByRole('button', { name: titulo, exact: false }).filter({ hasText: titulo })
  await expect(texto).toBeVisible()

  await texto.click()
  const editar = page.getByRole('dialog', { name: 'Edit task' })
  await editar.getByRole('button', { name: 'Delete' }).click()
  await expect(editar).toBeHidden()
  await expect(page.getByText(titulo)).toHaveCount(0)
})
