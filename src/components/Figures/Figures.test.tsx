import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Figures } from './Figures'

const outlook = {
  status: 'ok' as const,
  basisDays: 14,
  dailyTaka: 30,
  dailyKwh: 4.2,
  daysLeft: 17,
  runOutDate: '2026-11-21',
  projectedMonthTaka: 883.85,
  rechargeToMonthEnd: 300,
}

describe('Figures', () => {
  it('shows month to date, average, projection versus last month and a recharge suggestion', () => {
    render(
      <Figures
        monthToDateTaka={73.85}
        readingDate="2026-11-04"
        forecast={outlook}
        monthly={[{ month: '2026-10', kwh: 169.5, taka: 1198.09, maxDemandKw: 0.9 }]}
      />,
    )
    expect(screen.getByText('Spent in Nov').nextSibling).toHaveTextContent('৳73.85')
    expect(screen.getByText('1–3 Nov')).toBeInTheDocument()
    expect(screen.getByText('4.2 kWh · last 14 days')).toBeInTheDocument()
    expect(screen.getByText('৳884')).toBeInTheDocument()
    expect(screen.getByText(/26% lower than Oct/)).toBeInTheDocument()
    expect(screen.getByText('৳300')).toBeInTheDocument()
  })

  it('says the month is covered when no recharge is needed', () => {
    render(<Figures monthToDateTaka={0} readingDate="2026-11-01" forecast={{ ...outlook, rechargeToMonthEnd: 0 }} monthly={[]} />)
    expect(screen.getByText('Covered')).toBeInTheDocument()
    expect(screen.getByText('Balance lasts past 30 Nov')).toBeInTheDocument()
    expect(screen.getByText('Month just started')).toBeInTheDocument()
  })
})
