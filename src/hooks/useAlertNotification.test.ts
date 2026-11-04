import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Alert } from '../lib/alerts'
import { useAlertNotification } from './useAlertNotification'

const alert: Alert = { level: 'warning', title: 'Balance is below your ৳200 alert', detail: '৳150.00 left.' }

function grantNotifications() {
  const ctor = vi.fn()
  vi.stubGlobal('Notification', Object.assign(ctor, { permission: 'granted' }))
  return ctor
}

function stubServiceWorker(registration: unknown) {
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: { getRegistration: vi.fn(() => Promise.resolve(registration)) },
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
  Reflect.deleteProperty(navigator, 'serviceWorker')
})

describe('useAlertNotification', () => {
  it('notifies through the service worker with a link back to the meter', async () => {
    grantNotifications()
    const showNotification = vi.fn(() => Promise.resolve())
    stubServiceWorker({ showNotification })

    renderHook(() => useAlertNotification('00000000', alert, true))

    await waitFor(() => expect(showNotification).toHaveBeenCalledTimes(1))
    expect(showNotification).toHaveBeenCalledWith(alert.title, expect.objectContaining({ data: { url: '/?account=00000000' } }))
    await waitFor(() => expect(JSON.parse(localStorage.getItem('pp:notified')!)).toHaveProperty('00000000'))
  })

  it('falls back to the Notification constructor without a service worker', async () => {
    const ctor = grantNotifications()
    stubServiceWorker(undefined)
    renderHook(() => useAlertNotification('00000000', alert, true))
    await waitFor(() => expect(ctor).toHaveBeenCalledWith(alert.title, expect.objectContaining({ body: '৳150.00 left.' })))
  })

  it('stays silent when disabled, without an alert, or already sent today', async () => {
    const showNotification = vi.fn(() => Promise.resolve())
    grantNotifications()
    stubServiceWorker({ showNotification })

    renderHook(() => useAlertNotification('00000000', alert, false))
    renderHook(() => useAlertNotification('00000000', { level: 'none', title: '', detail: '' }, true))
    localStorage.setItem('pp:notified', JSON.stringify({ '00000000': new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka' }).format(new Date()) }))
    renderHook(() => useAlertNotification('00000000', alert, true))

    await new Promise((r) => setTimeout(r, 20))
    expect(showNotification).not.toHaveBeenCalled()
  })
})
