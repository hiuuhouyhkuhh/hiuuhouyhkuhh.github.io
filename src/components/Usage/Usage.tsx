import { useId, useState } from 'react'
import { monthOf } from '../../lib/dates'
import { formatCompact, formatDay, formatKwh, formatMonth, formatTaka } from '../../lib/format'
import type { Forecast } from '../../lib/forecast'
import type { DailyUsage, MonthlyUsage } from '../../lib/types'
import { ColumnChart, type Column } from '../ColumnChart/ColumnChart'
import './Usage.css'

type Unit = 'kwh' | 'taka'

interface UsageProps {
  daily: DailyUsage[]
  monthly: MonthlyUsage[]
  rechargeDates: Set<string>
  readingDate: string
  forecast: Forecast | null
}

const DAILY_SPAN = 30

function SegmentedUnit({ unit, onChange }: { unit: Unit; onChange: (u: Unit) => void }) {
  const options: [Unit, string][] = [
    ['taka', 'Taka'],
    ['kwh', 'kWh'],
  ]
  return (
    <div className="segmented" role="group" aria-label="Show usage in">
      {options.map(([value, label]) => (
        <button
          key={value}
          type="button"
          aria-pressed={unit === value}
          className="segmented__option"
          onClick={() => onChange(value)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export function Usage({ daily, monthly, rechargeDates, readingDate, forecast }: UsageProps) {
  const [unit, setUnit] = useState<Unit>('taka')
  const [showTable, setShowTable] = useState(false)
  const tableToggleId = useId()

  const format = unit === 'kwh' ? formatKwh : (v: number) => formatTaka(v, { decimals: v >= 100 ? 0 : 2 })
  const axisFormat = unit === 'kwh' ? formatCompact : (v: number) => `৳${formatCompact(v)}`
  const pick = (row: { kwh: number; taka: number }) => (unit === 'kwh' ? row.kwh : row.taka)

  const days = daily.slice(-DAILY_SPAN)
  const dailyColumns: Column[] = days.map((d) => ({
    key: d.date,
    label: formatDay(d.date),
    detail: formatDay(d.date, { year: true }),
    value: pick(d),
    marker: rechargeDates.has(d.date),
  }))
  const dailyAverage = days.length ? days.reduce((s, d) => s + pick(d), 0) / days.length : undefined
  const busiest = days.reduce<DailyUsage | undefined>((best, d) => (!best || pick(d) > pick(best) ? d : best), undefined)

  const month = monthOf(readingDate)
  const monthlyColumns: Column[] = monthly.map((m) => ({
    key: m.month,
    label: formatMonth(m.month),
    detail: formatMonth(m.month, { year: true }),
    value: pick(m),
  }))
  if (forecast?.status === 'ok' && forecast.dailyTaka > 0 && !monthly.some((m) => m.month === month)) {
    const kwhPerTaka = forecast.dailyKwh / forecast.dailyTaka
    monthlyColumns.push({
      key: month,
      label: formatMonth(month),
      detail: formatMonth(month, { year: true }),
      value: unit === 'kwh' ? forecast.projectedMonthTaka * kwhPerTaka : forecast.projectedMonthTaka,
      projected: true,
    })
  }
  const heaviest = monthly.reduce<MonthlyUsage | undefined>((best, m) => (!best || pick(m) > pick(best) ? m : best), undefined)

  return (
    <section className="usage" aria-labelledby="usage-title">
      <div className="section-head">
        <div>
          <h2 id="usage-title">Usage</h2>
          <p>Day by day for the last month, and month by month for the year.</p>
        </div>
        <div className="usage__controls">
          <SegmentedUnit unit={unit} onChange={setUnit} />
          <label className="switch" htmlFor={tableToggleId}>
            <input
              id={tableToggleId}
              type="checkbox"
              role="switch"
              checked={showTable}
              onChange={(e) => setShowTable(e.target.checked)}
            />
            <span className="switch__track" aria-hidden="true" />
            Table view
          </label>
        </div>
      </div>

      <div className="usage__grid">
        <article className="usage__block">
          <header className="usage__block-head">
            <h3>Daily</h3>
            {busiest ? (
              <p>
                Busiest day: <strong>{formatDay(busiest.date)}</strong>, {format(pick(busiest))}
              </p>
            ) : null}
            {rechargeDates.size > 0 ? (
              <p className="usage__legend">
                <span className="usage__key usage__key--marker" aria-hidden="true" /> Recharge day
              </p>
            ) : null}
          </header>
          {dailyColumns.length > 0 ? (
            <ColumnChart
              title={`Daily usage in ${unit === 'kwh' ? 'kilowatt-hours' : 'taka'}`}
              columns={dailyColumns}
              format={format}
              axisFormat={axisFormat}
              average={dailyAverage}
              markerLabel="Recharge day"
              showTable={showTable}
              valueHeader={unit === 'kwh' ? 'kWh' : 'Taka'}
            />
          ) : (
            <p className="inline-note">DESCO has not reported daily readings for this meter yet.</p>
          )}
        </article>

        <article className="usage__block">
          <header className="usage__block-head">
            <h3>Monthly</h3>
            {heaviest ? (
              <p>
                Heaviest month: <strong>{formatMonth(heaviest.month, { year: true })}</strong>, {format(pick(heaviest))}
              </p>
            ) : null}
            {monthlyColumns.some((c) => c.projected) ? (
              <p className="usage__legend">
                <span className="usage__key usage__key--projected" aria-hidden="true" /> {formatMonth(month)} projected
              </p>
            ) : null}
          </header>
          {monthlyColumns.length > 0 ? (
            <ColumnChart
              title={`Monthly usage in ${unit === 'kwh' ? 'kilowatt-hours' : 'taka'}`}
              columns={monthlyColumns}
              format={format}
              axisFormat={axisFormat}
              showTable={showTable}
              valueHeader={unit === 'kwh' ? 'kWh' : 'Taka'}
            />
          ) : (
            <p className="inline-note">No monthly history yet.</p>
          )}
        </article>
      </div>
      <p className="usage__note">
        Taka figures are the energy cost DESCO reports. Demand charge, meter rent and VAT are taken when you recharge.
      </p>
    </section>
  )
}
