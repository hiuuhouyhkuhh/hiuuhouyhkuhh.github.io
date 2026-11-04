import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ColumnChart, type Column } from './ColumnChart'

const columns: Column[] = [
  { key: 'a', label: '1', detail: '1 Nov 2026', value: 4 },
  { key: 'b', label: '2', detail: '2 Nov 2026', value: 6.5, marker: true },
  { key: 'c', label: '3', detail: '3 Nov 2026', value: 5, projected: true },
]

const props = {
  title: 'Daily usage',
  columns,
  format: (v: number) => `${v} kWh`,
  axisFormat: String,
  markerLabel: 'Recharge day',
  valueHeader: 'kWh',
}

describe('ColumnChart', () => {
  it('labels only the peak column directly', () => {
    const { container } = render(<ColumnChart {...props} showTable={false} />)
    expect(container.querySelector('.chart__peak')).toHaveTextContent('6.5 kWh')
  })

  it('reads values with the keyboard, starting from the latest', () => {
    render(<ColumnChart {...props} showTable={false} />)
    const chart = screen.getByRole('group', { name: /daily usage/i })
    fireEvent.focus(chart)
    expect(screen.getByText('3 Nov 2026: 5 kWh, projected')).toBeInTheDocument()
    fireEvent.keyDown(chart, { key: 'ArrowLeft' })
    expect(screen.getByText('2 Nov 2026: 6.5 kWh, recharge day')).toBeInTheDocument()
    fireEvent.keyDown(chart, { key: 'Home' })
    expect(screen.getByText('1 Nov 2026: 4 kWh')).toBeInTheDocument()
  })

  it('has a table twin with every value', () => {
    render(<ColumnChart {...props} showTable />)
    const rows = screen.getAllByRole('row').slice(1)
    expect(rows.map((r) => r.textContent)).toEqual([
      '1 Nov 20264 kWh',
      '2 Nov 2026 · Recharge day6.5 kWh',
      '3 Nov 2026 (projected)5 kWh',
    ])
  })
})
