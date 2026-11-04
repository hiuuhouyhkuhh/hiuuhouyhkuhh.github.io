# PowerPulse BD

**Your DESCO prepaid meter, at a glance.** → [powerpulsebd.github.io](https://powerpulsebd.github.io)

Type your DESCO prepaid account number and see:

- **Balance** on the meter, with meter number and last reading time
- **Runway** — how many days the balance lasts at your current usage, the likely run-out date, and how that compares with month end
- **Forecast** — this month's projected cost against last month, and how much to recharge to reach month end
- **Usage** — day-by-day for the last month and month-by-month for the year, in kWh or taka, with keyboard-readable tooltips and a table view
- **Recharges** — the last 12 months with the energy / fixed charge / VAT breakdown and one-click token copy
- **Alerts** — a banner (and optional browser notification) when the balance drops below your limit or the runway gets short

Several meters can be saved and switched from the header. Links like `?account=12345678` open a meter directly.

## Notifications

**On the website.** Turn on *Browser notification* under Alerts. Whenever you open PowerPulse and
an alert is active, you get one notification per meter per day. It works in desktop browsers and
Android Chrome; on iPhone, add PowerPulse to the Home Screen first (Share → Add to Home Screen) and
enable it from the installed app.

**Daily Telegram alerts, even when nothing is open.** The *Meter check* workflow runs every day at
09:00 Dhaka time, applies the same alert rules and sends a Telegram message for any meter that needs
attention. To set it up for your own meters:

1. In Telegram, message [@BotFather](https://t.me/BotFather), send `/newbot` and copy the **bot token**.
2. Send any message to your new bot, then open
   `https://api.telegram.org/bot<TOKEN>/getUpdates` in a browser and copy `"chat":{"id": …}` — that is your **chat ID**.
3. In the repository: *Settings → Secrets and variables → Actions*, add these **secrets**:
   - `PP_ACCOUNTS` — your account number(s), comma-separated
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`
4. Optional **variables**: `PP_THRESHOLD_TAKA` (default 200) and `PP_RUNWAY_DAYS` (default 7).
5. *Actions → Meter check → Run workflow* with **Send a message for every meter** ticked to test it.

The repository is public, so the job never writes account numbers, balances or tokens to its logs.
GitHub pauses scheduled workflows after 60 days without commits; re-enable it from the Actions tab
if that happens.

## Privacy

There is no backend. Your browser talks directly to DESCO's public prepaid service at
`prepaid.desco.org.bd`. Account numbers and alert settings are kept in your browser's
local storage and never leave your device. PowerPulse BD does not request customer
personal details (name, phone, address).

PowerPulse BD is an independent project and is not affiliated with DESCO.

## Development

Requires Node 24.

```bash
npm ci
npm run dev        # http://localhost:5173
npm test           # unit + component tests (Vitest)
npm run lint       # oxlint
npm run typecheck
npm run build      # production build in dist/

# Scheduled meter check, locally (prints messages instead of sending them)
NODE_EXTRA_CA_CERTS=scripts/certs/digicert-g2-intermediate.pem   PP_ACCOUNTS=12345678 PP_SEND_SUMMARY=true node scripts/check-meters.ts --dry-run
```

Pushing to `main` runs lint, tests and the build, then deploys `dist/` to GitHub Pages.

## How it works

- `src/lib/api.ts` — DESCO client. Each account lives on one of two backends (`unified`
  or `tkdes`); the client finds the right one and caches it per account.
- `src/lib/derive.ts` — DESCO's daily feed reports a cumulative kWh register and a
  month-to-date taka total; per-day usage is derived by differencing consecutive days.
- `src/lib/forecast.ts` — runway and month-end projection from the mean of the last 14 days.
- `src/lib/alerts.ts` — alert rules.
- `src/components/` — UI, including a hand-built accessible SVG column chart.

The full specification, including observed API behaviour, is in [SPEC.md](SPEC.md).
