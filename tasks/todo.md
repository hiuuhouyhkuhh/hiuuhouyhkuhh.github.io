# PowerPulse BD — Tasks

## Task 1: Scaffold project
**Acceptance:** Vite React TS app builds; Vitest runs; tokens + fonts + base CSS in place.
**Verify:** `npm test`, `npm run typecheck`, `npm run build`
**Files:** package.json, vite.config.ts, tsconfig*, src/main.tsx, src/styles/*
- [x] done

## Task 2: Dates, formatting, derivations (TDD)
**Acceptance:** Dhaka "today", month math, ৳/kWh formatting; daily deltas from cumulative register and month-to-date taka (including month rollover and gaps); monthly records sorted.
**Verify:** `npm test -- src/lib`
**Files:** src/lib/dates.ts, format.ts, derive.ts (+ tests)
- [x] done

## Task 3: Forecast (TDD)
**Acceptance:** dailyBurn, daysLeft, runOutDate, projectedMonth, rechargeToMonthEnd; hidden with < 3 days.
**Verify:** `npm test -- src/lib/forecast`
**Files:** src/lib/forecast.ts (+ test)
- [x] done

## Task 4: API client (TDD)
**Acceptance:** typed endpoints; tries cached/unified/tkdes; maps 16001 → not found, network/timeout → retryable error; validates account format.
**Verify:** `npm test -- src/lib/api`
**Files:** src/lib/api.ts, types.ts (+ test)
- [x] done

## Checkpoint: Foundation — tests, types, build green

## Task 5: Account entry → balance hero (first E2E slice)
**Acceptance:** enter account, see balance/meter/reading time; loading + error states; account saved and switchable.
**Verify:** component tests; live run
**Files:** src/App.tsx, hooks/useMeterData.ts, hooks/useLocalStorage.ts, components/AccountEntry, components/BalanceHero
- [x] done

## Task 6: Runway gauge + forecast figures
**Acceptance:** runway ruler with run-out marker and threshold; figures row (month so far, avg/day, projected month, recharge to month end).
**Verify:** component tests; screenshot
**Files:** components/Runway, components/Figures
- [x] done

## Task 7: Daily usage chart
**Acceptance:** columns for ~30 days, kWh/৳ toggle, hover + keyboard tooltip, table view, recharge days marked.
**Verify:** component tests; screenshot
**Files:** components/UsageChart, components/DailyUsage
- [x] done

## Task 8: Monthly usage chart
**Acceptance:** 12 months + projected current month (distinct, labelled), same interactions.
**Verify:** component tests; screenshot
**Files:** components/MonthlyUsage
- [x] done

## Checkpoint: Core — live E2E, screenshots at 390/1440

## Task 9: Alerts
**Acceptance:** threshold (৳) + runway (<7 days) banner with icon + text; threshold persisted; opt-in Notification.
**Verify:** component tests
**Files:** components/AlertBanner, components/AlertSettings, lib/alerts.ts
- [x] done

## Task 10: Recharge history
**Acceptance:** list of recharges (date, amount, energy, VAT, status), copy token, empty state.
**Verify:** component tests
**Files:** components/Recharges
- [x] done

## Task 11: Theme, motion, responsive, a11y pass
**Acceptance:** theme toggle persisted; count-up/rise motion respects reduced motion; 320–1440px; keyboard focus visible.
**Verify:** screenshots both themes, tab-through
**Files:** components/ThemeToggle, styles/*
- [x] done

## Checkpoint: Complete — review + simplify

## Task 12: CI + deploy
**Acceptance:** Actions workflow runs lint/test/build and deploys to Pages; README; site live.
**Verify:** workflow green; https://powerpulsebd.github.io loads
**Files:** .github/workflows/deploy.yml, README.md
- [x] done

# v1.1 — Notifications everywhere

## Task 13: Service worker notifications + installable app
**Acceptance:** notifications go through the service worker when available, constructor as fallback; tapping focuses/opens the app; manifest + icons; iPhone guidance.
**Verify:** hook tests; production build serves /sw.js and /manifest.webmanifest; headless check that the worker registers.
**Files:** public/sw.js, public/manifest.webmanifest, public/icons/*, src/main.tsx, src/hooks/useAlertNotification.ts, src/components/Alerts/AlertSettings.tsx
- [ ] done

## Task 14: Scheduled Telegram meter check
**Acceptance:** script reuses src/lib, sends Telegram message per alerting meter, never logs sensitive data, exits cleanly when unconfigured.
**Verify:** report unit tests; local dry run against the live API; workflow run green.
**Files:** src/lib/report.ts (+test), scripts/check-meters.ts, .github/workflows/meter-check.yml, README.md
- [ ] done
