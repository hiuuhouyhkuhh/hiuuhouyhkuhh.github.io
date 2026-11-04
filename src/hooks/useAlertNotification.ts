import { useEffect } from 'react'
import { shouldNotify, type Alert } from '../lib/alerts'
import { dhakaToday } from '../lib/dates'

const LOG_KEY = 'pp:notified'

/** Sends one browser notification per meter per day while an alert is active. */
export function useAlertNotification(account: string, alert: Alert | null, enabled: boolean) {
  useEffect(() => {
    if (!enabled || !alert || alert.level === 'none') return
    if (!('Notification' in window) || Notification.permission !== 'granted') return

    const today = dhakaToday()
    let log: Record<string, string> = {}
    try {
      log = JSON.parse(localStorage.getItem(LOG_KEY) ?? '{}') as Record<string, string>
    } catch {
      // Corrupt log: start again.
    }
    if (!shouldNotify(log, account, today)) return

    try {
      new Notification(alert.title, { body: alert.detail, icon: '/favicon.svg', tag: `powerpulse-${account}` })
      localStorage.setItem(LOG_KEY, JSON.stringify({ ...log, [account]: today }))
    } catch {
      // Android Chrome only allows notifications from a service worker; the banner still shows.
    }
  }, [account, alert, enabled])
}
