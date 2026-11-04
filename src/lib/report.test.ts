import { describe, expect, it } from 'vitest'
import { buildReport, maskAccount } from './report'
import type { Forecast } from './forecast'

const outlook: Forecast = {
  status: 'ok',
  basisDays: 14,
  dailyTaka: 33.54,
  dailyKwh: 4.5,
  daysLeft: 4.47,
  runOutDate: '2026-11-08',
  projectedMonthTaka: 979,
  rechargeToMonthEnd: 750,
}

const base = {
  account: '12345678',
  balance: 150,
  readingDate: '2026-11-04',
  outlook,
  siteUrl: 'https://powerpulsebd.github.io/',
}

describe('maskAccount', () => {
  it('keeps only the last four digits', () => {
    expect(maskAccount('12345678')).toBe('••••5678')
  })
})

describe('buildReport', () => {
  it('writes an alert message with the recharge suggestion and a link', () => {
    const report = buildReport({ ...base, alert: { level: 'warning', title: 'Balance is below your ৳200 alert', detail: '৳150.00 left — about 4 days at your current usage.' } })
    expect(report).toBe(
      [
        '⚡ PowerPulse · meter ••••5678',
        'Balance is below your ৳200 alert',
        '৳150.00 left — about 4 days at your current usage.',
        'Recharge ৳750 to reach 30 Nov.',
        'https://powerpulsebd.github.io/?account=12345678',
      ].join('\n'),
    )
  })

  it('marks critical alerts', () => {
    const report = buildReport({ ...base, alert: { level: 'critical', title: 'Your meter has run out of balance', detail: 'Recharge now to keep the power on.' } })
    expect(report.split('\n')[1]).toBe('🔴 Your meter has run out of balance')
  })

  it('summarises a healthy meter when asked for a summary', () => {
    const report = buildReport({
      ...base,
      balance: 510.65,
      outlook: { ...outlook, daysLeft: 15.2, runOutDate: '2026-11-19', rechargeToMonthEnd: 0 },
      alert: { level: 'none', title: '', detail: '' },
    })
    expect(report.split('\n').slice(1, 3)).toEqual(['All good: ৳510.65 on the meter', 'About 15 days left, until around 19 Nov.'])
  })

  it('copes without a forecast', () => {
    const report = buildReport({ ...base, outlook: null, alert: { level: 'none', title: '', detail: '' } })
    expect(report.split('\n').slice(1, 3)).toEqual(['All good: ৳150.00 on the meter', 'No forecast yet.'])
  })
})
