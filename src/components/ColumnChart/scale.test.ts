import { describe, expect, it } from 'vitest'
import { columnPath, niceStep, niceTicks } from './scale'

describe('niceTicks', () => {
  it('covers the max with clean steps', () => {
    expect(niceTicks(6.1)).toEqual([0, 2, 4, 6, 8])
    expect(niceTicks(1523)).toEqual([0, 500, 1000, 1500, 2000])
    expect(niceTicks(207)).toEqual([0, 100, 200, 300])
  })

  it('still draws an axis for all-zero data', () => {
    expect(niceTicks(0)).toEqual([0, 1])
  })
})

describe('niceStep', () => {
  it('snaps to 1, 2, 2.5 or 5 times a power of ten', () => {
    expect(niceStep(0.3)).toBe(0.5)
    expect(niceStep(23)).toBe(25)
    expect(niceStep(70)).toBe(100)
  })
})

describe('columnPath', () => {
  it('rounds the top corners only', () => {
    expect(columnPath(10, 20, 20, 100)).toBe('M10 100V24Q10 20 14 20H26Q30 20 30 24V100Z')
  })

  it('draws nothing for a zero-height column', () => {
    expect(columnPath(10, 100, 20, 100)).toBe('')
  })
})
