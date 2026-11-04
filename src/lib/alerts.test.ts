import { describe, expect, it } from 'vitest'
import { DEFAULT_ALERTS, evaluateAlert, parseAlertSettings, shouldNotify } from './alerts'

const settings = DEFAULT_ALERTS // ৳200 threshold, 7 days

describe('evaluateAlert', () => {
  it('stays quiet when balance and runway are comfortable', () => {
    expect(evaluateAlert({ balance: 900, daysLeft: 25, runOutDate: '2026-11-29' }, settings).level).toBe('none')
  })

  it('warns when the runway is shorter than the chosen number of days', () => {
    const alert = evaluateAlert({ balance: 210, daysLeft: 6.2, runOutDate: '2026-11-10' }, settings)
    expect(alert).toEqual({
      level: 'warning',
      title: 'About 6 days of power left',
      detail: 'At your current usage the balance runs out around 10 Nov.',
    })
  })

  it('warns when the balance drops below the threshold', () => {
    const alert = evaluateAlert({ balance: 150, daysLeft: 9, runOutDate: '2026-11-13' }, settings)
    expect(alert).toEqual({
      level: 'warning',
      title: 'Balance is below your ৳200 alert',
      detail: '৳150.00 left — about 9 days at your current usage.',
    })
  })

  it('escalates to critical under half the threshold or two days left', () => {
    expect(evaluateAlert({ balance: 90, daysLeft: 8, runOutDate: null }, settings).level).toBe('critical')
    expect(evaluateAlert({ balance: 300, daysLeft: 1.5, runOutDate: '2026-11-05' }, settings).level).toBe('critical')
  })

  it('says the meter is empty when the balance is used up', () => {
    expect(evaluateAlert({ balance: 0, daysLeft: 0, runOutDate: '2026-11-04' }, settings)).toEqual({
      level: 'critical',
      title: 'Your meter has run out of balance',
      detail: 'Recharge now to keep the power on.',
    })
  })

  it('works without a forecast', () => {
    const alert = evaluateAlert({ balance: 150, daysLeft: null, runOutDate: null }, settings)
    expect(alert.detail).toBe('৳150.00 left on the meter.')
  })
})

describe('parseAlertSettings', () => {
  it('fills in missing or invalid fields from the defaults', () => {
    expect(parseAlertSettings({ thresholdTaka: 350 })).toEqual({ ...DEFAULT_ALERTS, thresholdTaka: 350 })
    expect(parseAlertSettings({ runwayDays: 'x', notify: 'yes' })).toEqual(DEFAULT_ALERTS)
    expect(parseAlertSettings(null)).toEqual(DEFAULT_ALERTS)
  })
})

describe('shouldNotify', () => {
  it('notifies at most once per account per day', () => {
    expect(shouldNotify({}, '00000000', '2026-11-04')).toBe(true)
    expect(shouldNotify({ '00000000': '2026-11-04' }, '00000000', '2026-11-04')).toBe(false)
    expect(shouldNotify({ '00000000': '2026-11-03' }, '00000000', '2026-11-04')).toBe(true)
  })
})
