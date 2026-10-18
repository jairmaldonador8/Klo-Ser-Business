import { expect, test } from '@playwright/test'

test('capturar una tarea y palomearla', async ({ page }, info) => {
  test.slow()
  // Único por corrida y por proyecto: telefono y escritorio comparten la cuenta de pruebas.
  const titulo = `Prueba ${info.project.name} ${Date.now()}`
  await page.goto('/hoy', { waitUntil: 'networkidle' })

  await page.getByRole('button', { name: 'Nuevo' }).click()
  const hoja = page.getByRole('dialog', { name: 'Nueva tarea' })
  await hoja.getByLabel('Título').fill(titulo)
  // La fecha por defecto es hoy y sin hora: cae en «De un toque».
  await hoja.getByRole('button', { name: 'Guardar' }).click()
  await expect(hoja).toBeHidden()

  const deUnToque = page.getByRole('region', { name: 'De un toque' })
  const palomita = deUnToque.getByRole('button', { name: `Marcar «${titulo}»` })
  // El mosaico corta a 6 renglones («y N más»); la cuenta de pruebas se deja limpia, así que la nueva debe verse.
  await expect(palomita, 'la tarea nueva no aparece en De un toque (¿tope de 6 renglones?)').toBeVisible()

  await palomita.click()
  const zona = page.locator('.v-toast-zona')
  const toast = zona.getByText('Hecha', { exact: true })
  await expect(toast).toBeVisible()
  // Marcada, deja De un toque (solo lista pendientes).
  await expect(palomita).toHaveCount(0)

  // Deshacer la devuelve; así se puede abrir y borrar.
  await zona.getByRole('button', { name: 'Deshacer' }).click()
  const texto = deUnToque.getByRole('button', { name: titulo, exact: false }).filter({ hasText: titulo })
  await expect(texto).toBeVisible()

  await texto.click()
  const editar = page.getByRole('dialog', { name: 'Editar tarea' })
  await editar.getByRole('button', { name: 'Borrar' }).click()
  await expect(editar).toBeHidden()
  await expect(page.getByText(titulo)).toHaveCount(0)
})
