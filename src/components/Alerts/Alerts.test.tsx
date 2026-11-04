import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_ALERTS } from '../../lib/alerts'
import { AlertBanner } from './AlertBanner'
import { AlertSettings } from './AlertSettings'

describe('AlertBanner', () => {
  it('renders nothing when there is no alert', () => {
    const { container } = render(<AlertBanner alert={{ level: 'none', title: '', detail: '' }} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('interrupts for critical alerts and names the level in text, not just colour', () => {
    render(<AlertBanner alert={{ level: 'critical', title: 'Out of balance', detail: 'Recharge now.' }} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Urgent: Out of balance')
  })

  it('uses a polite status for warnings and adds the recharge suggestion', () => {
    render(
      <AlertBanner
        alert={{ level: 'warning', title: 'About 6 days of power left', detail: 'Runs out around 10 Nov.' }}
        suggestion="Recharging ৳400 gets you to month end."
      />,
    )
    expect(screen.getByRole('status')).toHaveTextContent('Runs out around 10 Nov. Recharging ৳400 gets you to month end.')
  })
})

describe('AlertSettings', () => {
  it('updates the threshold and runway as the user edits', async () => {
    const onChange = vi.fn()
    render(<AlertSettings settings={DEFAULT_ALERTS} onChange={onChange} />)

    const threshold = screen.getByLabelText(/balance is below/i)
    await userEvent.clear(threshold)
    await userEvent.type(threshold, '350')
    expect(onChange).toHaveBeenLastCalledWith({ ...DEFAULT_ALERTS, thresholdTaka: 350 })

    await userEvent.selectOptions(screen.getByLabelText(/fewer days/i), '10')
    expect(onChange).toHaveBeenLastCalledWith({ ...DEFAULT_ALERTS, runwayDays: 10 })
  })

  it('explains when the browser cannot notify', () => {
    render(<AlertSettings settings={DEFAULT_ALERTS} onChange={vi.fn()} />)
    expect(screen.getByRole('switch', { name: /browser notification/i })).toBeDisabled()
    expect(screen.getByText(/does not support notifications/i)).toBeInTheDocument()
  })
})

describe('AlertSettings on iPhone', () => {
  it('explains how to enable notifications from the Home Screen', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)')
    render(<AlertSettings settings={DEFAULT_ALERTS} onChange={vi.fn()} />)
    expect(screen.getByText(/add to home screen/i)).toBeInTheDocument()
    vi.restoreAllMocks()
  })
})
