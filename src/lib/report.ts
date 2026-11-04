import type { Alert } from './alerts.ts'
import { daysInMonth, monthOf } from './dates.ts'
import type { Forecast } from './forecast.ts'
import { formatDay, formatTaka } from './format.ts'

export function maskAccount(account: string): string {
  return `••••${account.slice(-4)}`
}

interface ReportInput {
  account: string
  balance: number
  readingDate: string
  outlook: Forecast | null
  alert: Alert
  siteUrl: string
}

/** Plain-text message for the scheduled meter check (Telegram, no markup). */
export function buildReport({ account, balance, readingDate, outlook, alert, siteUrl }: ReportInput): string {
  const ok = outlook?.status === 'ok' ? outlook : null
  const lines = [`⚡ PowerPulse · meter ${maskAccount(account)}`]

  if (alert.level === 'none') {
    lines.push(`All good: ${formatTaka(balance)} on the meter`)
    lines.push(
      ok && ok.runOutDate
        ? `About ${Math.floor(ok.daysLeft)} days left, until around ${formatDay(ok.runOutDate)}.`
        : ok
          ? 'Your balance is not going down right now.'
          : 'No forecast yet.',
    )
  } else {
    lines.push(`${alert.level === 'critical' ? '🔴 ' : ''}${alert.title}`)
    lines.push(alert.detail)
  }

  if (ok && ok.rechargeToMonthEnd > 0) {
    const month = monthOf(readingDate)
    const monthEnd = `${month}-${String(daysInMonth(month)).padStart(2, '0')}`
    lines.push(`Recharge ${formatTaka(ok.rechargeToMonthEnd, { decimals: 0 })} to reach ${formatDay(monthEnd)}.`)
  }

  const url = new URL(siteUrl)
  url.searchParams.set('account', account)
  lines.push(url.toString())
  return lines.join('\n')
}
