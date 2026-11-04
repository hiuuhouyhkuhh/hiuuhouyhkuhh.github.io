import { formatDay, formatTaka } from './format'

export interface AlertSettings {
  /** Warn when the balance falls below this many taka. */
  thresholdTaka: number
  /** Warn when the forecast runway is shorter than this many days. */
  runwayDays: number
  /** Also send a browser notification (at most once a day per meter). */
  notify: boolean
}

export const DEFAULT_ALERTS: AlertSettings = { thresholdTaka: 200, runwayDays: 7, notify: false }

export interface Alert {
  level: 'none' | 'warning' | 'critical'
  title: string
  detail: string
}

interface AlertInput {
  balance: number
  daysLeft: number | null
  runOutDate: string | null
}

const CRITICAL_DAYS = 2

export function evaluateAlert({ balance, daysLeft, runOutDate }: AlertInput, settings: AlertSettings): Alert {
  if (balance <= 0) {
    return { level: 'critical', title: 'Your meter has run out of balance', detail: 'Recharge now to keep the power on.' }
  }

  const days = daysLeft !== null && Number.isFinite(daysLeft) ? Math.floor(daysLeft) : null
  const lowBalance = balance < settings.thresholdTaka
  const shortRunway = days !== null && daysLeft! < settings.runwayDays
  if (!lowBalance && !shortRunway) return { level: 'none', title: '', detail: '' }

  const critical = balance < settings.thresholdTaka / 2 || (days !== null && daysLeft! <= CRITICAL_DAYS)
  const level = critical ? 'critical' : 'warning'

  if (lowBalance) {
    return {
      level,
      title: `Balance is below your ${formatTaka(settings.thresholdTaka, { decimals: 0 })} alert`,
      detail:
        days !== null
          ? `${formatTaka(balance)} left — about ${days} ${days === 1 ? 'day' : 'days'} at your current usage.`
          : `${formatTaka(balance)} left on the meter.`,
    }
  }

  return {
    level,
    title: days === 0 ? 'Less than a day of power left' : `About ${days} ${days === 1 ? 'day' : 'days'} of power left`,
    detail: runOutDate
      ? `At your current usage the balance runs out around ${formatDay(runOutDate)}.`
      : 'Recharge soon to keep the power on.',
  }
}

/** Notification log maps account → the Dhaka date it was last notified. */
export function shouldNotify(log: Record<string, string>, account: string, today: string): boolean {
  return log[account] !== today
}
