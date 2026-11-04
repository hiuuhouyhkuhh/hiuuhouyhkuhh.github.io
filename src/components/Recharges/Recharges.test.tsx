import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { RECHARGES } from '../../test/fixtures'
import { chargeName } from '../../lib/format'
import { Recharges } from './Recharges'

describe('chargeName', () => {
  it('turns DESCO item codes into plain names', () => {
    expect(chargeName('Demand Charge-All')).toBe('Demand charge')
    expect(chargeName('Meter Rent-1P')).toBe('Meter rent')
  })
})

describe('Recharges', () => {
  it('lists each recharge with its breakdown and a grouped token', () => {
    render(<Recharges recharges={RECHARGES} />)
    expect(screen.getByText('1 in the last 12 months · ৳1,500 in total')).toBeInTheDocument()
    expect(screen.getByText('Energy ৳1,227.48')).toBeInTheDocument()
    expect(screen.getByText('Demand charge ৳168')).toBeInTheDocument()
    expect(screen.getByText('1234 5678 9012 3456 7890')).toBeInTheDocument()
  })

  it('copies the raw token', async () => {
    const user = userEvent.setup()
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()
    render(<Recharges recharges={RECHARGES} />)
    await user.click(screen.getByRole('button', { name: 'Copy token for 12 Oct 2026' }))
    expect(writeText).toHaveBeenCalledWith('12345678901234567890')
    expect(screen.getByRole('button', { name: 'Token copied' })).toBeInTheDocument()
  })

  it('collapses long histories', async () => {
    const many = Array.from({ length: 8 }, (_, i) => ({ ...RECHARGES[0]!, orderID: String(i) }))
    render(<Recharges recharges={many} />)
    expect(screen.getAllByRole('listitem')).toHaveLength(5)
    await userEvent.click(screen.getByRole('button', { name: 'Show all 8' }))
    expect(screen.getAllByRole('listitem')).toHaveLength(8)
  })

  it('has an empty state', () => {
    render(<Recharges recharges={[]} />)
    expect(screen.getByText('Nothing in the last 12 months.')).toBeInTheDocument()
  })
})
