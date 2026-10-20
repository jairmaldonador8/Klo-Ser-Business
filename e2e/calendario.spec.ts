import { expect, test } from '@playwright/test'

test('crear en la rejilla, mover a otro día y borrar', async ({ page }, info) => {
  test.skip(info.project.name !== 'escritorio', 'arrastrar con mouse: basta con escritorio')
  test.slow()
  const titulo = `Prueba cal ${Date.now()}`
  await page.goto('/calendario?vista=semana', { waitUntil: 'networkidle' })

  // El primer y segundo día de la semana que se ve; un clic a las 2 pm abre la hoja con esa hora.
  const columnas = page.locator('[data-zona="hora"]')
  const [dia1, dia2] = await Promise.all([columnas.nth(0).getAttribute('data-dia'), columnas.nth(1).getAttribute('data-dia')])
  const enHora = async (dia: string, min: number) => {
    const col = page.locator(`[data-zona="hora"][data-dia="${dia}"]`)
    await col.evaluate((el, m) => el.closest('.cal-scroll')!.scrollTo(0, (m / 1440) * el.scrollHeight - 100), min)
    const r = (await col.boundingBox())!
    return { x: r.x + r.width / 2, y: r.y + (min / 1440) * r.height + 4 }
  }
  const p = await enHora(dia1!, 14 * 60)
  await page.mouse.click(p.x, p.y)
  const hoja = page.getByRole('dialog', { name: 'New task' })
  await expect(hoja.getByLabel('Start time')).toHaveValue('14:00')
  await expect(hoja.getByLabel('End time')).toHaveValue('15:00')
  await hoja.getByLabel('Title').fill(titulo)
  await hoja.getByRole('button', { name: 'Save' }).click()
  await expect(hoja).toBeHidden()

  const evento = page.getByRole('button', { name: new RegExp(titulo) })
  await expect(evento).toBeVisible()
  await expect(page.locator(`[data-dia="${dia1}"]`).getByRole('button', { name: new RegExp(titulo) })).toBeVisible()

  // Arrastrarlo al día siguiente, a la misma hora.
  const r = (await evento.boundingBox())!
  const destino = await enHora(dia2!, 14 * 60)
  await page.mouse.move(r.x + 10, r.y + r.height / 2) // del centro: las orillas de arriba y abajo estiran
  await page.mouse.down()
  await page.mouse.move(destino.x, destino.y + r.height / 2 - 4, { steps: 8 })
  await page.mouse.up()
  await expect(page.locator('.v-toast-zona').getByText('Moved', { exact: true })).toBeVisible()
  await expect(page.locator(`[data-dia="${dia2}"]`).getByRole('button', { name: new RegExp(titulo) })).toBeVisible()

  // Tocarlo abre la hoja; se borra para dejar limpia la cuenta.
  await page.locator(`[data-dia="${dia2}"]`).getByRole('button', { name: new RegExp(titulo) }).click()
  const editar = page.getByRole('dialog', { name: 'Edit task' })
  await editar.getByRole('button', { name: 'Delete' }).click()
  await expect(editar).toBeHidden()
  await expect(page.getByRole('button', { name: new RegExp(titulo) })).toHaveCount(0)
})

test('seleccionar de un día a otro crea un solo evento que cruza la medianoche', async ({ page }, info) => {
  test.skip(info.project.name !== 'escritorio', 'arrastrar con mouse: basta con escritorio')
  test.slow()
  const titulo = `Prueba cruza ${Date.now()}`
  await page.goto('/calendario?vista=semana', { waitUntil: 'networkidle' })
  const columnas = page.locator('[data-zona="hora"]')
  const [d1, d2] = await Promise.all([columnas.nth(1).getAttribute('data-dia'), columnas.nth(2).getAttribute('data-dia')])
  const enHora = async (dia: string, min: number) => {
    const r = (await page.locator(`[data-zona="hora"][data-dia="${dia}"]`).boundingBox())!
    return { x: r.x + r.width / 2, y: r.y + (min / 1440) * r.height + 2 }
  }
  await columnas.first().evaluate((el) => el.closest('.cal-scroll')!.scrollTo(0, ((15 * 60) / 1440) * el.scrollHeight))
  // Lunes 5 pm → martes 4 pm (arrastrando en diagonal hacia la derecha y hacia arriba).
  const a = await enHora(d1!, 17 * 60)
  const z = await enHora(d2!, 16 * 60)
  await page.mouse.move(a.x, a.y)
  await page.mouse.down()
  await page.mouse.move(z.x, z.y, { steps: 14 })
  await expect(page.locator('.cal-ev.previa')).toHaveCount(2) // dos tramos de un mismo evento
  await page.mouse.up()

  const hoja = page.getByRole('dialog', { name: 'New task' })
  await expect(hoja.getByLabel('Start time')).toHaveValue('17:00')
  await expect(hoja.getByLabel('End time')).toHaveValue('16:00')
  await expect(hoja.getByLabel('Ends')).toHaveValue(d2!)
  await hoja.getByLabel('Title').fill(titulo)
  await hoja.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(hoja).toBeHidden()

  // Un solo evento, pintado en sus dos días.
  const tramos = page.getByRole('button', { name: new RegExp(titulo) })
  await expect(tramos).toHaveCount(2)
  await tramos.first().click()
  const editar = page.getByRole('dialog', { name: 'Edit task' })
  await expect(editar.getByLabel('Ends')).toHaveValue(d2!)
  await editar.getByRole('button', { name: 'Delete' }).click()
  await expect(tramos).toHaveCount(0)
})

test('con Shift, arrastrar entre días calendariza una task independiente por día', async ({ page }, info) => {
  test.skip(info.project.name !== 'escritorio', 'arrastrar con mouse y teclado: basta con escritorio')
  await page.goto('/calendario?vista=semana', { waitUntil: 'networkidle' })
  const columnas = page.locator('[data-zona="hora"]')
  const [d1, d3] = await Promise.all([columnas.nth(1).getAttribute('data-dia'), columnas.nth(3).getAttribute('data-dia')])
  const enHora = async (dia: string, min: number) => {
    const r = (await page.locator(`[data-zona="hora"][data-dia="${dia}"]`).boundingBox())!
    return { x: r.x + r.width / 2, y: r.y + (min / 1440) * r.height + 2 }
  }
  await columnas.first().evaluate((el) => el.closest('.cal-scroll')!.scrollTo(0, ((8 * 60) / 1440) * el.scrollHeight))
  const a = await enHora(d1!, 9 * 60)
  const z = await enHora(d3!, 10 * 60)
  await page.keyboard.down('Shift')
  await page.mouse.move(a.x, a.y)
  await page.mouse.down()
  await page.mouse.move(z.x, z.y, { steps: 12 })
  await expect(page.locator('.cal-ev.previa')).toHaveCount(3) // un bloque por día, a la misma hora
  await page.mouse.up()
  await page.keyboard.up('Shift')

  const hoja = page.getByRole('dialog', { name: 'New task' })
  await expect(hoja.getByRole('button', { name: 'Save 3 tasks' })).toBeVisible()
  await expect(hoja.getByLabel('Start time')).toHaveValue('09:00')
  await expect(hoja.getByLabel('End time')).toHaveValue('10:00')
  await hoja.getByRole('button', { name: 'Cancel' }).click()
  await expect(page.locator('.cal-ev.previa')).toHaveCount(0)
})

test('repeat: una task semanal aparece la semana siguiente y se borra con «This and following»', async ({ page }, info) => {
  test.skip(info.project.name !== 'escritorio', 'cambia datos de la cuenta: basta con escritorio')
  test.slow()
  const titulo = `Prueba repite ${Date.now()}`
  await page.goto('/calendario?vista=semana', { waitUntil: 'networkidle' })
  const columnas = page.locator('[data-zona="hora"]')
  const dia = (await columnas.nth(2).getAttribute('data-dia'))!
  const col = page.locator(`[data-zona="hora"][data-dia="${dia}"]`)
  await col.evaluate((el) => el.closest('.cal-scroll')!.scrollTo(0, ((5 * 60) / 1440) * el.scrollHeight))
  const r = (await col.boundingBox())!
  await page.mouse.click(r.x + r.width / 2, r.y + ((6 * 60) / 1440) * r.height + 4)

  const hoja = page.getByRole('dialog', { name: 'New task' })
  await hoja.getByLabel('Title').fill(titulo)
  await hoja.getByRole('button', { name: 'Repeat', exact: true }).click()
  await hoja.getByRole('option', { name: /^Every week on/ }).click()
  await expect(hoja.getByRole('button', { name: 'Repeat', exact: true })).toContainText('Every week on')
  await hoja.getByRole('button', { name: 'Save repeating' }).click()
  await expect(hoja).toBeHidden()

  // Esta semana y la siguiente: una repetición en el mismo día, con su ↻.
  const evento = page.getByRole('button', { name: new RegExp(titulo) })
  await expect(evento).toHaveCount(1)
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await expect(evento).toHaveCount(1)
  await expect(evento.getByRole('img', { name: 'Repeats' })).toBeVisible()
  await page.getByRole('button', { name: 'Previous', exact: true }).click()

  // Borrar desde la primera: «This and following» se lleva toda la serie.
  await evento.click()
  const editar = page.getByRole('dialog', { name: 'Edit task' })
  await expect(editar.getByRole('button', { name: 'Repeat', exact: true })).toContainText('Every week on')
  await editar.getByRole('button', { name: 'Delete' }).click()
  await editar.getByRole('button', { name: 'This and following tasks' }).click()
  await expect(editar).toBeHidden()
  await expect(evento).toHaveCount(0)
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await expect(evento).toHaveCount(0)
})

test('calendarizar con Shift queda como repetición y «Ends» la alarga a otra fecha', async ({ page }, info) => {
  test.skip(info.project.name !== 'escritorio', 'arrastrar con mouse y teclado: basta con escritorio')
  test.slow()
  const titulo = `Prueba calendariza ${Date.now()}`
  await page.goto('/calendario?vista=semana', { waitUntil: 'networkidle' })
  const columnas = page.locator('[data-zona="hora"]')
  const [d1, d3] = await Promise.all([columnas.nth(1).getAttribute('data-dia'), columnas.nth(3).getAttribute('data-dia')])
  const enHora = async (dia: string, min: number) => {
    const r = (await page.locator(`[data-zona="hora"][data-dia="${dia}"]`).boundingBox())!
    return { x: r.x + r.width / 2, y: r.y + (min / 1440) * r.height + 2 }
  }
  await columnas.first().evaluate((el) => el.closest('.cal-scroll')!.scrollTo(0, ((4 * 60) / 1440) * el.scrollHeight))
  const a = await enHora(d1!, 5 * 60)
  const z = await enHora(d3!, 6 * 60)
  await page.keyboard.down('Shift')
  await page.mouse.move(a.x, a.y)
  await page.mouse.down()
  await page.mouse.move(z.x, z.y, { steps: 10 })
  await page.mouse.up()
  await page.keyboard.up('Shift')
  const nueva = page.getByRole('dialog', { name: 'New task' })
  await nueva.getByLabel('Title').fill(titulo)
  await nueva.getByRole('button', { name: 'Save 3 tasks' }).click()
  await expect(nueva).toBeHidden()

  const tareas = page.getByRole('button', { name: new RegExp(titulo) })
  await expect(tareas).toHaveCount(3)
  // Abrir una: dice cómo se repite y hasta cuándo; alargarla al viernes de la semana siguiente.
  await tareas.nth(1).click()
  const hoja = page.getByRole('dialog', { name: 'Edit task' })
  await expect(hoja.getByRole('button', { name: 'Repeat', exact: true })).toContainText('Every day')
  await hoja.getByRole('button', { name: 'On date' }).click()
  const viernesSiguiente = await page.evaluate((d) => {
    const f = new Date(`${d}T12:00:00Z`)
    f.setUTCDate(f.getUTCDate() + 9)
    return f.toISOString().slice(0, 10)
  }, d3!)
  await hoja.getByLabel('Ends on').fill(viernesSiguiente)
  await page.keyboard.press('Escape') // salir guarda
  await expect(hoja).toBeHidden()
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await expect(tareas.first()).toBeVisible()
  await page.getByRole('button', { name: 'Previous', exact: true }).click()

  // Limpieza: borrar todas.
  await tareas.first().click()
  const editar = page.getByRole('dialog', { name: 'Edit task' })
  await editar.getByRole('button', { name: 'Delete' }).click()
  await editar.getByRole('button', { name: 'All tasks' }).click()
  await expect(editar).toBeHidden()
  await expect(tareas).toHaveCount(0)
})
