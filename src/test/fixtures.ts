import { vi } from 'vitest'
import type { BalanceRecord, DailyRecord, MonthlyRecord, RechargeRecord } from '../lib/types'

export const BALANCE: BalanceRecord = {
  accountNo: '00000000',
  meterNo: '123456789012',
  balance: 510.65,
  currentMonthConsumption: 73.85,
  readingTime: '2026-11-04 00:00:00',
}

/** Ten consecutive days across a month boundary, shaped like the real feed. */
export const DAILY: DailyRecord[] = [
  ['2026-10-24', 26129.88, 1006.16],
  ['2026-10-25', 26136.02, 1058.35],
  ['2026-10-26', 26141.305, 1103.23],
  ['2026-10-27', 26144.693, 1132.04],
  ['2026-10-28', 26146.378, 1146.32],
  ['2026-10-29', 26148.091, 1160.94],
  ['2026-10-30', 26149.698, 1174.54],
  ['2026-10-31', 26152.465, 1198.09],
  ['2026-11-01', 26156.996, 20.97],
  ['2026-11-02', 26162.48, 46.39],
].map(([date, consumedUnit, consumedTaka]) => ({
  date: date as string,
  consumedUnit: consumedUnit as number,
  consumedTaka: consumedTaka as number,
}))

export const MONTHLY: MonthlyRecord[] = [
  { month: '2026-09', consumedUnit: 207.294, consumedTaka: 1523.34, maximumDemand: 0.97 },
  { month: '2026-10', consumedUnit: 169.537, consumedTaka: 1198.09, maximumDemand: 0.948 },
  { month: '2026-08', consumedUnit: 199.446, consumedTaka: 1452.33, maximumDemand: 0.944 },
]

export const RECHARGES: RechargeRecord[] = [
  {
    orderID: '100000000000001',
    rechargeDate: '2026-10-12 12:23:41',
    totalAmount: 1500,
    energyAmount: 1227.48,
    VAT: 71.43,
    rebate: -6.91,
    chargeItems: [
      { chargeAmount: 168, chargeItemName: 'Demand Charge-All' },
      { chargeAmount: 40, chargeItemName: 'Meter Rent-1P' },
    ],
    orderStatus: 'Successful',
    tokenNo: '12345678901234567890',
    seqNo: 14,
  },
]

const ok = (data: unknown) => ({ code: 200, desc: 'OK', data })

/**
 * Stubs global fetch with a fake DESCO that serves `account` on the tkdes backend.
 * Returns the mock so tests can inspect calls.
 */
export function mockDesco({ account = '00000000', balance = BALANCE } = {}) {
  const fetchMock = vi.fn((input: string | URL | Request) => {
    const url = new URL(String(input))
    const known = url.pathname.includes('/tkdes/') && url.searchParams.get('accountNo') === account
    const endpoint = url.pathname.split('/').pop()
    const body = !known
      ? ok(null)
      : endpoint === 'getBalance'
        ? ok(balance)
        : endpoint === 'getCustomerDailyConsumption'
          ? ok(DAILY)
          : endpoint === 'getCustomerMonthlyConsumption'
            ? ok(MONTHLY)
            : ok(RECHARGES)
    return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }))
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}
