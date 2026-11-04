/*
 * PowerPulse service worker. Its only jobs are showing notifications (Android and
 * installed iPhone apps require a worker for that) and bringing PowerPulse to the
 * front when one is tapped. It deliberately caches nothing, so a deploy is never stale.
 */
self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = new URL(event.notification.data?.url ?? '/', self.location.origin)

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      const open = windows.find((client) => new URL(client.url).origin === target.origin)
      if (open) {
        await open.focus()
        if ('navigate' in open && open.url !== target.href) await open.navigate(target.href)
        return
      }
      await self.clients.openWindow(target.href)
    })(),
  )
})
