import { evaluateAlert, type AlertSettings } from './alerts.ts'
import { addMonths, daysInMonth, monthOf, readingDate } from './dates.ts'
import { deriveDailyUsage } from './derive.ts'
import { forecast } from './forecast.ts'
import { chargeName, formatDay, formatKwh, formatMonth, formatTaka } from './format.ts'
import { maskAccount } from './report.ts'
import type { BalanceRecord, DailyRecord, MonthlyRecord, RechargeRecord } from './types.ts'

export type Command = 'balance' | 'usage' | 'recharges' | 'help'

export const HELP_TEXT = [
  '⚡ PowerPulse',
  '/balance: balance, days left and what to recharge',
  '/usage: this month so far, the projection and the last 7 days',
  '/recharges: your last recharges and tokens',
].join('\n')

/** "/usage@powerpulse_bot extra" → "usage". Anything unknown gets the help text. */
export function parseCommand(text: string): Command {
  const word = text.trim().split(/\s+/)[0]?.toLowerCase().replace(/@.*$/, '') ?? ''
  if (word === '/balance' || word === '/usage' || word === '/recharges') return word.slice(1) as Command
  return 'help'
}

const WEEKDAY = new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'UTC' })
const weekday = (isoDate: string) => WEEKDAY.format(new Date(`${isoDate}T00:00:00Z`))
const monthEndOf = (month: string) => `${month}-${String(daysInMonth(month)).padStart(2, '0')}`

function outlookFor(balance: BalanceRecord, daily: DailyRecord[]) {
  const reading = readingDate(balance.readingTime)
  const usage = deriveDailyUsage(daily)
  const outlook = forecast({
    balance: balance.balance,
    monthToDateTaka: balance.currentMonthConsumption,
    readingDate: reading,
    daily: usage,
  })
  return { reading, usage, outlook }
}

export function balanceReply(
  account: string,
  balance: BalanceRecord,
  daily: DailyRecord[],
  settings: AlertSettings,
): string {
  const { reading, outlook } = outlookFor(balance, daily)
  const ok = outlook.status === 'ok' ? outlook : null
  const alert = evaluateAlert(
    { balance: balance.balance, daysLeft: ok?.daysLeft ?? null, runOutDate: ok?.runOutDate ?? null },
    settings,
  )

  const lines = [`⚡ Meter ${maskAccount(account)}`]
  if (alert.level !== 'none') lines.push(`${alert.level === 'critical' ? '🔴' : '⚠️'} ${alert.title}`)
  lines.push(`Balance: ${formatTaka(balance.balance)} (read ${formatDay(reading)}, ${balance.readingTime.slice(11, 16)})`)

  if (!ok) {
    lines.push('Not enough daily readings for a forecast yet.')
    return lines.join('\n')
  }
  lines.push(
    ok.runOutDate === null
      ? 'Your balance is not going down right now.'
      : ok.daysLeft <= 0
        ? 'The balance is used up. Recharge to keep the power on.'
        : `About ${Math.floor(ok.daysLeft)} days left, until around ${weekday(ok.runOutDate)}, ${formatDay(ok.runOutDate)}`,
  )
  lines.push(`Average day: ${formatTaka(ok.dailyTaka)} · ${formatKwh(ok.dailyKwh)}`)
  const monthEnd = formatDay(monthEndOf(monthOf(reading)))
  lines.push(
    ok.rechargeToMonthEnd > 0
      ? `Recharge ${formatTaka(ok.rechargeToMonthEnd, { decimals: 0 })} to reach ${monthEnd}`
      : `Covered until ${monthEnd}`,
  )
  return lines.join('\n')
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export function usageReply(account: string, balance: BalanceRecord, daily: DailyRecord[], monthly: MonthlyRecord[]): string {
  const { reading, usage, outlook } = outlookFor(balance, daily)
  const month = monthOf(reading)
  const monthName = MONTH_NAMES[Number(month.slice(5)) - 1]
  const spentThrough = Number(reading.slice(8)) - 1
  const lines = [
    `⚡ Meter ${maskAccount(account)} · ${monthName}`,
    `Spent so far: ${formatTaka(balance.currentMonthConsumption)}${spentThrough > 0 ? ` (1–${spentThrough} ${formatMonth(month)})` : ''}`,
  ]

  if (outlook.status === 'ok') {
    const last = monthly.find((m) => m.month === addMonths(month, -1))
    const projected = formatTaka(outlook.projectedMonthTaka, { decimals: 0 })
    if (last && last.consumedTaka > 0) {
      const change = outlook.projectedMonthTaka / last.consumedTaka - 1
      const percent = Math.abs(Math.round(change * 100))
      lines.push(
        `Projected: ${projected}, ${percent}% ${change < 0 ? 'lower' : 'higher'} than ${formatMonth(last.month)} (${formatTaka(last.consumedTaka, { decimals: 0 })})`,
      )
    } else lines.push(`Projected: ${projected}`)
  }

  const week = usage.slice(-7)
  if (week.length > 0) {
    lines.push('', 'Last 7 days')
    for (const day of week) {
      lines.push(`${`${weekday(day.date)} ${formatDay(day.date)}`.padEnd(12)}${formatTaka(day.taka)} · ${formatKwh(day.kwh)}`)
    }
  }
  return lines.join('\n')
}

const groupToken = (token: string) => token.replace(/(\d{4})(?=\d)/g, '$1 ')

export function rechargesReply(account: string, recharges: RechargeRecord[], count = 3): string {
  const lines = [`⚡ Meter ${maskAccount(account)} · last recharges`]
  if (recharges.length === 0) return [...lines, 'No recharges in the last 12 months.'].join('\n')

  for (const r of recharges.slice(0, count)) {
    const fixed = r.chargeItems.map((c) => `${chargeName(c.chargeItemName)} ${formatTaka(c.chargeAmount, { decimals: 0 })}`)
    lines.push('', `${formatDay(r.rechargeDate.slice(0, 10), { year: true })} · ${formatTaka(r.totalAmount, { decimals: r.totalAmount % 1 ? 2 : 0 })}`)
    if (fixed.length > 0) lines.push(`Energy ${formatTaka(r.energyAmount)} · ${fixed.join(' · ')}`)
    if (r.tokenNo) lines.push(`Token ${groupToken(r.tokenNo)}`)
  }
  return lines.join('\n')
}
