'use client'

// Lo del navegador para los avisos: registrar el service worker y suscribir este dispositivo.

export type EstadoPush = 'sin_soporte' | 'instalar' | 'bloqueado' | 'apagado' | 'encendido'

const esIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent)
const instalada = () => window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true

export async function registrarSW(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null
  return navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })
}

export async function estadoPush(): Promise<EstadoPush> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    // En iPhone, Safari sin instalar no trae PushManager: hay que agregarla a inicio.
    return esIos() && !instalada() ? 'instalar' : 'sin_soporte'
  }
  if (Notification.permission === 'denied') return 'bloqueado'
  const reg = await navigator.serviceWorker.getRegistration('/')
  const sub = await reg?.pushManager.getSubscription()
  return sub && Notification.permission === 'granted' ? 'encendido' : 'apagado'
}

function llaveAplicacion(base64: string): Uint8Array<ArrayBuffer> {
  const relleno = '='.repeat((4 - (base64.length % 4)) % 4)
  const crudo = atob((base64 + relleno).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(crudo, (c) => c.charCodeAt(0))
}

async function guardar(sub: PushSubscription) {
  const r = await fetch('/api/avisos/suscribir', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...sub.toJSON(), agente: navigator.userAgent.slice(0, 200) }),
  })
  if (!r.ok) throw new Error('Couldn’t save this device, try again.')
}

/** Debe llamarse dentro de un toque: iOS solo pide permiso así. */
export async function encenderPush(): Promise<EstadoPush> {
  const llave = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!llave) throw new Error('Notifications aren’t set up yet.')
  const permiso = await Notification.requestPermission()
  if (permiso !== 'granted') return permiso === 'denied' ? 'bloqueado' : 'apagado'
  const reg = (await registrarSW()) ?? (await navigator.serviceWorker.ready)
  await navigator.serviceWorker.ready
  const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: llaveAplicacion(llave) }))
  await guardar(sub)
  return 'encendido'
}

export async function apagarPush(): Promise<void> {
  const reg = await navigator.serviceWorker.getRegistration('/')
  const sub = await reg?.pushManager.getSubscription()
  if (!sub) return
  await fetch('/api/avisos/suscribir', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: sub.endpoint }) })
  await sub.unsubscribe()
}

/** Al abrir la app: si ya hay suscripción, se vuelve a guardar (Apple no siempre avisa cuando caduca). */
export async function refrescarSuscripcion(): Promise<void> {
  const reg = await registrarSW()
  if (!reg || !('PushManager' in window) || Notification.permission !== 'granted') return
  const sub = await reg.pushManager.getSubscription()
  if (sub) await guardar(sub).catch(() => {})
}
