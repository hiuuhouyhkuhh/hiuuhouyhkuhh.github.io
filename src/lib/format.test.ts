import { describe, expect, it } from 'vitest'
import { formatCompact, formatDay, formatKwh, formatMonth, formatTaka } from './format'

describe('formatTaka', () => {
  it('formats with the taka sign and two decimals', () => {
    expect(formatTaka(510.65)).toBe('৳510.65')
    expect(formatTaka(1500)).toBe('৳1,500.00')
  })

  it('can drop decimals', () => {
    expect(formatTaka(1499.6, { decimals: 0 })).toBe('৳1,500')
  })

  it('uses South Asian digit grouping for large values', () => {
    expect(formatTaka(125000, { decimals: 0 })).toBe('৳1,25,000')
  })
})

describe('formatKwh', () => {
  it('shows up to one decimal and the unit', () => {
    expect(formatKwh(6.118)).toBe('6.1 kWh')
    expect(formatKwh(207.294)).toBe('207.3 kWh')
  })
})

describe('formatCompact', () => {
  it('compacts from 1,000 up', () => {
    expect(formatCompact(0)).toBe('0')
    expect(formatCompact(950)).toBe('950')
    expect(formatCompact(1500)).toBe('1.5K')
  })
})

describe('formatDay / formatMonth', () => {
  it('renders short human dates', () => {
    expect(formatDay('2026-11-04')).toBe('4 Nov')
    expect(formatDay('2026-11-04', { year: true })).toBe('4 Nov 2026')
    expect(formatMonth('2026-10')).toBe('Oct')
    expect(formatMonth('2026-10', { year: true })).toBe('Oct 2026')
  })
})
