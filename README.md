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
