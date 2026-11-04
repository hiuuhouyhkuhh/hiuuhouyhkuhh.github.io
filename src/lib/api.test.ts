import { describe, expect, it, vi } from 'vitest'
import {
  fetchBalance,
  fetchDaily,
  fetchMonthly,
  fetchRecharges,
  MeterApiError,
  normalizeAccount,
} from './api'

const BALANCE = {
  accountNo: '00000000',
  meterNo: '123456789012',
  balance: 510.65,
  currentMonthConsumption: 73.85,
  readingTime: '2026-11-04 00:00:00',
}

function json(body: unknown) {
  return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }))
}

/** Routes requests by backend so each test describes which backend knows the account. */
function fakeFetch(routes: Partial<Record<'unified' | 'tkdes', unknown>>) {
  return vi.fn((url: string | URL | Request) => {
    const backend = String(url).includes('/tkdes/') ? 'tkdes' : 'unified'
    const body = routes[backend] ?? { code: 200, desc: 'OK', data: null }
    return json(body)
  })
}

describe('normalizeAccount', () => {
  it('accepts plain digits and strips spaces, dashes and a DESCO- prefix', () => {
    expect(normalizeAccount('00000000')).toBe('00000000')
    expect(normalizeAccount(' 0000 0000 ')).toBe('00000000')
    expect(normalizeAccount('DESCO-00000000')).toBe('00000000')
    expect(normalizeAccount('desco 00000000')).toBe('00000000')
  })

  it('rejects anything that is not a 6–12 digit number', () => {
    expect(normalizeAccount('')).toBeNull()
    expect(normalizeAccount('12345')).toBeNull()
    expect(normalizeAccount('00000000a')).toBeNull()
    expect(normalizeAccount('1234567890123')).toBeNull()
  })
})

describe('fetchBalance', () => {
  it('falls back to tkdes when unified has no data, and reports the backend used', async () => {
    const fetchImpl = fakeFetch({ tkdes: { code: 200, desc: 'OK', data: BALANCE } })
    const result = await fetchBalance('00000000', { fetchImpl })
    expect(result).toEqual({ backend: 'tkdes', balance: BALANCE })
    expect(fetchImpl).toHaveBeenCalledTimes(2)
    expect(String(fetchImpl.mock.calls[0]![0])).toBe(
      'https://prepaid.desco.org.bd/api/unified/customer/getBalance?accountNo=00000000',
    )
  })

  it('tries the preferred backend first and stops when it answers', async () => {
    const fetchImpl = fakeFetch({ tkdes: { code: 200, desc: 'OK', data: BALANCE } })
    const result = await fetchBalance('00000000', { fetchImpl, preferred: 'tkdes' })
    expect(result.backend).toBe('tkdes')
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it('throws not-found when neither backend knows the account', async () => {
    const fetchImpl = fakeFetch({ tkdes: { code: 16001, desc: 'The Account No. does not exist', data: null } })
    await expect(fetchBalance('00000000', { fetchImpl })).rejects.toMatchObject({ kind: 'not-found' })
  })

  it('ignores a corrupt cached backend and still finds the account', async () => {
    const fetchImpl = fakeFetch({ tkdes: { code: 200, desc: 'OK', data: BALANCE } })
    const result = await fetchBalance('00000000', { fetchImpl, preferred: 'foo' as never })
    expect(result.backend).toBe('tkdes')
    expect(fetchImpl.mock.calls.every(([url]) => !String(url).includes('/foo/'))).toBe(true)
  })

  it('falls back to the other backend when the first one fails', async () => {
    const fetchImpl = vi.fn((url: string | URL | Request) =>
      String(url).includes('/unified/')
        ? Promise.resolve(new Response('down', { status: 503 }))
        : json({ code: 200, desc: 'OK', data: BALANCE }),
    )
    expect((await fetchBalance('00000000', { fetchImpl })).backend).toBe('tkdes')
  })

  it('reports the failure, not "not found", when a backend could not be checked', async () => {
    const fetchImpl = vi.fn((url: string | URL | Request) =>
      String(url).includes('/unified/')
        ? Promise.reject(new TypeError('Failed to fetch'))
        : json({ code: 16001, desc: 'The Account No. does not exist', data: null }),
    )
    await expect(fetchBalance('00000000', { fetchImpl })).rejects.toMatchObject({ kind: 'network' })
  })

  it('works where AbortSignal.any is missing', async () => {
    const original = AbortSignal.any
    // @ts-expect-error simulate Safari < 17.4
    AbortSignal.any = undefined
    try {
      const fetchImpl = fakeFetch({ tkdes: { code: 200, desc: 'OK', data: BALANCE } })
      const result = await fetchBalance('00000000', { fetchImpl, signal: new AbortController().signal })
      expect(result.backend).toBe('tkdes')
    } finally {
      AbortSignal.any = original
    }
  })

  it('throws a retryable network error when the request fails', async () => {
    const fetchImpl = vi.fn(() => Promise.reject(new TypeError('Failed to fetch')))
    const error = await fetchBalance('00000000', { fetchImpl }).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(MeterApiError)
    expect(error).toMatchObject({ kind: 'network' })
  })

  it('throws a server error on a non-200 HTTP status', async () => {
    const fetchImpl = vi.fn(() => Promise.resolve(new Response('oops', { status: 502 })))
    await expect(fetchBalance('00000000', { fetchImpl })).rejects.toMatchObject({ kind: 'server' })
  })
})

describe('history endpoints', () => {
  const tkdesList = (data: unknown[]) => fakeFetch({ tkdes: { code: 200, desc: 'OK', data } })

  it('asks for the last 35 days of daily readings', async () => {
    const fetchImpl = tkdesList([{ date: '2026-11-02', consumedUnit: 1, consumedTaka: 2 }])
    const rows = await fetchDaily('00000000', 'tkdes', '2026-11-04', { fetchImpl })
    expect(rows).toHaveLength(1)
    expect(String(fetchImpl.mock.calls[0]![0])).toContain('dateFrom=2026-09-30&dateTo=2026-11-04')
  })

  it('asks for exactly 12 months of monthly usage (the API maximum)', async () => {
    const fetchImpl = tkdesList([])
    await fetchMonthly('00000000', 'tkdes', '2026-11-04', { fetchImpl })
    expect(String(fetchImpl.mock.calls[0]![0])).toContain('monthFrom=2025-12&monthTo=2026-11')
  })

  it('asks for one year of recharges and returns them newest first', async () => {
    const fetchImpl = tkdesList([
      { orderID: 'a', rechargeDate: '2026-09-16 12:46:39' },
      { orderID: 'b', rechargeDate: '2026-10-12 12:23:41' },
    ])
    const rows = await fetchRecharges('00000000', 'tkdes', '2026-11-04', { fetchImpl })
    expect(String(fetchImpl.mock.calls[0]![0])).toContain('dateFrom=2025-11-05&dateTo=2026-11-04')
    expect(rows.map((r) => r.orderID)).toEqual(['b', 'a'])
  })

  it('treats a null list as empty', async () => {
    const fetchImpl = fakeFetch({ tkdes: { code: 200, desc: 'OK', data: null } })
    expect(await fetchDaily('00000000', 'tkdes', '2026-11-04', { fetchImpl })).toEqual([])
  })

  it('throws when the API rejects the request', async () => {
    const fetchImpl = fakeFetch({ tkdes: { code: 16005, desc: "The date's range can't exceed 12 months", data: null } })
    await expect(fetchMonthly('00000000', 'tkdes', '2026-11-04', { fetchImpl })).rejects.toMatchObject({
      kind: 'server',
      message: "The date's range can't exceed 12 months",
    })
  })
})
