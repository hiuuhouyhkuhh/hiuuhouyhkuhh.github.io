import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'
import { BALANCE, mockDesco } from './test/fixtures'

afterEach(() => {
  vi.unstubAllGlobals()
  window.history.replaceState(null, '', '/')
})

async function openAccount(account: string) {
  render(<App />)
  await userEvent.type(screen.getByLabelText(/account number/i), account)
  await userEvent.click(screen.getByRole('button', { name: /read meter/i }))
}

describe('App', () => {
  it('reads a meter end to end and remembers the account', async () => {
    mockDesco()
    await openAccount('00000000')

    expect(await screen.findByLabelText('510.65 taka')).toBeInTheDocument()
    expect(screen.getByText('1234 5678 9012')).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('pp:accounts')!)).toEqual(['00000000'])
    expect(localStorage.getItem('pp:backend:00000000')).toBe('tkdes')
    expect(window.location.search).toBe('?account=00000000')
  })

  it('returns to the entry form with an explanation when the account is unknown', async () => {
    mockDesco()
    await openAccount('11112222')

    expect(await screen.findByRole('alert')).toHaveTextContent(/no desco prepaid account/i)
    expect(screen.getByLabelText(/account number/i)).toHaveValue('11112222')
    expect(localStorage.getItem('pp:accounts')).toBeNull()
  })

  it('opens the account from a shared link', async () => {
    mockDesco()
    window.history.replaceState(null, '', '/?account=00000000')
    render(<App />)
    expect(await screen.findByLabelText('510.65 taka')).toBeInTheDocument()
  })

  it('warns when the balance is below the alert threshold', async () => {
    mockDesco({ balance: { ...BALANCE, balance: 150 } })
    await openAccount('00000000')
    expect(await screen.findByText(/below your ৳200 alert/)).toBeInTheDocument()
  })

  it('offers a retry when DESCO cannot be reached', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))))
    await openAccount('00000000')

    expect(await screen.findByRole('heading', { name: /couldn’t read this meter/i })).toBeInTheDocument()
    mockDesco()
    await userEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(await screen.findByLabelText('510.65 taka')).toBeInTheDocument()
  })
})
