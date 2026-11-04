/*
 * Scheduled meter check. Reads each meter in PP_ACCOUNTS, applies the same alert
 * rules as the website, and sends a Telegram message for every meter that needs
 * attention (or for every meter when PP_SEND_SUMMARY=true).
 *
 * The repository is public, so nothing written to the log may identify a meter:
 * no account numbers, balances, tokens or message text.
 *
 *   node scripts/check-meters.ts            # what the workflow runs
 *   node scripts/check-meters.ts --dry-run  # local only: print messages instead of sending
 *
 * DESCO's server omits its intermediate certificate, so run with
 * NODE_EXTRA_CA_CERTS=scripts/certs/digicert-g2-intermediate.pem (the workflow does).
 */
import { evaluateAlert, parseAlertSettings } from '../src/lib/alerts.ts'
import { fetchBalance, fetchDaily, MeterApiError, normalizeAccount } from '../src/lib/api.ts'
import { dhakaToday, readingDate } from '../src/lib/dates.ts'
import { deriveDailyUsage } from '../src/lib/derive.ts'
import { forecast } from '../src/lib/forecast.ts'
import { buildReport } from '../src/lib/report.ts'

const SITE_URL = 'https://powerpulsebd.github.io/'
const RETRY_DELAY_MS = 30_000

const env = process.env
const dryRun = process.argv.includes('--dry-run')
if (dryRun && env.CI) {
  console.error('--dry-run prints private meter data and is disabled in CI.')
  process.exit(1)
}

const accounts = (env.PP_ACCOUNTS ?? '')
  .split(/[,\s]+/)
  .map((a) => normalizeAccount(a))
  .filter((a): a is string => a !== null)
const numberOrUndefined = (v: string | undefined) => (v ? Number(v) : undefined)
const settings = parseAlertSettings({
  thresholdTaka: numberOrUndefined(env.PP_THRESHOLD_TAKA),
  runwayDays: numberOrUndefined(env.PP_RUNWAY_DAYS),
})
const sendSummary = env.PP_SEND_SUMMARY === 'true'
const telegram = env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID ? { token: env.TELEGRAM_BOT_TOKEN, chat: env.TELEGRAM_CHAT_ID } : null

async function sendTelegram(text: string): Promise<void> {
  const response = await fetch(`https://api.telegram.org/bot${telegram!.token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: telegram!.chat, text, disable_web_page_preview: true }),
  })
  // Never echo the URL or body: the URL contains the bot token.
  if (!response.ok) throw new Error(`Telegram responded with HTTP ${response.status}`)
}

async function readMeter(account: string) {
  const today = dhakaToday()
  const { backend, balance } = await fetchBalance(account)
  const daily = await fetchDaily(account, backend, today).catch(() => [])
  const reading = readingDate(balance.readingTime)
  const outlook = forecast({
    balance: balance.balance,
    monthToDateTaka: balance.currentMonthConsumption,
    readingDate: reading,
    daily: deriveDailyUsage(daily),
  })
  const alert = evaluateAlert(
    {
      balance: balance.balance,
      daysLeft: outlook.status === 'ok' ? outlook.daysLeft : null,
      runOutDate: outlook.status === 'ok' ? outlook.runOutDate : null,
    },
    settings,
  )
  return { balance: balance.balance, reading, outlook, alert }
}

async function readWithRetry(account: string) {
  try {
    return await readMeter(account)
  } catch (error) {
    // DESCO is sometimes slow or down for a moment; an unknown account will not fix itself.
    if (error instanceof MeterApiError && error.kind === 'not-found') throw error
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
    return readMeter(account)
  }
}

async function main(): Promise<number> {
  if (accounts.length === 0) {
    console.log('PP_ACCOUNTS is not set; nothing to check.')
    return 0
  }
  if (!telegram && !dryRun) console.log('Telegram is not configured; alerts will be detected but not sent.')

  let failures = 0
  for (const [index, account] of accounts.entries()) {
    const label = `meter ${index + 1}/${accounts.length}`
    try {
      const meter = await readWithRetry(account)
      const shouldSend = meter.alert.level !== 'none' || sendSummary
      if (!shouldSend) {
        console.log(`${label}: no alert`)
        continue
      }
      const text = buildReport({
        account,
        balance: meter.balance,
        readingDate: meter.reading,
        outlook: meter.outlook,
        alert: meter.alert,
        siteUrl: SITE_URL,
      })
      if (dryRun) console.log(`--- ${label}\n${text}\n`)
      else if (telegram) {
        await sendTelegram(text)
        console.log(`${label}: ${meter.alert.level === 'none' ? 'summary' : meter.alert.level + ' alert'} sent`)
      } else console.log(`${label}: ${meter.alert.level === 'none' ? 'summary' : 'alert'} not sent (no Telegram)`)
    } catch (error) {
      failures++
      const kind = error instanceof MeterApiError ? error.kind : 'send-failed'
      console.log(`${label}: failed (${kind})`)
    }
  }
  return failures > 0 ? 1 : 0
}

process.exit(await main())
