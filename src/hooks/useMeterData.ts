import { useCallback, useEffect, useState } from 'react'
import { fetchBalance, fetchDaily, fetchMonthly, fetchRecharges, MeterApiError } from '../lib/api'
import { dhakaToday } from '../lib/dates'
import type { Backend, BalanceRecord, DailyRecord, MonthlyRecord, RechargeRecord } from '../lib/types'

/** One independently loading part of the dashboard. `data` survives a refresh. */
export interface Section<T> {
  status: 'loading' | 'ready' | 'error'
  data?: T
  error?: MeterApiError
}

export interface MeterData {
  backend?: Backend
  balance: Section<BalanceRecord>
  daily: Section<DailyRecord[]>
  monthly: Section<MonthlyRecord[]>
  recharges: Section<RechargeRecord[]>
}

const LOADING: Section<never> = { status: 'loading' }

const initial: MeterData = {
  balance: LOADING,
  daily: LOADING,
  monthly: LOADING,
  recharges: LOADING,
}

const backendKey = (account: string) => `pp:backend:${account}`

function toApiError(error: unknown): MeterApiError {
  return error instanceof MeterApiError
    ? error
    : new MeterApiError('server', 'Something went wrong reading this meter.')
}

export function useMeterData(account: string) {
  const [data, setData] = useState<MeterData>(initial)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller
    const today = dhakaToday()

    function settle<K extends 'daily' | 'monthly' | 'recharges'>(key: K, promise: Promise<NonNullable<MeterData[K]['data']>>) {
      promise.then(
        (rows) => !signal.aborted && setData((prev) => ({ ...prev, [key]: { status: 'ready', data: rows } })),
        (error: unknown) =>
          !signal.aborted &&
          setData((prev) => ({ ...prev, [key]: { ...prev[key], status: 'error', error: toApiError(error) } })),
      )
    }

    const preferred = (localStorage.getItem(backendKey(account)) as Backend | null) ?? undefined

    fetchBalance(account, { preferred, signal }).then(
      ({ backend, balance }) => {
        if (signal.aborted) return
        localStorage.setItem(backendKey(account), backend)
        setData((prev) => ({ ...prev, backend, balance: { status: 'ready', data: balance } }))
        settle('daily', fetchDaily(account, backend, today, { signal }))
        settle('monthly', fetchMonthly(account, backend, today, { signal }))
        settle('recharges', fetchRecharges(account, backend, today, { signal }))
      },
      (error: unknown) => {
        if (signal.aborted) return
        const apiError = toApiError(error)
        const failed: Section<never> = { status: 'error', error: apiError }
        setData({ balance: failed, daily: failed, monthly: failed, recharges: failed })
      },
    )

    return () => controller.abort()
  }, [account, reloadToken])

  // Keep whatever is on screen while reloading; only the status changes.
  const reload = useCallback(() => {
    setData((prev) => ({
      backend: prev.backend,
      balance: { ...prev.balance, status: 'loading' },
      daily: { ...prev.daily, status: 'loading' },
      monthly: { ...prev.monthly, status: 'loading' },
      recharges: { ...prev.recharges, status: 'loading' },
    }))
    setReloadToken((n) => n + 1)
  }, [])

  return { ...data, reload }
}
