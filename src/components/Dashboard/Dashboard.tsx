import { useEffect, useMemo } from 'react'
import { useMeterData } from '../../hooks/useMeterData'
import { readingDate } from '../../lib/dates'
import { deriveDailyUsage, sortMonthlyUsage } from '../../lib/derive'
import { forecast } from '../../lib/forecast'
import { BalanceHero } from '../BalanceHero/BalanceHero'
import { Figures } from '../Figures/Figures'
import { Runway } from '../Runway/Runway'
import './Dashboard.css'

interface DashboardProps {
  account: string
  onLoaded: (account: string) => void
  onNotFound: (account: string, message: string) => void
}

const ALERT_DAYS = 7

export function Dashboard({ account, onLoaded, onNotFound }: DashboardProps) {
  const meter = useMeterData(account)
  const { balance, daily, monthly } = meter

  const notFound = balance.status === 'error' && balance.error?.kind === 'not-found'
  useEffect(() => {
    if (balance.status === 'ready') onLoaded(account)
    if (notFound) onNotFound(account, balance.error!.message)
  }, [account, balance.status, balance.error, notFound, onLoaded, onNotFound])

  const dailyUsage = useMemo(() => deriveDailyUsage(daily.data ?? []), [daily.data])
  const monthlyUsage = useMemo(() => sortMonthlyUsage(monthly.data ?? []), [monthly.data])
  const reading = balance.data ? readingDate(balance.data.readingTime) : null
  const outlook = useMemo(
    () =>
      balance.data && reading && daily.data
        ? forecast({
            balance: balance.data.balance,
            monthToDateTaka: balance.data.currentMonthConsumption,
            readingDate: reading,
            daily: dailyUsage,
          })
        : null,
    [balance.data, reading, daily.data, dailyUsage],
  )

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

  if (!balance.data || !reading) {
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
      <h1 className="visually-hidden">Meter {account}</h1>
      <section className="readout" aria-label="Balance and runway">
        <BalanceHero balance={balance.data} refreshing={balance.status === 'loading'} onRefresh={meter.reload} />
        {outlook?.status === 'ok' ? (
          <Runway
            daysLeft={outlook.daysLeft}
            runOutDate={outlook.runOutDate}
            readingDate={reading}
            dailyTaka={outlook.dailyTaka}
            alertDays={ALERT_DAYS}
          />
        ) : outlook?.status === 'insufficient' ? (
          <p className="inline-note">Forecasts appear once DESCO has reported at least 3 days of readings.</p>
        ) : daily.status === 'error' ? (
          <p className="inline-note">Daily readings are unavailable right now, so there is no forecast.</p>
        ) : (
          <div className="skeleton skeleton--runway" />
        )}
      </section>

      {outlook?.status === 'ok' ? (
        <Figures
          monthToDateTaka={balance.data.currentMonthConsumption}
          readingDate={reading}
          forecast={outlook}
          monthly={monthlyUsage}
        />
      ) : null}
    </div>
  )
}
