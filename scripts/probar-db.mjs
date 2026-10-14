// Corre las pruebas pgTAP de supabase/tests contra el proyecto enlazado, sin Docker.
// Uso: npm run test:db  (lee .env.local)
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import pg from 'pg'

const ref = readFileSync('supabase/.temp/project-ref', 'utf8').trim()
const conexion = {
  host: process.env.SUPABASE_DB_HOST ?? 'aws-1-us-west-2.pooler.supabase.com',
  port: 5432,
  user: `postgres.${ref}`,
  password: process.env.SUPABASE_DB_PASSWORD,
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
}

let fallo = false
for (const archivo of readdirSync('supabase/tests').filter((a) => a.endsWith('.sql')).sort()) {
  // Una conexión por archivo: pgTAP guarda el plan en la sesión.
  const cliente = new pg.Client(conexion)
  await cliente.connect()
  try {
    const resultados = [await cliente.query(readFileSync(join('supabase/tests', archivo), 'utf8'))].flat()
    const tap = resultados
      .flatMap((r) => r.rows.map((fila) => String(Object.values(fila)[0] ?? '')))
      .filter((l) => /^(not ok|ok|1\.\.|#)/.test(l))
    const mal = tap.some((l) => l.startsWith('not ok') || l.startsWith('# Looks like'))
    const pasaron = tap.filter((l) => l.startsWith('ok')).length
    fallo ||= mal
    console.log(`${archivo} .. ${mal ? 'FALLA' : 'ok'} (${pasaron} pasan)`)
    if (mal) tap.filter((l) => !l.startsWith('ok')).forEach((l) => console.log('  ' + l))
  } catch (error) {
    fallo = true
    console.log(`${archivo} .. FALLA: ${error.message}`)
  } finally {
    await cliente.end()
  }
}
process.exit(fallo ? 1 : 0)
