'use client'

import { useEffect, useState, useTransition } from 'react'
import { apagarPush, encenderPush, estadoPush, type EstadoPush } from '@/lib/avisos/cliente'
import { enviarPrueba, guardarResumen } from './acciones'

const HORAS = ['06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00']

const TEXTO: Record<EstadoPush, string> = {
  sin_soporte: 'This browser can’t get notifications.',
  instalar: 'On iPhone, add the app to your Home Screen first: Safari → Share → Add to Home Screen. Then open it from there.',
  bloqueado: 'Notifications are blocked. Turn them on in Settings → Notifications → Business.',
  apagado: 'Get a tap before each task, your morning summary and Klo’s reminders.',
  encendido: 'On for this device. Each task alerts 10 min before (change it in the task).',
}

/** Avisos push: encender en este dispositivo, probar, y la hora del resumen. */
export function Notificaciones({ resumenHora }: { resumenHora: string | null }) {
  const [estado, setEstado] = useState<EstadoPush | null>(null)
  const [resumen, setResumen] = useState(resumenHora?.slice(0, 5) ?? '')
  const [aviso, setAviso] = useState('')
  const [ocupado, empezar] = useTransition()

  useEffect(() => {
    estadoPush().then(setEstado, () => setEstado('sin_soporte'))
  }, [])

  function encender() {
    setAviso('')
    // Sin await antes de requestPermission: iOS exige que salga directo del toque.
    encenderPush().then(
      (e) => {
        setEstado(e)
        if (e === 'encendido') setAviso('Done. Try “Send a test”.')
      },
      (e: Error) => setAviso(e.message),
    )
  }

  return (
    <section className="v-t c2" aria-label="Notifications">
      <h3>Notifications</h3>
      <p className="v-sub">{estado ? TEXTO[estado] : 'Checking this device…'}</p>
      <div className="v-fila" style={{ justifyContent: 'flex-start', flexWrap: 'wrap' }}>
        {estado === 'apagado' && (
          <button type="button" className="v-boton" onClick={encender}>
            Turn on notifications
          </button>
        )}
        {estado === 'encendido' && (
          <>
            <button
              type="button"
              className="v-boton chico"
              disabled={ocupado}
              onClick={() =>
                empezar(async () => {
                  const r = await enviarPrueba()
                  setAviso(r.ok ? 'Sent. It should arrive in a few seconds.' : r.mensaje)
                })
              }
            >
              Send a test
            </button>
            <button
              type="button"
              className="v-boton chico"
              onClick={() => apagarPush().then(() => (setEstado('apagado'), setAviso('Off for this device.')))}
            >
              Turn off
            </button>
          </>
        )}
      </div>
      <label className="v-fila" style={{ justifyContent: 'flex-start', gap: 10 }}>
        <span className="v-sub">Morning summary</span>
        <select
          className="v-campo"
          style={{ width: 'auto' }}
          value={resumen}
          onChange={(e) => {
            const valor = e.target.value
            setResumen(valor)
            empezar(async () => {
              const r = await guardarResumen(valor || null)
              setAviso(r.ok ? (valor ? `Summary at ${valor}.` : 'Morning summary off.') : r.mensaje)
            })
          }}
        >
          <option value="">Off</option>
          {HORAS.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
      </label>
      <p className="v-aviso" role="status">
        {aviso}
      </p>
    </section>
  )
}
