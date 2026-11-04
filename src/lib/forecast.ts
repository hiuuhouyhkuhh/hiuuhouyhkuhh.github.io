import { addDays, daysInMonth, monthOf } from './dates'
import { round } from './derive'
import type { DailyUsage } from './types'

const BASIS_DAYS = 14
const MIN_DAYS = 3
const RECHARGE_STEP = 50

export interface ForecastInput {
  balance: number
  monthToDateTaka: number
  /** Calendar date of the balance reading (`YYYY-MM-DD`). */
  readingDate: string
  daily: DailyUsage[]
}

export type Forecast =
  | {
      status: 'ok'
      basisDays: number
      dailyTaka: number
      dailyKwh: number
      /** Infinity when nothing is being spent. */
      daysLeft: number
      runOutDate: string | null
      projectedMonthTaka: number
      rechargeToMonthEnd: number
    }
  | { status: 'insufficient'; basisDays: number }

const mean = (values: number[]) => values.reduce((sum, v) => sum + v, 0) / values.length

export function forecast({ balance, monthToDateTaka, readingDate, daily }: ForecastInput): Forecast {
  const recent = [...daily].sort((a, b) => a.date.localeCompare(b.date)).slice(-BASIS_DAYS)
  if (recent.length < MIN_DAYS) return { status: 'insufficient', basisDays: recent.length }

  const dailyTaka = round(mean(recent.map((d) => d.taka)), 2)
  const dailyKwh = round(mean(recent.map((d) => d.kwh)), 3)

  const month = monthOf(readingDate)
  // The reading is taken at midnight, so the reading day itself is still to be spent.
  const daysRemaining = daysInMonth(month) - Number(readingDate.slice(8, 10)) + 1
  const neededToMonthEnd = dailyTaka * daysRemaining

  const daysLeft = dailyTaka > 0 ? balance / dailyTaka : Infinity

  return {
    status: 'ok',
    basisDays: recent.length,
    dailyTaka,
    dailyKwh,
    daysLeft,
    runOutDate: Number.isFinite(daysLeft) ? addDays(readingDate, Math.floor(daysLeft)) : null,
    projectedMonthTaka: round(monthToDateTaka + neededToMonthEnd, 2),
    rechargeToMonthEnd:
      Math.ceil(Math.max(0, neededToMonthEnd - balance) / RECHARGE_STEP) * RECHARGE_STEP,
  }
}
