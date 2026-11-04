import { useCountUp } from '../../hooks/useCountUp'
import { formatDay, formatNumber } from '../../lib/format'
import { readingDate } from '../../lib/dates'
import type { BalanceRecord } from '../../lib/types'
import './BalanceHero.css'

interface BalanceHeroProps {
  balance: BalanceRecord
  refreshing: boolean
  onRefresh: () => void
}

const groupDigits = (value: string) => value.replace(/(\d{4})(?=\d)/g, '$1 ')

export function BalanceHero({ balance, refreshing, onRefresh }: BalanceHeroProps) {
  const shown = useCountUp(balance.balance)
  const [whole, fraction] = formatNumber(Math.max(0, shown), 2).split('.')
  const time = balance.readingTime.slice(11, 16)

  return (
    <div className="hero">
      <p className="label">Balance on meter</p>
      <p className="hero__figure" aria-label={`${formatNumber(balance.balance, 2)} taka`}>
        <span className="hero__currency" aria-hidden="true">
          ৳
        </span>
        <span aria-hidden="true">{whole}</span>
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
    </div>
  )
}
