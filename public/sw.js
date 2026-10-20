// Service worker de Klo-Ser Business: solo avisos push (sin caché offline todavía).
// Regla de iOS: todo push debe terminar en showNotification, o Safari revoca la suscripción.

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

self.addEventListener('push', (e) => {
  let datos = {}
  try {
    datos = e.data ? e.data.json() : {}
  } catch {
    datos = { title: 'Klo', body: e.data ? e.data.text() : '' }
  }
  // Formato declarativo ({ web_push, notification }) o simple ({ title, body, url }).
  const n = datos.notification || datos
  const titulo = n.title || 'Klo'
  e.waitUntil(
    self.registration.showNotification(titulo, {
      body: n.body || '',
      tag: n.tag,
      icon: '/iconos/icon-192.png',
      badge: '/iconos/icon-192.png',
      data: { url: n.navigate || n.url || '/hoy' },
    }),
  )
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const url = new URL((e.notification.data && e.notification.data.url) || '/hoy', self.location.origin).href
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((ventanas) => {
      const abierta = ventanas.find((v) => v.url.startsWith(self.location.origin))
      if (abierta) return abierta.focus().then((v) => v.navigate(url))
      return self.clients.openWindow(url)
    }),
  )
})
