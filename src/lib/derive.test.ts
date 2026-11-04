import { describe, expect, it } from 'vitest'
import { deriveDailyUsage, sortMonthlyUsage } from './derive'
import type { DailyRecord, MonthlyRecord } from './types'

const day = (date: string, consumedUnit: number, consumedTaka: number): DailyRecord => ({
  date,
  consumedUnit,
  consumedTaka,
})

describe('deriveDailyUsage', () => {
  it('turns the cumulative register and month-to-date taka into per-day values', () => {
    const usage = deriveDailyUsage([
      day('2026-10-29', 26148.091, 1160.94),
      day('2026-10-30', 26149.698, 1174.54),
      day('2026-10-31', 26152.465, 1198.09),
    ])
    expect(usage).toEqual([
      { date: '2026-10-30', kwh: 1.607, taka: 13.6 },
      { date: '2026-10-31', kwh: 2.767, taka: 23.55 },
    ])
  })

  it('treats month-to-date taka on the 1st as that day’s spend', () => {
    const usage = deriveDailyUsage([
      day('2026-10-31', 26152.465, 1198.09),
      day('2026-11-01', 26156.996, 20.97),
    ])
    expect(usage).toEqual([{ date: '2026-11-01', kwh: 4.531, taka: 20.97 }])
  })

  it('sorts input before differencing', () => {
    const usage = deriveDailyUsage([
      day('2026-10-31', 26152.465, 1198.09),
      day('2026-10-30', 26149.698, 1174.54),
    ])
    expect(usage).toEqual([{ date: '2026-10-31', kwh: 2.767, taka: 23.55 }])
  })

  it('skips deltas that span a gap in the data', () => {
    const usage = deriveDailyUsage([
      day('2026-10-20', 26105.916, 802.41),
      day('2026-10-23', 26123.323, 950.4),
      day('2026-10-24', 26129.88, 1006.16),
    ])
    expect(usage.map((u) => u.date)).toEqual(['2026-10-24'])
  })

  it('never reports negative usage from a register reset', () => {
    const usage = deriveDailyUsage([day('2026-10-20', 500, 10), day('2026-10-21', 2, 12)])
    expect(usage).toEqual([])
  })

  it('returns nothing for fewer than two records', () => {
    expect(deriveDailyUsage([])).toEqual([])
    expect(deriveDailyUsage([day('2026-10-20', 1, 1)])).toEqual([])
  })
})

describe('sortMonthlyUsage', () => {
  it('orders months chronologically and keeps kWh, taka and max demand', () => {
    const records: MonthlyRecord[] = [
      { month: '2026-03', consumedUnit: 122.992, consumedTaka: 740.03, maximumDemand: 0.982 },
      { month: '2025-12', consumedUnit: 99.21, consumedTaka: 568.82, maximumDemand: 0.56 },
      { month: '2026-01', consumedUnit: 98.269, consumedTaka: 562.04, maximumDemand: null },
    ]
    expect(sortMonthlyUsage(records)).toEqual([
      { month: '2025-12', kwh: 99.21, taka: 568.82, maxDemandKw: 0.56 },
      { month: '2026-01', kwh: 98.269, taka: 562.04, maxDemandKw: null },
      { month: '2026-03', kwh: 122.992, taka: 740.03, maxDemandKw: 0.982 },
    ])
  })
})
