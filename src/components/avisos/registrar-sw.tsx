'use client'

import { useEffect } from 'react'
import { refrescarSuscripcion } from '@/lib/avisos/cliente'

/** Registra el service worker al abrir la app y re-guarda la suscripción de este dispositivo. */
export function RegistrarSW() {
  useEffect(() => {
    refrescarSuscripcion().catch((e) => console.error('sw', e))
  }, [])
  return null
}
