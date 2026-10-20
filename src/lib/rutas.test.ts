import { describe, expect, it } from 'vitest'
import { destinoSeguro, esRutaPublica } from './rutas'

describe('esRutaPublica', () => {
  it('entrar, callback y sin conexión son públicas', () => {
    expect(esRutaPublica('/entrar')).toBe(true)
    expect(esRutaPublica('/auth/callback')).toBe(true)
    expect(esRutaPublica('/~offline')).toBe(true)
  })
  it('el cron de avisos y el service worker no piden sesión', () => {
    expect(esRutaPublica('/api/avisos/enviar')).toBe(true)
    expect(esRutaPublica('/sw.js')).toBe(true)
    expect(esRutaPublica('/api/avisos/suscribir')).toBe(false)
    expect(esRutaPublica('/api/klo')).toBe(false)
  })
  it('lo demás exige sesión', () => {
    expect(esRutaPublica('/hoy')).toBe(false)
    expect(esRutaPublica('/bienvenida')).toBe(false)
    expect(esRutaPublica('/entrarx')).toBe(false)
  })
})

describe('destinoSeguro', () => {
  it('acepta rutas relativas', () => {
    expect(destinoSeguro('/proyectos')).toBe('/proyectos')
  })
  it('rechaza dominios externos y protocolo relativo', () => {
    expect(destinoSeguro('https://malo.com')).toBe('/hoy')
    expect(destinoSeguro('//malo.com')).toBe('/hoy')
    expect(destinoSeguro('/\\malo.com')).toBe('/hoy')
  })
  it('sin destino va a Hoy', () => {
    expect(destinoSeguro(null)).toBe('/hoy')
  })
})
