import { AccountMenu } from './AccountMenu'
import { ThemeToggle } from './ThemeToggle'
import './Header.css'

interface HeaderProps {
  active: string | null
  accounts: string[]
  onSwitch: (account: string) => void
  onForget: (account: string) => void
  onAdd: () => void
}

export function Header({ active, accounts, onSwitch, onForget, onAdd }: HeaderProps) {
  return (
    <header className="topbar">
      <a
        className="wordmark"
        href="./"
        onClick={(e) => {
          e.preventDefault()
          onAdd()
        }}
      >
        <svg viewBox="0 0 32 32" width="22" height="22" aria-hidden="true">
          <path
            d="M2 18h7l2.5-8 4 14 3-10 1.5 4H30"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>PowerPulse</span>
        <span className="wordmark__region mono">BD</span>
      </a>
      <div className="topbar__actions">
        {active ? (
          <AccountMenu active={active} accounts={accounts} onSwitch={onSwitch} onForget={onForget} onAdd={onAdd} />
        ) : null}
        <ThemeToggle />
      </div>
    </header>
  )
}
