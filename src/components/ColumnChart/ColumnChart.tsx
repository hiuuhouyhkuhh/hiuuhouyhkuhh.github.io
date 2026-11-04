import { useState, type KeyboardEvent } from 'react'
import { useElementWidth } from '../../hooks/useElementWidth'
import { columnPath, niceTicks } from './scale'
import './ColumnChart.css'

export interface Column {
  key: string
  /** Short axis label. */
  label: string
  /** Full label for the tooltip and table. */
  detail: string
  value: number
  projected?: boolean
  marker?: boolean
}

interface ColumnChartProps {
  title: string
  columns: Column[]
  format: (value: number) => string
  axisFormat: (value: number) => string
  average?: number
  markerLabel?: string
  showTable: boolean
  valueHeader: string
  height?: number
}

const M = { top: 30, right: 4, bottom: 30, left: 40 }
const LABEL_WIDTH = 58

export function ColumnChart({
  title,
  columns,
  format,
  axisFormat,
  average,
  markerLabel,
  showTable,
  valueHeader,
  height = 240,
}: ColumnChartProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>()
  const [active, setActive] = useState<number | null>(null)

  if (showTable) {
    return (
      <table className="chart-table">
        <caption className="visually-hidden">{title}</caption>
        <thead>
          <tr>
            <th scope="col">Period</th>
            <th scope="col">{valueHeader}</th>
          </tr>
        </thead>
        <tbody>
          {columns.map((c) => (
            <tr key={c.key}>
              <th scope="row">
                {c.detail}
                {c.projected ? ' (projected)' : ''}
                {c.marker && markerLabel ? ` · ${markerLabel}` : ''}
              </th>
              <td>{format(c.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  const plotW = Math.max(0, width - M.left - M.right)
  const plotH = height - M.top - M.bottom
  const ticks = niceTicks(Math.max(...columns.map((c) => c.value), average ?? 0))
  const yMax = ticks[ticks.length - 1]!
  const y = (v: number) => M.top + plotH - (v / yMax) * plotH
  const band = plotW / Math.max(1, columns.length)
  const barW = Math.min(24, Math.max(3, band * 0.62))
  const barX = (i: number) => M.left + i * band + (band - barW) / 2
  const labelEvery = Math.max(1, Math.ceil(LABEL_WIDTH / band))
  const peak = columns.reduce((best, c, i) => (c.value > (columns[best]?.value ?? -1) ? i : best), 0)
  const current = active === null ? null : columns[active]

  function onKeyDown(e: KeyboardEvent) {
    const last = columns.length - 1
    const moves: Record<string, number> = {
      ArrowLeft: Math.max(0, (active ?? last + 1) - 1),
      ArrowRight: Math.min(last, (active ?? -1) + 1),
      Home: 0,
      End: last,
    }
    if (e.key in moves) {
      e.preventDefault()
      setActive(moves[e.key]!)
    } else if (e.key === 'Escape') setActive(null)
  }

  const describe = (c: Column) =>
    `${c.detail}: ${format(c.value)}${c.projected ? ', projected' : ''}${c.marker && markerLabel ? `, ${markerLabel.toLowerCase()}` : ''}`

  return (
    <div
      className="chart"
      ref={ref}
      tabIndex={0}
      role="group"
      aria-label={`${title}. Use the left and right arrow keys to read each value.`}
      onKeyDown={onKeyDown}
      onFocus={() => setActive((a) => a ?? columns.length - 1)}
      onBlur={() => setActive(null)}
      onPointerLeave={() => setActive(null)}
    >
      <svg width={width} height={height} aria-hidden="true">
        {ticks.map((t) => (
          <g key={t} className="chart__grid">
            <line x1={M.left} x2={width - M.right} y1={y(t)} y2={y(t)} />
            <text x={M.left - 8} y={y(t)} dy="0.32em" textAnchor="end">
              {axisFormat(t)}
            </text>
          </g>
        ))}


        {columns.map((c, i) => {
          const top = y(c.value)
          const state = active === i ? 'active' : undefined
          return (
            <g key={c.key} className="chart__col" data-state={state} data-projected={c.projected ? '' : undefined}>
              <path
                className="chart__bar"
                style={{ animationDelay: `${Math.min(i * 22, 600)}ms` }}
                d={columnPath(barX(i), top, barW, M.top + plotH)}
              />
              {c.marker ? (
                <circle className="chart__marker" cx={barX(i) + barW / 2} cy={top - 9} r="4" />
              ) : null}
              {(columns.length - 1 - i) % labelEvery === 0 ? (
                <text
                  className="chart__x"
                  x={i === columns.length - 1 ? barX(i) + barW : barX(i) + barW / 2}
                  y={height - 10}
                  textAnchor={i === columns.length - 1 ? 'end' : 'middle'}
                >
                  {c.label}
                </text>
              ) : null}
              <rect
                className="chart__hit"
                x={M.left + i * band}
                y={M.top - 20}
                width={band}
                height={plotH + 20}
                onPointerEnter={() => setActive(i)}
              />
            </g>
          )
        })}

        {average !== undefined && average > 0 ? (
          <g className="chart__average">
            <line x1={M.left} x2={width - M.right} y1={y(average)} y2={y(average)} />
            <text x={width - M.right} y={y(average) - 6} textAnchor="end">
              avg {format(average)}
            </text>
          </g>
        ) : null}

        {columns[peak] && columns[peak].value > 0 ? (
          <text
            className="chart__peak"
            x={barX(peak) + barW / 2}
            y={y(columns[peak].value) - (columns[peak].marker ? 20 : 8)}
            textAnchor={peak === 0 ? 'start' : peak === columns.length - 1 ? 'end' : 'middle'}
          >
            {format(columns[peak].value)}
          </text>
        ) : null}
      </svg>

      {current && active !== null ? (
        <div
          className="chart__tip"
          style={{
            left: Math.min(Math.max(barX(active) + barW / 2, 70), width - 70),
            top: y(current.value) - (current.marker ? 22 : 10),
          }}
        >
          <strong>{format(current.value)}</strong>
          <span>
            {current.detail}
            {current.projected ? ' · projected' : ''}
          </span>
          {current.marker && markerLabel ? <span className="chart__tip-marker">{markerLabel}</span> : null}
        </div>
      ) : null}
      <p className="visually-hidden" aria-live="polite">
        {current ? describe(current) : ''}
      </p>
    </div>
  )
}
