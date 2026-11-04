import { useEffect, useMemo } from 'react'
import { useAlertNotification } from '../../hooks/useAlertNotification'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { useMeterData } from '../../hooks/useMeterData'
import { DEFAULT_ALERTS, evaluateAlert, type AlertSettings as Settings } from '../../lib/alerts'
import { readingDate } from '../../lib/dates'
import { deriveDailyUsage, sortMonthlyUsage } from '../../lib/derive'
import { formatTaka } from '../../lib/format'
import { forecast } from '../../lib/forecast'
import { AlertBanner } from '../Alerts/AlertBanner'
import { AlertSettings } from '../Alerts/AlertSettings'
import { BalanceHero } from '../BalanceHero/BalanceHero'
import { Figures } from '../Figures/Figures'
import { Recharges } from '../Recharges/Recharges'
import { Runway } from '../Runway/Runway'
import { Usage } from '../Usage/Usage'
import './Dashboard.css'

interface DashboardProps {
  account: string
  onLoaded: (account: string) => void
  onNotFound: (account: string, message: string) => void
}

export function Dashboard({ account, onLoaded, onNotFound }: DashboardProps) {
  const meter = useMeterData(account)
  const { balance, daily, monthly, recharges } = meter
  const [settings, setSettings] = useLocalStorage<Settings>('pp:alerts', DEFAULT_ALERTS)

  const notFound = balance.status === 'error' && balance.error?.kind === 'not-found'
  useEffect(() => {
    if (balance.status === 'ready') onLoaded(account)
    if (notFound) onNotFound(account, balance.error!.message)
  }, [account, balance.status, balance.error, notFound, onLoaded, onNotFound])

  const dailyUsage = useMemo(() => deriveDailyUsage(daily.data ?? []), [daily.data])
  const monthlyUsage = useMemo(() => sortMonthlyUsage(monthly.data ?? []), [monthly.data])
  const rechargeDates = useMemo(
    () => new Set((recharges.data ?? []).map((r) => r.rechargeDate.slice(0, 10))),
    [recharges.data],
  )
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
  const alert = useMemo(
    () =>
      balance.data
        ? evaluateAlert(
            {
              balance: balance.data.balance,
              daysLeft: outlook?.status === 'ok' ? outlook.daysLeft : null,
              runOutDate: outlook?.status === 'ok' ? outlook.runOutDate : null,
            },
            settings,
          )
        : null,
    [balance.data, outlook, settings],
  )
  useAlertNotification(account, alert, settings.notify)

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
      {alert ? (
        <AlertBanner
          alert={alert}
          suggestion={
            outlook?.status === 'ok' && outlook.rechargeToMonthEnd > 0
              ? `Recharging ${formatTaka(outlook.rechargeToMonthEnd, { decimals: 0 })} gets you to month end.`
              : undefined
          }
        />
      ) : null}
      <section className="readout" aria-label="Balance and runway">
        <BalanceHero balance={balance.data} refreshing={balance.status === 'loading'} onRefresh={meter.reload} />
        {outlook?.status === 'ok' ? (
          <Runway
            daysLeft={outlook.daysLeft}
            runOutDate={outlook.runOutDate}
            readingDate={reading}
            dailyTaka={outlook.dailyTaka}
            alertDays={settings.runwayDays}
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

      {daily.data || monthly.data ? (
        <Usage
          daily={dailyUsage}
          monthly={monthlyUsage}
          rechargeDates={rechargeDates}
          readingDate={reading}
          forecast={outlook}
        />
      ) : daily.status === 'loading' || monthly.status === 'loading' ? (
        <div className="skeleton skeleton--row" />
      ) : (
        <p className="inline-note">Usage history is unavailable right now. Try refreshing in a moment.</p>
      )}

      <div className="dash__lower">
        {recharges.data ? (
          <Recharges recharges={recharges.data} />
        ) : recharges.status === 'error' ? (
          <p className="inline-note">Recharge history is unavailable right now.</p>
        ) : (
          <div className="skeleton skeleton--row" />
        )}
        <AlertSettings settings={settings} onChange={setSettings} />
      </div>
    </div>
  )
}
