import { expect, test } from '@playwright/test'
import { SECCIONES } from '../src/lib/vista/registro'

// En WebKit (proyecto teléfono) tomar capturas entre clics deja trabados los clics siguientes;
// ahí se recorre con clics y las capturas se toman aparte, cargando cada ruta.
const esTelefono = (nombre: string) => nombre === 'telefono'

test('con sesión, entrar manda a Hoy', async ({ page }) => {
  await page.goto('/entrar')
  await expect(page).toHaveURL(/\/hoy$/)
})

test('se navegan las secciones sin scroll horizontal', async ({ page }, info) => {
  test.slow() // cinco clics y, en el teléfono, cinco cargas más para las capturas
  await page.goto('/hoy')
  const riel = page.getByRole('navigation', { name: 'Secciones' })

  for (const s of SECCIONES) {
    await riel.getByRole('link', { name: s.nombre }).click()
    await expect(page).toHaveURL(new RegExp(`${s.ruta}$`))
    await expect(riel.getByRole('link', { name: s.nombre })).toHaveAttribute('aria-current', 'page')
    const anchoDocumento = await page.evaluate(() => document.body.scrollWidth)
    expect(anchoDocumento, `scroll horizontal en ${s.ruta}`).toBeLessThanOrEqual(page.viewportSize()!.width)
    if (!esTelefono(info.project.name)) await page.screenshot({ path: `test-results/capturas/${s.id}-${info.project.name}.png`, fullPage: true })
  }
  if (esTelefono(info.project.name)) {
    for (const s of SECCIONES) {
      await page.goto(s.ruta, { waitUntil: 'networkidle' })
      await page.screenshot({ path: `test-results/capturas/${s.id}-${info.project.name}.png` })
    }
  }
})

test('un frente se abre con su píldora y sigue abierto al cambiar de sección', async ({ page }, info) => {
  await page.goto('/hoy')
  const frentes = page.getByRole('navigation', { name: 'Frentes' })
  const primero = frentes.getByRole('link').nth(1) // el 0 es «Todos»
  const nombre = (await primero.textContent())!.trim()

  await primero.click()
  await expect(page).toHaveURL(/\/hoy\?frente=/)
  await expect(page.getByRole('heading', { level: 1, name: nombre })).toBeVisible()
  await page.screenshot({ path: `test-results/capturas/frente-${info.project.name}.png`, fullPage: !esTelefono(info.project.name) })

  await page.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: 'Proyectos' }).click()
  await expect(page).toHaveURL(/\/proyectos\?frente=/)
  await expect(frentes.getByRole('link', { name: nombre })).toHaveAttribute('aria-current', 'true')

  await frentes.getByRole('link', { name: 'Todos' }).click()
  await expect(page).toHaveURL(/\/proyectos$/)
})

test('ocultar una sección en Ajustes la quita del riel', async ({ page }, info) => {
  test.skip(info.project.name !== 'escritorio', 'cambia la vista guardada: basta con un proyecto')
  await page.goto('/ajustes')
  const notas = page.getByRole('switch', { name: 'Mostrar Notas' })
  const riel = page.getByRole('navigation', { name: 'Secciones' })

  await notas.click()
  await expect(page.getByRole('status').filter({ hasText: 'Guardado' })).toBeVisible()
  await page.reload()
  await expect(riel.getByRole('link', { name: 'Notas' })).toHaveCount(0)
  await page.screenshot({ path: `test-results/capturas/ajustes-${info.project.name}.png`, fullPage: true })

  await page.getByRole('switch', { name: 'Mostrar Notas' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Guardado' })).toBeVisible()
  await page.reload()
  await expect(riel.getByRole('link', { name: 'Notas' })).toBeVisible()
})

test('Personalizar: arrastrar, ocultar y guardar el acomodo de Hoy', async ({ page }, info) => {
  test.skip(info.project.name !== 'escritorio', 'cambia la vista guardada: basta con un proyecto')
  test.slow()
  await page.goto('/hoy', { waitUntil: 'networkidle' })
  const ids = () => page.locator('.v-bento > :not(svg)').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')))

  await page.getByRole('button', { name: '✎ Personalizar' }).click()
  // Arrastrar Klo encima de «Tu día» lo pone primero.
  const klo = page.getByRole('button', { name: 'Mover Klo' })
  const medidor = page.getByRole('button', { name: 'Mover Tu día' })
  const a = (await klo.boundingBox())!
  const b = (await medidor.boundingBox())!
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2)
  await page.mouse.down()
  await page.mouse.move(a.x + a.width / 2 - 20, a.y + a.height / 2, { steps: 4 })
  await page.mouse.move(b.x + b.width / 4, b.y + b.height / 4, { steps: 12 })
  await page.mouse.up()
  await page.getByRole('button', { name: 'Ocultar En riesgo' }).click()
  await expect(page.getByRole('button', { name: '＋ En riesgo' })).toBeVisible()
  await page.screenshot({ path: `test-results/capturas/personalizar-${info.project.name}.png`, fullPage: true })
  await page.getByRole('button', { name: 'Listo' }).click()
  await expect(page.getByRole('button', { name: '✎ Personalizar' })).toBeVisible()

  await page.reload({ waitUntil: 'networkidle' })
  const orden = await ids()
  expect(orden[0]).toBe('Klo')
  expect(orden).not.toContain('En riesgo')

  // Deja la cuenta como estaba.
  await page.getByRole('button', { name: '✎ Personalizar' }).click()
  await page.getByRole('button', { name: 'Restablecer' }).click()
  await page.getByRole('button', { name: 'Listo' }).click()
  await expect(page.getByRole('button', { name: '✎ Personalizar' })).toBeVisible()
  await page.reload({ waitUntil: 'networkidle' })
  expect((await ids())[0]).toBe('Tu día')
})
