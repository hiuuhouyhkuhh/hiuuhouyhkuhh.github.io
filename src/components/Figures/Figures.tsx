import { addMonths, daysInMonth, monthOf } from '../../lib/dates'
import { formatDay, formatKwh, formatMonth, formatTaka } from '../../lib/format'
import type { Forecast } from '../../lib/forecast'
import type { MonthlyUsage } from '../../lib/types'
import './Figures.css'

interface FiguresProps {
  monthToDateTaka: number
  readingDate: string
  forecast: Extract<Forecast, { status: 'ok' }>
  monthly: MonthlyUsage[]
}

function Delta({ change, against }: { change: number; against: string }) {
  const down = change < 0
  return (
    <span className="figure__delta" data-direction={down ? 'down' : 'up'}>
      <svg viewBox="0 0 10 10" width="10" height="10" aria-hidden="true">
        <path d={down ? 'M5 8.5 1.5 3.5h7z' : 'M5 1.5 8.5 6.5h-7z'} />
      </svg>
      {Math.abs(Math.round(change * 100))}% {down ? 'lower' : 'higher'} than {against}
    </span>
  )
}

export function Figures({ monthToDateTaka, readingDate, forecast, monthly }: FiguresProps) {
  const month = monthOf(readingDate)
  const monthName = formatMonth(month)
  const lastMonth = monthly.find((m) => m.month === addMonths(month, -1))
  const monthEnd = `${month}-${String(daysInMonth(month)).padStart(2, '0')}`
  const spentThrough = Number(readingDate.slice(8, 10)) - 1

  return (
    <dl className="figures">
      <div className="figure">
        <dt className="label">Spent in {monthName}</dt>
        <dd className="figure__value">{formatTaka(monthToDateTaka)}</dd>
        <dd className="figure__note">
          {spentThrough > 0 ? `1–${spentThrough} ${monthName}` : 'Month just started'}
        </dd>
      </div>
      <div className="figure">
        <dt className="label">Average day</dt>
        <dd className="figure__value">{formatTaka(forecast.dailyTaka)}</dd>
        <dd className="figure__note">
          {formatKwh(forecast.dailyKwh)} · last {forecast.basisDays} days
        </dd>
      </div>
      <div className="figure">
        <dt className="label">{monthName} projected</dt>
        <dd className="figure__value">{formatTaka(forecast.projectedMonthTaka, { decimals: 0 })}</dd>
        <dd className="figure__note">
          {lastMonth && lastMonth.taka > 0 ? (
            <Delta change={forecast.projectedMonthTaka / lastMonth.taka - 1} against={formatMonth(lastMonth.month)} />
          ) : (
            'Energy cost, before fixed charges'
          )}
        </dd>
      </div>
      <div className="figure">
        <dt className="label">To last the month</dt>
        {forecast.rechargeToMonthEnd > 0 ? (
          <>
            <dd className="figure__value figure__value--accent">{formatTaka(forecast.rechargeToMonthEnd, { decimals: 0 })}</dd>
            <dd className="figure__note">Suggested recharge to reach {formatDay(monthEnd)}</dd>
          </>
        ) : (
          <>
            <dd className="figure__value">Covered</dd>
            <dd className="figure__note">Balance lasts past {formatDay(monthEnd)}</dd>
          </>
        )}
      </div>
    </dl>
  )
}
