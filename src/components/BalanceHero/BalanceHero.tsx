import { useCountUp } from '../../hooks/useCountUp'
import { formatDay, formatNumber, formatTaka } from '../../lib/format'
import { readingDate } from '../../lib/dates'
import type { BalanceRecord } from '../../lib/types'
import './BalanceHero.css'

interface BalanceHeroProps {
  balance: BalanceRecord
  refreshing: boolean
  /** Set when the latest refresh failed; the figures shown are from the previous reading. */
  refreshError?: string
  onRefresh: () => void
}

const groupDigits = (value: string) => value.replace(/(\d{4})(?=\d)/g, '$1 ')

export function BalanceHero({ balance, refreshing, refreshError, onRefresh }: BalanceHeroProps) {
  const shown = useCountUp(balance.balance)
  // A meter in debt reads negative; show it rather than hiding it as zero.
  const [whole, fraction] = formatNumber(Math.abs(shown), 2).split('.')
  const negative = balance.balance < 0
  const time = balance.readingTime.slice(11, 16)

  return (
    <div className="hero">
      <p className="label hero__label">
        <span className="hero__live" aria-hidden="true" />
        Balance on meter
      </p>
      <p className="hero__figure">
        <span className="visually-hidden">{formatTaka(balance.balance)}</span>
        <span className="hero__currency" aria-hidden="true">
          ৳
        </span>
        <span aria-hidden="true">
          {negative ? '−' : ''}
          {whole}
        </span>
        <span className="hero__fraction" aria-hidden="true">
          .{fraction}
        </span>
      </p>
      <dl className="hero__meta">
        <div>
          <dt className="label">Account</dt>
          <dd className="mono">{balance.accountNo}</dd>
        </div>
        <div>
          <dt className="label">Meter</dt>
          <dd className="mono">{groupDigits(balance.meterNo)}</dd>
        </div>
        <div>
          <dt className="label">Last reading</dt>
          <dd className="mono">
            {formatDay(readingDate(balance.readingTime), { year: true })}, {time}
          </dd>
        </div>
      </dl>
      <button type="button" className="hero__refresh" onClick={onRefresh} disabled={refreshing}>
        <svg
          viewBox="0 0 16 16"
          width="14"
          height="14"
          aria-hidden="true"
          className={refreshing ? 'is-spinning' : undefined}
        >
          <path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13.5 2.5v3h-3" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        {refreshing ? 'Reading meter…' : 'Refresh'}
      </button>
      {refreshError ? (
        <p className="hero__error" role="status">
          Couldn’t refresh: {refreshError} Showing the last reading.
        </p>
      ) : null}
    </div>
  )
}
