import { createClient } from '@supabase/supabase-js'
import { expect, test } from '@playwright/test'
import { CONTRASENA, CORREO } from './cuenta'

// Una task con hora sale en «Today’s agenda» y en «Tasks»: marcarla en una debe verse en la otra al momento.

async function clienteDePrueba() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, { auth: { persistSession: false } })
  const { data, error } = await sb.auth.signInWithPassword({ email: CORREO, password: CONTRASENA })
  if (error) throw error
  return { sb, userId: data.user.id }
}

test('marcar en la agenda también la marca en Tasks (y al revés)', async ({ page }, info) => {
  test.slow()
  const { sb, userId } = await clienteDePrueba()
  const { data: perfil } = await sb.from('perfiles').select('zona_horaria, espacio_predeterminado_id').eq('user_id', userId).single()
  const { data: espacios } = await sb.from('espacios').select('id').order('orden').limit(1)
  const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: perfil?.zona_horaria ?? 'America/Monterrey' }).format(new Date())
  const titulo = `Sincronía ${info.project.name} ${Date.now()}`
  const { data: tarea, error } = await sb
    .from('tareas')
    .insert({ espacio_id: perfil?.espacio_predeterminado_id ?? espacios![0].id, titulo, fecha: hoy, hora: '23:30' })
    .select('id')
    .single()
  if (error) throw error

  try {
    await page.goto('/hoy', { waitUntil: 'networkidle' })
    const agenda = page.getByRole('region', { name: 'Today’s agenda' })
    const tasks = page.getByRole('region', { name: 'Tasks' })
    const enAgenda = agenda.getByRole('button', { name: `Check off “${titulo}”` })
    const enTasks = tasks.getByRole('button', { name: `Check off “${titulo}”` })
    await expect(enAgenda).toBeVisible()
    await expect(enTasks).toBeVisible()

    // Al momento (sin esperar al servidor): la otra sección y el contador.
    const conteo = tasks.locator('.v-chip').filter({ hasText: 'done' })
    const antes = Number((await conteo.textContent())?.match(/\d+/)?.[0])
    await enAgenda.click()
    await expect(enAgenda).toHaveAttribute('aria-pressed', 'true')
    await expect(conteo, 'el contador de Tasks no se movió').toContainText(`${antes + 1} of`, { timeout: 1500 })
    await expect(enTasks, 'Tasks no se enteró de lo que marcaste en la agenda').toHaveAttribute('aria-pressed', 'true', { timeout: 1500 })

    await enTasks.click()
    await expect(enTasks).toHaveAttribute('aria-pressed', 'false')
    await expect(enAgenda, 'la agenda no se enteró de lo que desmarcaste en Tasks').toHaveAttribute('aria-pressed', 'false', { timeout: 1500 })
  } finally {
    await sb.from('tareas').update({ borrado_en: new Date().toISOString() }).eq('id', tarea.id)
  }
})
