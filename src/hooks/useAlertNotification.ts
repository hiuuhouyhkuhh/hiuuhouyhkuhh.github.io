import { useEffect } from 'react'
import { shouldNotify, type Alert } from '../lib/alerts'
import { dhakaToday } from '../lib/dates'

const LOG_KEY = 'pp:notified'

/**
 * Android and installed iPhone apps only allow notifications from a service worker;
 * desktop browsers also accept the plain constructor, which is the fallback.
 */
async function showNotification(title: string, options: NotificationOptions): Promise<void> {
  const registration =
    'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration().catch(() => undefined) : undefined
  if (registration) return registration.showNotification(title, options)
  new Notification(title, options)
}

function readLog(): Record<string, string> {
  try {
    const log: unknown = JSON.parse(localStorage.getItem(LOG_KEY) ?? '{}')
    return log && typeof log === 'object' ? (log as Record<string, string>) : {}
  } catch {
    return {}
  }
}

/** Sends one browser notification per meter per day while an alert is active. */
export function useAlertNotification(account: string, alert: Alert | null, enabled: boolean) {
  useEffect(() => {
    if (!enabled || !alert || alert.level === 'none') return
    if (!('Notification' in window) || Notification.permission !== 'granted') return

    const today = dhakaToday()
    const log = readLog()
    if (!shouldNotify(log, account, today)) return

    showNotification(alert.title, {
      body: alert.detail,
      icon: '/icons/icon-192.png',
      tag: `powerpulse-${account}`,
      data: { url: `/?account=${account}` },
    })
      .then(() => localStorage.setItem(LOG_KEY, JSON.stringify({ ...log, [account]: today })))
      .catch(() => {
        // Notifications refused at the OS level; the banner still shows.
      })
  }, [account, alert, enabled])
}
