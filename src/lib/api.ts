import { addDays, addMonths, monthOf } from './dates'
import type {
  ApiEnvelope,
  Backend,
  BalanceRecord,
  DailyRecord,
  MonthlyRecord,
  RechargeRecord,
} from './types'

const BASE_URL = 'https://prepaid.desco.org.bd/api'
const TIMEOUT_MS = 15_000
const BACKENDS: Backend[] = ['unified', 'tkdes']

export type MeterApiErrorKind = 'not-found' | 'network' | 'timeout' | 'server'

export class MeterApiError extends Error {
  readonly kind: MeterApiErrorKind

  constructor(kind: MeterApiErrorKind, message: string) {
    super(message)
    this.name = 'MeterApiError'
    this.kind = kind
  }
}

export interface RequestOptions {
  fetchImpl?: typeof fetch
  signal?: AbortSignal
}

/** Accepts what people type from their bill: spaces, dashes, a "DESCO-" prefix. */
export function normalizeAccount(input: string): string | null {
  const digits = input.trim().replace(/^desco/i, '').replace(/[\s-]/g, '')
  return /^\d{6,12}$/.test(digits) ? digits : null
}

async function request<T>(
  backend: Backend,
  endpoint: string,
  params: Record<string, string>,
  { fetchImpl = fetch, signal }: RequestOptions,
): Promise<ApiEnvelope<T>> {
  const url = `${BASE_URL}/${backend}/customer/${endpoint}?${new URLSearchParams(params)}`
  const timeout = AbortSignal.timeout(TIMEOUT_MS)
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout

  let response: Response
  try {
    response = await fetchImpl(url, { signal: combined, headers: { Accept: 'application/json' } })
  } catch (error) {
    if (signal?.aborted) throw error
    if (timeout.aborted) throw new MeterApiError('timeout', 'DESCO took too long to respond.')
    throw new MeterApiError('network', 'Could not reach DESCO. Check your connection.')
  }

  if (!response.ok) {
    throw new MeterApiError('server', `DESCO returned an error (HTTP ${response.status}).`)
  }
  return (await response.json()) as ApiEnvelope<T>
}

/**
 * Finds the backend that serves this account. An account unknown to a backend
 * answers either `200` with `data: null` or code `16001`.
 */
export async function fetchBalance(
  account: string,
  options: RequestOptions & { preferred?: Backend } = {},
): Promise<{ backend: Backend; balance: BalanceRecord }> {
  const order = options.preferred
    ? [options.preferred, ...BACKENDS.filter((b) => b !== options.preferred)]
    : BACKENDS

  for (const backend of order) {
    const body = await request<BalanceRecord>(backend, 'getBalance', { accountNo: account }, options)
    if (body.code === 200 && body.data) return { backend, balance: body.data }
  }
  throw new MeterApiError('not-found', 'No DESCO prepaid account found with this number.')
}

async function list<T>(
  backend: Backend,
  endpoint: string,
  params: Record<string, string>,
  options: RequestOptions,
): Promise<T[]> {
  const body = await request<T[]>(backend, endpoint, params, options)
  if (body.code !== 200) throw new MeterApiError('server', body.desc)
  return body.data ?? []
}

/** The daily feed only keeps about a month; ask for a little more. */
export function fetchDaily(account: string, backend: Backend, today: string, options: RequestOptions = {}) {
  return list<DailyRecord>(
    backend,
    'getCustomerDailyConsumption',
    { accountNo: account, dateFrom: addDays(today, -35), dateTo: today },
    options,
  )
}

/** The API caps the range at 12 months, inclusive. */
export function fetchMonthly(account: string, backend: Backend, today: string, options: RequestOptions = {}) {
  const month = monthOf(today)
  return list<MonthlyRecord>(
    backend,
    'getCustomerMonthlyConsumption',
    { accountNo: account, monthFrom: addMonths(month, -11), monthTo: month },
    options,
  )
}

export async function fetchRecharges(
  account: string,
  backend: Backend,
  today: string,
  options: RequestOptions = {},
) {
  const rows = await list<RechargeRecord>(
    backend,
    'getRechargeHistory',
    { accountNo: account, dateFrom: addDays(today, -364), dateTo: today },
    options,
  )
  return rows.sort((a, b) => b.rechargeDate.localeCompare(a.rechargeDate))
}
