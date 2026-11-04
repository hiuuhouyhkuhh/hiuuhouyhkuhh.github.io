# Implementation Plan: PowerPulse BD v1

## Overview

A static Vite + React + TypeScript dashboard for DESCO prepaid meters, deployed to
GitHub Pages. Pure logic (API client, derivations, forecast) is built and tested first
because every screen depends on it; the UI is then added in vertical slices, each one
usable end-to-end against the live API.

## Architecture Decisions

- **No backend.** The DESCO API allows CORS from any origin, so the browser calls it
  directly. Keeps hosting free and removes a whole failure surface.
- **Hand-built SVG charts.** Two chart forms (columns over time) don't justify a chart
  library, and custom SVG is what makes the instrument-panel look possible.
- **One data hook.** `useMeterData(account)` resolves the backend once, then loads balance,
  daily, monthly and recharges in parallel; components only render.
- **Backend resolution is cached per account** in `localStorage` so repeat visits make
  one request per endpoint instead of two.
- **Design tokens in CSS custom properties**, dark default + light, switched by
  `data-theme` with `prefers-color-scheme` as the initial value.

## Dependency Graph

```
dates / format helpers
      │
      ├── API client (types, fetch, backend fallback, error mapping)
      │        │
      │        └── derivations (daily deltas, monthly ordering) ── forecast
      │                                                              │
      └──────────────── useMeterData hook ◄──────────────────────────┘
                              │
            ┌─────────────────┼──────────────────┬───────────────┐
       AccountEntry     BalanceHero+Runway   Daily/Monthly    Recharges
                              │               charts
                          AlertBanner
```

## Task List

### Phase 1: Foundation
- [x] Task 1: Scaffold project (Vite/React/TS, Vitest, oxlint, tokens, fonts, base CSS)
- [x] Task 2: Date + format helpers and derivations, test-first
- [x] Task 3: Forecast model, test-first
- [x] Task 4: API client with backend fallback and error mapping, test-first

### Checkpoint: Foundation
- [x] `npm test`, `npm run typecheck`, `npm run build` pass

### Phase 2: Core slices
- [x] Task 5: Account entry + saved accounts + `useMeterData` → balance hero (first end-to-end slice)
- [x] Task 6: Runway gauge + forecast figures
- [x] Task 7: Daily usage chart (kWh/৳ toggle, tooltip, table view)
- [x] Task 8: Monthly usage chart with projected current month

### Checkpoint: Core
- [x] Live account renders end-to-end; screenshot review at 390px and 1440px

### Phase 3: Alerts, history, polish
- [x] Task 9: Alert threshold settings + banner + opt-in browser notification
- [x] Task 10: Recharge history with token copy
- [x] Task 11: Theme toggle, motion, responsive + accessibility pass

### Checkpoint: Complete
- [x] All success criteria in SPEC.md
- [x] Code review + simplification pass

### Phase 4: Ship
- [x] Task 12: GitHub Actions CI + Pages deploy, README, go live

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| DESCO API changes shape or blocks CORS | High | Typed parsing with defensive defaults; clear error state; client isolated in one module |
| API slow / flaky | Med | 15s timeout, retry button, hold previous render on refetch |
| Daily data lags or has gaps | Med | Derivations skip non-consecutive gaps; forecast needs ≥3 days, else hidden with reason |
| "Looks AI-generated" | Med | Design direction in SPEC; screenshot review at checkpoints against the AI-aesthetic list |
| TypeScript 7 / Vite 8 tooling quirks | Low | Use the official create-vite template versions |

## Open Questions
- None blocking v1 (see SPEC.md deferred list).
