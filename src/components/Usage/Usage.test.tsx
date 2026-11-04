import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Usage } from './Usage'

const daily = [
  { date: '2026-11-01', kwh: 4.5, taka: 21 },
  { date: '2026-11-02', kwh: 5.5, taka: 25.4 },
]
const monthly = [{ month: '2026-10', kwh: 169.5, taka: 1198.09, maxDemandKw: 0.9 }]
const forecast = {
  status: 'ok' as const,
  basisDays: 2,
  dailyTaka: 25,
  dailyKwh: 5,
  daysLeft: 20,
  runOutDate: '2026-11-24',
  projectedMonthTaka: 800,
  rechargeToMonthEnd: 0,
}

function renderUsage() {
  render(
    <Usage
      daily={daily}
      monthly={monthly}
      rechargeDates={new Set(['2026-11-02'])}
      readingDate="2026-11-04"
      forecast={forecast}
    />,
  )
}

describe('Usage', () => {
  it('shows taka by default and summarises the busiest day and heaviest month', () => {
    renderUsage()
    expect(screen.getByRole('button', { name: 'Taka' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(/busiest day/i)).toHaveTextContent('Busiest day: 2 Nov, ৳25.40')
    expect(screen.getByText(/heaviest month/i)).toHaveTextContent('Heaviest month: Oct 2026, ৳1,198')
  })

  it('switches both charts to kWh', async () => {
    renderUsage()
    await userEvent.click(screen.getByRole('button', { name: 'kWh' }))
    expect(screen.getByText(/busiest day/i)).toHaveTextContent('5.5 kWh')
    expect(screen.getByText(/heaviest month/i)).toHaveTextContent('169.5 kWh')
  })

  it('adds the projected current month and shows tables on request', async () => {
    renderUsage()
    await userEvent.click(screen.getByRole('switch', { name: /table view/i }))
    const [, monthlyTable] = screen.getAllByRole('table')
    expect(within(monthlyTable!).getByText('Nov 2026 (projected)')).toBeInTheDocument()
    expect(within(monthlyTable!).getByText('৳800')).toBeInTheDocument()
  })
})
