import { AccountEntry } from '../AccountEntry/AccountEntry'
import { PulseTrace } from './PulseTrace'
import './Landing.css'

interface LandingProps {
  savedAccounts: string[]
  onOpen: (account: string) => void
  error?: string
  initialValue?: string
}

const FEATURES = [
  ['Balance & runway', 'What is left on the meter, and the day it is likely to run out.'],
  ['Usage over time', 'Day-by-day for the last month, and month-by-month for the year.'],
  ['Low-balance alerts', 'Pick a limit. PowerPulse warns you before the lights go out.'],
] as const

export function Landing({ savedAccounts, onOpen, error, initialValue }: LandingProps) {
  return (
    <section className="landing" aria-labelledby="landing-title">
      <PulseTrace />
      <p className="label landing__kicker">
        <span className="landing__dot" aria-hidden="true" /> DESCO prepaid meters · Dhaka
      </p>
      <h1 id="landing-title" className="landing__title">
        Know what’s left
        <br />
        on your meter<span className="landing__stop">.</span>
      </h1>
      <p className="landing__bn bn" lang="bn">
        মিটারে কত টাকা আছে, কত দিন চলবে — এক নজরে।
      </p>

      <div className="landing__entry">
        <AccountEntry onSubmit={onOpen} error={error} initialValue={initialValue} />
        {savedAccounts.length > 0 ? (
          <div className="landing__saved">
            <span className="label">Saved</span>
            <ul>
              {savedAccounts.map((account) => (
                <li key={account}>
                  <button type="button" className="chip mono" onClick={() => onOpen(account)}>
                    {account}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <ol className="landing__features">
        {FEATURES.map(([title, body], i) => (
          <li key={title}>
            <span className="landing__index mono">{String(i + 1).padStart(2, '0')}</span>
            <h2>{title}</h2>
            <p>{body}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
