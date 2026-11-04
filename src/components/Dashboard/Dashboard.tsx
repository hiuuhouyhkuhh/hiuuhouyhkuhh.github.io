import { useEffect } from 'react'
import { useMeterData } from '../../hooks/useMeterData'
import { BalanceHero } from '../BalanceHero/BalanceHero'
import './Dashboard.css'

interface DashboardProps {
  account: string
  onLoaded: (account: string) => void
  onNotFound: (account: string, message: string) => void
}

export function Dashboard({ account, onLoaded, onNotFound }: DashboardProps) {
  const meter = useMeterData(account)
  const { balance } = meter

  const notFound = balance.status === 'error' && balance.error?.kind === 'not-found'
  useEffect(() => {
    if (balance.status === 'ready') onLoaded(account)
    if (notFound) onNotFound(account, balance.error!.message)
  }, [account, balance.status, balance.error, notFound, onLoaded, onNotFound])

  if (balance.status === 'error' && !notFound) {
    return (
      <section className="panel-error" role="alert">
        <h1>Couldn’t read this meter</h1>
        <p>{balance.error?.message}</p>
        <button type="button" className="button" onClick={meter.reload}>
          Try again
        </button>
      </section>
    )
  }

  if (!balance.data) {
    return (
      <div className="dash" aria-busy="true">
        <p className="visually-hidden" role="status">
          Reading meter {account}…
        </p>
        <div className="skeleton skeleton--hero" />
        <div className="skeleton skeleton--row" />
      </div>
    )
  }

  return (
    <div className="dash">
      <section className="readout" aria-label="Balance">
        <BalanceHero balance={balance.data} refreshing={balance.status === 'loading'} onRefresh={meter.reload} />
      </section>
    </div>
  )
}
