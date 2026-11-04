import { useCallback, useEffect, useState } from 'react'
import { Dashboard } from './components/Dashboard/Dashboard'
import { Header } from './components/Header/Header'
import { Landing } from './components/Landing/Landing'
import { useLocalStorage } from './hooks/useLocalStorage'
import { normalizeAccount } from './lib/api'
import './App.css'

const MAX_SAVED = 5

function accountFromUrl(): string | null {
  return normalizeAccount(new URLSearchParams(window.location.search).get('account') ?? '')
}

export function App() {
  const [accounts, setAccounts] = useLocalStorage<string[]>('pp:accounts', [])
  const [stored, setStored] = useLocalStorage<string | null>('pp:active', null)
  const [active, setActive] = useState<string | null>(() => accountFromUrl() ?? stored)
  const [lookupError, setLookupError] = useState<{ account: string; message: string }>()

  // Keep the address bar shareable: ?account=… mirrors the meter on screen.
  useEffect(() => {
    const url = new URL(window.location.href)
    if (active) url.searchParams.set('account', active)
    else url.searchParams.delete('account')
    window.history.replaceState(null, '', url)
  }, [active])

  const open = useCallback((account: string) => {
    setLookupError(undefined)
    setActive(account)
  }, [])

  const handleLoaded = useCallback(
    (account: string) => {
      setStored(account)
      setAccounts((prev) => [account, ...prev.filter((a) => a !== account)].slice(0, MAX_SAVED))
    },
    [setAccounts, setStored],
  )

  const handleNotFound = useCallback((account: string, message: string) => {
    setLookupError({ account, message })
    setActive(null)
  }, [])

  const forget = (account: string) => {
    setAccounts((prev) => prev.filter((a) => a !== account))
    localStorage.removeItem(`pp:backend:${account}`)
    if (account === active) {
      setActive(null)
      setStored(null)
    }
  }

  const goHome = () => {
    setActive(null)
    setStored(null)
  }

  return (
    <div className="page">
      <Header active={active} accounts={accounts} onSwitch={open} onForget={forget} onAdd={goHome} />
      <main id="main">
        {active ? (
          <Dashboard key={active} account={active} onLoaded={handleLoaded} onNotFound={handleNotFound} />
        ) : (
          <Landing
            savedAccounts={accounts}
            onOpen={open}
            error={lookupError?.message}
            initialValue={lookupError?.account}
          />
        )}
      </main>
      <footer className="footer">
        <p>
          PowerPulse BD is an independent project and is not affiliated with DESCO. Readings come straight from
          DESCO’s public prepaid service to your browser; your account number is only stored on this device.
        </p>
        <a href="https://github.com/powerpulsebd/powerpulsebd.github.io">Source on GitHub</a>
      </footer>
    </div>
  )
}
