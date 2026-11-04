import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Runway } from './Runway'

describe('Runway', () => {
  it('states days left and the run-out date in words', () => {
    render(<Runway daysLeft={17.4} runOutDate="2026-11-21" readingDate="2026-11-04" dailyTaka={30} alertDays={7} />)
    expect(screen.getByText(/days left/)).toHaveTextContent('17 days left')
    expect(screen.getByText(/runs out around/i)).toHaveTextContent('Runs out around Sat, 21 Nov at about ৳30.00 a day')
    expect(screen.getByRole('img')).toHaveAccessibleName('Balance lasts about 17 days, until 21 Nov 2026')
  })

  it('handles a balance that is not being spent', () => {
    render(<Runway daysLeft={Infinity} runOutDate={null} readingDate="2026-11-04" dailyTaka={0} alertDays={7} />)
    expect(screen.getByText('No spending recorded lately')).toBeInTheDocument()
    expect(screen.getByRole('img')).toHaveAccessibleName('Balance is not going down at the moment')
  })

  it('says when the balance is used up', () => {
    render(<Runway daysLeft={0} runOutDate="2026-11-04" readingDate="2026-11-04" dailyTaka={20} alertDays={7} />)
    expect(screen.getByText('Balance used up')).toBeInTheDocument()
    expect(screen.getByText('Recharge to keep the power on.')).toBeInTheDocument()
  })
})
