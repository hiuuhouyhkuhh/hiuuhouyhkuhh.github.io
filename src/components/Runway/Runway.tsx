import { useElementWidth } from '../../hooks/useElementWidth'
import { addDays, daysBetween, daysInMonth, monthOf } from '../../lib/dates'
import { formatDay, formatTaka } from '../../lib/format'
import './Runway.css'

interface RunwayProps {
  daysLeft: number
  runOutDate: string | null
  readingDate: string
  dailyTaka: number
  alertDays: number
}

const TRACK_Y = 34
const TRACK_H = 8
const WEEKDAY = new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'UTC' })

function weekday(isoDate: string) {
  return WEEKDAY.format(new Date(`${isoDate}T00:00:00Z`))
}

/** A ruler of days from today: how far the balance reaches, against month end and the alert zone. */
export function Runway({ daysLeft, runOutDate, readingDate, dailyTaka, alertDays }: RunwayProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>(420)
  const finite = Number.isFinite(daysLeft)
  const month = monthOf(readingDate)
  const monthEnd = `${month}-${String(daysInMonth(month)).padStart(2, '0')}`
  const monthEndDays = daysBetween(readingDate, monthEnd) + 1
  // Always show month end: the gap between it and the run-out date is the story.
  const domain = Math.min(60, Math.max(21, monthEndDays + 2, finite ? Math.ceil(daysLeft) + 5 : 0))
  const x = (days: number) => (Math.min(days, domain) / domain) * width
  const fillDays = finite ? daysLeft : domain
  const runOutX = x(fillDays)
  const alertStartX = finite ? x(Math.max(0, daysLeft - alertDays)) : runOutX
  const showMonthEndLabel = monthEndDays <= domain && Math.abs(x(monthEndDays) - runOutX) > 90
  const anchor = runOutX < 60 ? 'start' : runOutX > width - 60 ? 'end' : 'middle'
  const weeks = Array.from({ length: Math.floor(domain / 7) + 1 }, (_, i) => i * 7)
  const shownDays = Math.floor(daysLeft)
  const critical = finite && daysLeft < alertDays

  return (
    <div className="runway" data-critical={critical ? '' : undefined}>
      <p className="label">Runway at current usage</p>
      <p className="runway__headline">
        {!finite ? (
          'No spending recorded lately'
        ) : daysLeft <= 0 ? (
          <span className="runway__days">Balance used up</span>
        ) : (
          <>
            <span className="runway__days">{shownDays}</span> {shownDays === 1 ? 'day' : 'days'} left
          </>
        )}
      </p>
      <p className="runway__sub">
        {finite && daysLeft <= 0 ? (
          'Recharge to keep the power on.'
        ) : runOutDate ? (
          <>
            Runs out around{' '}
            <strong>
              {weekday(runOutDate)}, {formatDay(runOutDate)}
            </strong>{' '}
            at about {formatTaka(dailyTaka)} a day
          </>
        ) : (
          'Your balance is not going down right now.'
        )}
      </p>

      <div className="runway__ruler" ref={ref}>
        <svg width={width} height="76" role="img" aria-label={
            finite && runOutDate
              ? `Balance lasts about ${shownDays} days, until ${formatDay(runOutDate, { year: true })}`
              : 'Balance is not going down at the moment'
          }>
          <rect className="runway__track" x="0" y={TRACK_Y} width={width} height={TRACK_H} rx="2" />
          <g className="runway__fill">
            <rect className="runway__safe" x="0" y={TRACK_Y} width={Math.max(0, alertStartX - 1)} height={TRACK_H} rx="2" />
            {finite ? (
              <rect
                className="runway__alert"
                x={alertStartX + 1}
                y={TRACK_Y}
                width={Math.max(0, runOutX - alertStartX - 1)}
                height={TRACK_H}
                rx="2"
              />
            ) : null}
          </g>

          {Array.from({ length: domain + 1 }, (_, d) => (
            <line
              key={d}
              className={d % 7 === 0 ? 'runway__tick runway__tick--week' : 'runway__tick'}
              x1={x(d)}
              x2={x(d)}
              y1={TRACK_Y + TRACK_H + 3}
              y2={TRACK_Y + TRACK_H + (d % 7 === 0 ? 9 : 5)}
            />
          ))}
          {weeks.map((d) => (
            <text
              key={d}
              className="runway__axis"
              x={x(d)}
              y={TRACK_Y + TRACK_H + 24}
              textAnchor={d === 0 ? 'start' : x(d) > width - 30 ? 'end' : 'middle'}
            >
              {d === 0 ? 'Today' : formatDay(addDays(readingDate, d))}
            </text>
          ))}

          {monthEndDays <= domain ? (
            <g className="runway__month-end">
              <line x1={x(monthEndDays)} x2={x(monthEndDays)} y1={TRACK_Y - 8} y2={TRACK_Y + TRACK_H + 2} />
              {showMonthEndLabel ? (
                <text x={x(monthEndDays) - 6} y={TRACK_Y - 12} textAnchor="end">
                  Month end
                </text>
              ) : null}
            </g>
          ) : null}

          {finite ? (
            <g className="runway__marker">
              <path d={`M${runOutX - 5} ${TRACK_Y - 14} h10 l-5 7 z`} />
              <text x={runOutX} y={TRACK_Y - 20} textAnchor={anchor}>
                {daysLeft > domain ? `${formatDay(runOutDate!)} →` : formatDay(runOutDate!)}
              </text>
            </g>
          ) : null}
        </svg>
      </div>
      {finite ? (
        <p className="runway__legend">
          <span className="runway__key" aria-hidden="true" />
          Alert window: last {alertDays} days before it runs out
        </p>
      ) : null}
    </div>
  )
}
