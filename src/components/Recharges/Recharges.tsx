import { useState } from 'react'
import { formatDay, formatTaka } from '../../lib/format'
import type { RechargeRecord } from '../../lib/types'
import './Recharges.css'

interface RechargesProps {
  recharges: RechargeRecord[]
}

const INITIAL_ROWS = 5

/** "Demand Charge-All" → "Demand charge", "Meter Rent-1P" → "Meter rent". */
export function chargeName(raw: string): string {
  const base = raw.split('-')[0]!.trim().toLowerCase()
  return base.charAt(0).toUpperCase() + base.slice(1)
}

const groupToken = (token: string) => token.replace(/(\d{4})(?=\d)/g, '$1 ')

function CopyToken({ token, label }: { token: string; label: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      className="recharge__copy"
      aria-label={copied ? 'Token copied' : `Copy token for ${label}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(token)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        } catch {
          // Clipboard blocked: the token is still selectable on screen.
        }
      }}
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

export function Recharges({ recharges }: RechargesProps) {
  const [expanded, setExpanded] = useState(false)
  const rows = expanded ? recharges : recharges.slice(0, INITIAL_ROWS)
  const total = recharges.reduce((sum, r) => sum + r.totalAmount, 0)

  return (
    <section className="recharges" aria-labelledby="recharges-title">
      <div className="section-head">
        <div>
          <h2 id="recharges-title">Recharges</h2>
          <p>
            {recharges.length > 0
              ? `${recharges.length} in the last 12 months · ${formatTaka(total, { decimals: 0 })} in total`
              : 'Nothing in the last 12 months.'}
          </p>
        </div>
      </div>

      {recharges.length > 0 ? (
        <ol className="recharges__list">
          {rows.map((r) => {
            const date = r.rechargeDate.slice(0, 10)
            const label = formatDay(date, { year: true })
            const ok = r.orderStatus.toLowerCase() === 'successful'
            return (
              <li key={r.orderID} className="recharge">
                <div className="recharge__when">
                  <span className="recharge__date">{formatDay(date)}</span>
                  <span className="recharge__time mono">
                    {date.slice(0, 4)} · {r.rechargeDate.slice(11, 16)}
                  </span>
                </div>
                <div className="recharge__main">
                  <p className="recharge__amount">
                    {formatTaka(r.totalAmount, { decimals: r.totalAmount % 1 ? 2 : 0 })}
                    {!ok ? <span className="recharge__status">{r.orderStatus || 'Pending'}</span> : null}
                  </p>
                  <p className="recharge__split">
                    <span>Energy {formatTaka(r.energyAmount)}</span>
                    {r.chargeItems.map((c) => (
                      <span key={c.chargeItemName}>
                        {chargeName(c.chargeItemName)} {formatTaka(c.chargeAmount, { decimals: 0 })}
                      </span>
                    ))}
                    <span>VAT {formatTaka(r.VAT)}</span>
                    {r.rebate ? <span>Rebate {formatTaka(Math.abs(r.rebate))}</span> : null}
                  </p>
                  {r.tokenNo ? (
                    <p className="recharge__token">
                      <span className="visually-hidden">Token </span>
                      <span className="mono">{groupToken(r.tokenNo)}</span>
                      <CopyToken token={r.tokenNo} label={label} />
                    </p>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ol>
      ) : null}

      {recharges.length > INITIAL_ROWS ? (
        <button type="button" className="button recharges__more" onClick={() => setExpanded((e) => !e)}>
          {expanded ? 'Show fewer' : `Show all ${recharges.length}`}
        </button>
      ) : null}
    </section>
  )
}
