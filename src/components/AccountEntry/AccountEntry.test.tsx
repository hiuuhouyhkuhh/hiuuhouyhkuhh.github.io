import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AccountEntry } from './AccountEntry'

describe('AccountEntry', () => {
  it('submits the normalised account number', async () => {
    const onSubmit = vi.fn()
    render(<AccountEntry onSubmit={onSubmit} />)
    await userEvent.type(screen.getByLabelText(/account number/i), 'DESCO-0000 0000')
    await userEvent.click(screen.getByRole('button', { name: /read meter/i }))
    expect(onSubmit).toHaveBeenCalledWith('00000000')
  })

  it('explains what is wrong instead of submitting an invalid number', async () => {
    const onSubmit = vi.fn()
    render(<AccountEntry onSubmit={onSubmit} />)
    await userEvent.type(screen.getByLabelText(/account number/i), '12ab{Enter}')
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent(/6–12 digit/i)
    expect(screen.getByLabelText(/account number/i)).toHaveAttribute('aria-invalid', 'true')
  })

  it('shows an error passed in from a failed lookup', () => {
    render(<AccountEntry onSubmit={vi.fn()} error="No DESCO prepaid account found with this number." />)
    expect(screen.getByRole('alert')).toHaveTextContent('No DESCO prepaid account found')
  })
})
