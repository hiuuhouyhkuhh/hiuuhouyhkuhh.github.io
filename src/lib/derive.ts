import { daysBetween, monthOf } from './dates'
import type { DailyRecord, DailyUsage, MonthlyRecord, MonthlyUsage } from './types'

export function round(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

/**
 * DESCO's daily feed reports a cumulative kWh register and a month-to-date taka
 * total. Per-day usage is the difference between consecutive days; on the 1st the
 * taka total has just reset, so it already is that day's spend.
 */
export function deriveDailyUsage(records: DailyRecord[]): DailyUsage[] {
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date))
  const usage: DailyUsage[] = []

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]!
    const day = sorted[i]!
    if (daysBetween(prev.date, day.date) !== 1) continue

    const kwh = day.consumedUnit - prev.consumedUnit
    const newMonth = monthOf(day.date) !== monthOf(prev.date)
    const taka = newMonth ? day.consumedTaka : day.consumedTaka - prev.consumedTaka
    if (kwh < 0 || taka < 0) continue

    usage.push({ date: day.date, kwh: round(kwh, 3), taka: round(taka, 2) })
  }

  return usage
}

export function sortMonthlyUsage(records: MonthlyRecord[]): MonthlyUsage[] {
  return [...records]
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((r) => ({
      month: r.month,
      kwh: r.consumedUnit,
      taka: r.consumedTaka,
      maxDemandKw: r.maximumDemand,
    }))
}
