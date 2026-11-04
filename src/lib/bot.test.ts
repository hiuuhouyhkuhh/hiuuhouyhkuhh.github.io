import { describe, expect, it } from 'vitest'
import { DEFAULT_ALERTS } from './alerts'
import { balanceReply, HELP_TEXT, parseCommand, rechargesReply, usageReply } from './bot'
import type { BalanceRecord, DailyRecord, MonthlyRecord, RechargeRecord } from './types'

const balance: BalanceRecord = {
  accountNo: '12345678',
  meterNo: '123456789012',
  balance: 510.65,
  currentMonthConsumption: 73.85,
  readingTime: '2026-11-04 00:00:00',
}

// 15 days at ৳30/day and 4 kWh/day, ending 3 Nov.
const daily: DailyRecord[] = Array.from({ length: 16 }, (_, i) => {
  const date = new Date(Date.UTC(2026, 9, 19 + i)).toISOString().slice(0, 10)
  const dayOfMonth = Number(date.slice(8))
  const octDays = date.startsWith('2026-10') ? dayOfMonth : 0
  return {
    date,
    consumedUnit: 26000 + i * 4,
    consumedTaka: date.startsWith('2026-10') ? octDays * 30 : dayOfMonth * 30,
  }
})

const monthly: MonthlyRecord[] = [{ month: '2026-10', consumedUnit: 169.5, consumedTaka: 1198.09, maximumDemand: 0.9 }]

const recharges: RechargeRecord[] = [
  {
    orderID: '1',
    rechargeDate: '2026-10-12 12:23:41',
    totalAmount: 1500,
    energyAmount: 1227.48,
    VAT: 71.43,
    rebate: -6.91,
    chargeItems: [],
    orderStatus: 'Successful',
    tokenNo: '12345678901234567890',
    seqNo: 14,
  },
]

describe('parseCommand', () => {
  it('reads commands with or without the bot name and arguments', () => {
    expect(parseCommand('/balance')).toBe('balance')
    expect(parseCommand('/usage@powerpulse_bot')).toBe('usage')
    expect(parseCommand('  /RECHARGES now')).toBe('recharges')
    expect(parseCommand('/start')).toBe('help')
    expect(parseCommand('hello')).toBe('help')
  })
})

describe('balanceReply', () => {
  it('gives balance, runway, daily average and the recharge to reach month end', () => {
    expect(balanceReply('12345678', balance, daily, DEFAULT_ALERTS)).toBe(
      [
        '⚡ Meter ••••5678',
        'Balance: ৳510.65 (read 4 Nov, 00:00)',
        'About 17 days left, until around Sat, 21 Nov',
        'Average day: ৳30.00 · 4.0 kWh',
        'Recharge ৳300 to reach 30 Nov',
      ].join('\n'),
    )
  })

  it('leads with the alert when one is active', () => {
    const reply = balanceReply('12345678', { ...balance, balance: 150 }, daily, DEFAULT_ALERTS)
    expect(reply.split('\n')[1]).toBe('⚠️ Balance is below your ৳200 alert')
  })

  it('works before there is enough history to forecast', () => {
    const reply = balanceReply('12345678', balance, daily.slice(0, 2), DEFAULT_ALERTS)
    expect(reply).toContain('Not enough daily readings for a forecast yet.')
  })
})

describe('usageReply', () => {
  it('compares the projected month with last month and lists the last 7 days', () => {
    const lines = usageReply('12345678', balance, daily, monthly).split('\n')
    expect(lines.slice(0, 3)).toEqual([
      '⚡ Meter ••••5678 · November',
      'Spent so far: ৳73.85 (1–3 Nov)',
      'Projected: ৳884, 26% lower than Oct (৳1,198)',
    ])
    expect(lines[4]).toBe('Last 7 days')
    expect(lines.slice(5)).toHaveLength(7)
    expect(lines.at(-1)).toBe('Tue 3 Nov   ৳30.00 · 4.0 kWh')
  })
})

describe('rechargesReply', () => {
  it('lists recent recharges with grouped tokens', () => {
    expect(rechargesReply('12345678', recharges)).toBe(
      ['⚡ Meter ••••5678 · last recharges', '', '12 Oct 2026 · ৳1,500', 'Token 1234 5678 9012 3456 7890'].join('\n'),
    )
  })

  it('says when there are none', () => {
    expect(rechargesReply('12345678', [])).toContain('No recharges in the last 12 months.')
  })
})

describe('HELP_TEXT', () => {
  it('lists every command', () => {
    for (const command of ['/balance', '/usage', '/recharges']) expect(HELP_TEXT).toContain(command)
  })
})
