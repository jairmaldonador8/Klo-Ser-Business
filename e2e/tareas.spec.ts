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

  const deUnToque = page.getByRole('region', { name: 'Tasks' })
  const palomita = deUnToque.getByRole('button', { name: `Check off “${titulo}”` })
  // La cuenta de pruebas se deja limpia, así que la nueva debe verse.
  await expect(palomita, 'la tarea nueva no aparece en Tasks').toBeVisible()

  await palomita.click()
  const zona = page.locator('.v-toast-zona')
  const toast = zona.getByText('Done', { exact: true })
  await expect(toast).toBeVisible()
  // Marcada, se queda en Tasks, tachada, hasta mañana.
  await expect(palomita).toHaveAttribute('aria-pressed', 'true')
  await expect(deUnToque.locator('.v-renglon.hecha').filter({ hasText: titulo })).toBeVisible()

  // Deshacer la devuelve a pendiente; así se puede abrir y borrar.
  await zona.getByRole('button', { name: 'Undo' }).click()
  await expect(palomita).toHaveAttribute('aria-pressed', 'false')
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

test('micro wins: agregar, palomear (se tacha) y quitar', async ({ page }, info) => {
  test.skip(info.project.name !== 'escritorio', 'cambia los micro wins de la cuenta: basta con un proyecto')
  const nombre = `Prueba mw ${Date.now()}`
  await page.goto('/hoy', { waitUntil: 'networkidle' })
  const tareas = page.getByRole('region', { name: 'Tasks' })
  await tareas.getByRole('button', { name: /^(Edit|\+ Add)$/ }).click()
  await tareas.getByLabel('New micro win').fill(nombre)
  await tareas.getByRole('button', { name: 'Add', exact: true }).click()
  await tareas.getByRole('button', { name: 'Done', exact: true }).click()

  const chip = tareas.getByRole('button', { name: nombre })
  await expect(chip).toBeEnabled()
  await chip.click()
  await expect(chip).toHaveAttribute('aria-pressed', 'true')
  // Sigue palomeado al recargar: quedó guardado para hoy.
  await page.reload({ waitUntil: 'networkidle' })
  await expect(tareas.getByRole('button', { name: nombre })).toHaveAttribute('aria-pressed', 'true')

  await tareas.getByRole('button', { name: 'Edit', exact: true }).click()
  await tareas.getByRole('button', { name: `Remove ${nombre}` }).click()
  await expect(tareas.getByText(nombre)).toHaveCount(0)
  // Se quita al instante; tras recargar se confirma que quedó borrado en la base (y la cuenta queda limpia).
  await page.waitForLoadState('networkidle')
  await page.reload({ waitUntil: 'networkidle' })
  await expect(tareas.getByText(nombre)).toHaveCount(0)
})
