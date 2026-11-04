import { describe, expect, it } from 'vitest'
import { addDays, addMonths, daysBetween, daysInMonth, dhakaToday, readingDate } from './dates'

describe('dhakaToday', () => {
  it('uses the Dhaka calendar date, which is ahead of UTC late in the evening', () => {
    // 2026-11-03 20:30 UTC is 2026-11-04 02:30 in Dhaka (UTC+6).
    expect(dhakaToday(new Date('2026-11-03T20:30:00Z'))).toBe('2026-11-04')
  })

  it('matches UTC date in the morning', () => {
    expect(dhakaToday(new Date('2026-11-04T03:00:00Z'))).toBe('2026-11-04')
  })
})

describe('addDays', () => {
  it('crosses month and year boundaries', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })
})

describe('addMonths', () => {
  it('wraps years in both directions', () => {
    expect(addMonths('2026-11', -11)).toBe('2025-12')
    expect(addMonths('2026-12', 1)).toBe('2027-01')
  })
})

describe('daysInMonth', () => {
  it('handles leap years', () => {
    expect(daysInMonth('2028-02')).toBe(29)
    expect(daysInMonth('2026-02')).toBe(28)
    expect(daysInMonth('2026-11')).toBe(30)
  })
})

describe('daysBetween', () => {
  it('counts whole calendar days', () => {
    expect(daysBetween('2026-10-30', '2026-11-02')).toBe(3)
    expect(daysBetween('2026-11-02', '2026-11-02')).toBe(0)
  })
})

describe('readingDate', () => {
  it('takes the date part of a DESCO timestamp', () => {
    expect(readingDate('2026-11-04 00:00:00')).toBe('2026-11-04')
  })
})
