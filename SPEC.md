# Spec: PowerPulse BD

## Objective

PowerPulse BD is a fast, good-looking dashboard for DESCO prepaid electricity
meters. A user types their account number and immediately sees how much money is
left on the meter, how fast they are spending it, when it will run out, and how
their usage has moved over the last year.

**User:** a DESCO prepaid customer in Dhaka who today checks the balance through
the official portal or SMS and has no sense of trend or runway.

**User stories**

1. As a customer, I enter my account number once and the site remembers it.
2. I see my current balance, the meter number and when it was last read.
3. I see how many days my balance will last and the date it is expected to run out.
4. I see what this month is likely to cost and how much I should recharge to get to month end.
5. I see a chart of my daily usage for the last ~30 days (kWh or ৳, one at a time).
6. I see a chart of my monthly usage for the last 12 months, with the current month projected.
7. I see my recharge history, and can copy a recharge token.
8. I set a low-balance alert threshold; the dashboard warns me (and optionally sends a
   browser notification) whenever my balance or runway falls below it.
9. I can switch between several saved accounts (home, shop, parents).

**Assumptions (surfaced, not asked — the user pre-approved proceeding without interruption)**

1. Static site on GitHub Pages at `https://powerpulsebd.github.io`; no backend.
2. Data comes straight from the browser to `https://prepaid.desco.org.bd/api`
   (verified: `Access-Control-Allow-Origin: *`, preflight allows `GET`).
3. Alerts are in-page plus opt-in browser notifications, shown through a service worker so
   they work on Android and on iPhone when PowerPulse is added to the Home Screen.
   Alerts while the site is closed come from a scheduled GitHub Action (v1.1, below).
4. English UI with a Bangla tagline; full Bangla localisation is a later feature.
5. Only the account number is stored, in `localStorage` on the user's device.
6. Customer personal info (`getCustomerInfo`: name, phone, address) is **not** fetched —
   the dashboard does not need it.

## Observed API behaviour (verified 2026-11-04, beyond the community README)

| Endpoint | Behaviour |
|---|---|
| all | Two backends: `unified` and `tkdes`. A wrong backend returns `code 200, data null` or `code 16001`. |
| `getBalance` | `currentMonthConsumption` is **taka spent this month**. `readingTime` is `YYYY-MM-DD HH:mm:ss` (Dhaka). |
| `getCustomerDailyConsumption` | Only ~32 most recent days retained. `consumedUnit` is the **cumulative meter register** (kWh). `consumedTaka` is **month-to-date** cost and resets on the 1st. Latest record lags 1–2 days. |
| `getCustomerMonthlyConsumption` | Range ≤ 12 months (`16005` otherwise). Records are **unordered**; the current month is absent. Fields per month are actual kWh / ৳. |
| `getRechargeHistory` | Range ≤ 12 months (`908` otherwise). Newest first. |

Derived daily values:
- `kWh[d] = register[d] − register[d−1]`
- `taka[d] = mtd[d] − mtd[d−1]` within a month; `taka[d] = mtd[d]` on the 1st.

## Forecast model (v1, deliberately simple)

- `dailyBurn` = mean taka/day over the last 14 derived days (or all available, min 3).
- `daysLeft` = `balance / dailyBurn`; `runOutDate` = reading date + `daysLeft`.
- `projectedMonth` = `currentMonthConsumption + dailyBurn × daysRemainingInMonth`.
- `rechargeToMonthEnd` = `max(0, dailyBurn × daysRemainingInMonth − balance)`, rounded up to ৳50.
- With fewer than 3 days of data, forecasts are hidden and the UI says why.

## Tech Stack

- Vite 8, React 19, TypeScript (strict)
- Plain CSS with custom properties (design tokens); no UI or chart library — charts are hand-built SVG
- Fonts: Instrument Sans (UI + figures), JetBrains Mono (labels, ticks, tokens), Hind Siliguri (Bangla) via `@fontsource`
- Vitest + Testing Library + jsdom; oxlint for linting
- GitHub Actions → GitHub Pages

## Commands

```
Install: npm ci
Dev:     npm run dev
Test:    npm test            (vitest run)
Watch:   npm run test:watch
Lint:    npm run lint        (oxlint)
Types:   npm run typecheck
Build:   npm run build       (typecheck + vite build → dist/)
Preview: npm run preview
```

## Project Structure

```
src/lib/          → pure logic: API client, derivations, forecast, dates, formatting (unit-tested)
src/hooks/        → data + persistence hooks (useMeterData, useLocalStorage)
src/components/   → UI components, one folder per component (Component.tsx + .css + .test.tsx)
src/styles/       → tokens.css (design tokens), base.css
tasks/            → plan.md, todo.md
.github/workflows → deploy.yml
```

## Code Style

```ts
// Pure, typed, small. Names say what the value is, including its unit.
export function deriveDailyUsage(records: DailyRecord[]): DailyUsage[] {
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
  return sorted.slice(1).map((day, i) => {
    const prev = sorted[i];
    const newMonth = day.date.slice(0, 7) !== prev.date.slice(0, 7);
    return {
      date: day.date,
      kwh: round(day.consumedUnit - prev.consumedUnit, 3),
      taka: round(newMonth ? day.consumedTaka : day.consumedTaka - prev.consumedTaka, 2),
    };
  });
}
```

- Components are function components; data fetching lives in hooks, rendering in components.
- API strings (anything from the network) are rendered as text, never as HTML.
- Units in names where ambiguous: `kwh`, `taka`, `days`.

## Design Direction

"Instrument panel" — the site should feel like a precise piece of metering hardware,
not a template.

- Warm graphite (dark, default) and warm paper (light) surfaces; one sodium-amber accent
  (dark `#cf7d24`, light `#c4661a`) and one cool hue for recharge events
  (dark `#3f86c9`, light `#2f6fae`) — validated with the dataviz palette validator.
- Hairline rules and tick marks instead of boxed cards; content-first asymmetric layout.
- Hero: the balance as one large figure, beside a **runway gauge** — a ruler of days with
  the projected run-out marker and the alert threshold.
- Charts: thin columns with 4px caps, hairline grid, crosshair/tooltip on hover and focus,
  a table-view toggle for each chart, one measure per axis.
- Motion: numbers count up, columns rise, the runway marker slides in — all disabled
  under `prefers-reduced-motion`.
- Avoid: purple/indigo, glassmorphism, big gradients, rounded-2xl card grids, emoji icons.

## Testing Strategy

- **Unit (Vitest):** every function in `src/lib` — derivations, forecast, date helpers,
  API client (with mocked `fetch`, including backend fallback and error codes).
- **Component (Testing Library):** account entry validation, dashboard states
  (loading, error, empty, success), alert banner thresholds, chart table view.
- **Runtime:** production build screenshotted in headless Edge at 390px and 1440px,
  both themes, against the live API.
- Tests live next to the code (`*.test.ts(x)`).

## Boundaries

- **Always:** run tests + typecheck + build before each commit; keep commits atomic with
  conventional messages; render API data as text; respect reduced motion.
- **Ask first:** adding a backend, collecting any data off-device, adding analytics.
- **Never:** commit secrets; fetch or display customer personal info; enumerate or
  guess account numbers.

## Success Criteria

- [ ] Entering a valid account shows balance, runway, forecast, daily + monthly charts and recharges, using whichever backend serves it.
- [ ] Invalid / unknown accounts show a clear inline error, never a blank screen.
- [ ] Alert banner appears when balance < threshold or days left < 7; threshold persists.
- [ ] Every chart has hover + keyboard tooltips and a table view.
- [ ] Works at 320, 768, 1024, 1440px; both themes; no console errors.
- [ ] Lighthouse-style basics: semantic headings, labelled inputs, visible focus.
- [ ] `npm test`, `npm run typecheck`, `npm run lint`, `npm run build` all pass in CI.
- [ ] Site live at https://powerpulsebd.github.io.

## v1.1: Notifications everywhere

**Service worker + installable app**
- `public/sw.js` shows notifications (`registration.showNotification`) and focuses or opens
  PowerPulse when one is tapped. It does not cache anything, so deploys are never stale.
- A web app manifest and PNG icons make PowerPulse installable (Android, iPhone Home Screen).
- On iPhone outside the Home Screen app, the settings explain how to enable notifications.

**Scheduled meter check (owner alerts)**
- `.github/workflows/meter-check.yml` runs daily at 09:00 Dhaka and on demand.
- `scripts/check-meters.ts` reuses `src/lib` (API client, derivation, forecast, alert rules)
  and sends a Telegram message when an alert is active (or always, when run manually with
  "send summary").
- Configuration lives in repository secrets: `PP_ACCOUNTS` (comma-separated),
  `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`; optional variables `PP_THRESHOLD_TAKA`,
  `PP_RUNWAY_DAYS`. Missing Telegram secrets → the job logs that and exits cleanly.
- The repository is public, so **logs never contain account numbers, balances or tokens**.
- Telegram messages show the account as `••••1234`.

**Success criteria**
- [ ] Enabling notifications on Android Chrome shows a notification when an alert is active.
- [ ] Tapping a notification opens or focuses PowerPulse.
- [ ] `node scripts/check-meters.ts` runs locally with Node 24 and no build step.
- [ ] The scheduled job sends one Telegram message per alerting meter and logs nothing sensitive.

## Open Questions (deferred, not blocking)

- Web push for every visitor (needs a backend to hold push subscriptions).
- Full Bangla UI and Bangla numerals.
- Smarter forecasting (weekday/seasonal patterns, tariff slabs).
