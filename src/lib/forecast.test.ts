import { describe, expect, it } from 'vitest'
import { forecast } from './forecast'
import type { DailyUsage } from './types'

function days(count: number, taka: number, kwh = 4, start = '2026-10-01'): DailyUsage[] {
  const [y, m, d] = start.split('-').map(Number)
  return Array.from({ length: count }, (_, i) => ({
    date: new Date(Date.UTC(y!, m! - 1, d! + i)).toISOString().slice(0, 10),
    taka,
    kwh,
  }))
}

describe('forecast', () => {
  it('projects runway, run-out date, month cost and recharge needed', () => {
    const result = forecast({
      balance: 510,
      monthToDateTaka: 73.85,
      readingDate: '2026-11-04',
      daily: days(20, 30),
    })
    expect(result).toEqual({
      status: 'ok',
      basisDays: 14,
      dailyTaka: 30,
      dailyKwh: 4,
      daysLeft: 17,
      runOutDate: '2026-11-21',
      // 27 days remain including the reading day (4–30 Nov).
      projectedMonthTaka: 883.85, // 73.85 + 30 × 27
      // 810 needed to month end, 510 on the meter → 300, already a multiple of 50.
      rechargeToMonthEnd: 300,
    })
  })

  it('averages only the most recent 14 days', () => {
    const daily = [...days(10, 100, 4, '2026-10-01'), ...days(14, 20, 4, '2026-10-11')]
    const result = forecast({ balance: 200, monthToDateTaka: 0, readingDate: '2026-10-25', daily })
    expect(result.status === 'ok' && result.dailyTaka).toBe(20)
  })

  it('rounds the recharge suggestion up to the next ৳50 and never below zero', () => {
    const short = forecast({ balance: 100, monthToDateTaka: 0, readingDate: '2026-11-29', daily: days(5, 61) })
    expect(short.status === 'ok' && short.rechargeToMonthEnd).toBe(50) // 2×61 − 100 = 22 → 50
    const plenty = forecast({ balance: 5000, monthToDateTaka: 0, readingDate: '2026-11-29', daily: days(5, 61) })
    expect(plenty.status === 'ok' && plenty.rechargeToMonthEnd).toBe(0)
  })

  it('reports an open-ended runway when nothing is being spent', () => {
    const result = forecast({ balance: 300, monthToDateTaka: 0, readingDate: '2026-11-04', daily: days(5, 0, 0) })
    expect(result).toMatchObject({ status: 'ok', daysLeft: Infinity, runOutDate: null })
  })

  it('never reports a negative runway for an empty or overdrawn meter', () => {
    const result = forecast({ balance: -40, monthToDateTaka: 0, readingDate: '2026-11-04', daily: days(5, 20) })
    expect(result).toMatchObject({ status: 'ok', daysLeft: 0, runOutDate: '2026-11-04' })
  })

  it('refuses to forecast from fewer than 3 days', () => {
    const result = forecast({ balance: 300, monthToDateTaka: 0, readingDate: '2026-11-04', daily: days(2, 30) })
    expect(result).toEqual({ status: 'insufficient', basisDays: 2 })
  })
})
