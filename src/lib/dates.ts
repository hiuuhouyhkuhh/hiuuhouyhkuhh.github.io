/*
 * Calendar helpers on plain `YYYY-MM-DD` / `YYYY-MM` strings. Dates are calendar
 * days in Dhaka; arithmetic is done in UTC so local time zones never shift them.
 */

const dhakaDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Dhaka',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const DAY_MS = 86_400_000

export function dhakaToday(now: Date = new Date()): string {
  return dhakaDate.format(now)
}

function toUtc(isoDate: string): number {
  const [y, m, d] = isoDate.split('-').map(Number)
  return Date.UTC(y!, m! - 1, d ?? 1)
}

function fromUtc(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10)
}

export function addDays(isoDate: string, days: number): string {
  return fromUtc(toUtc(isoDate) + days * DAY_MS)
}

export function daysBetween(from: string, to: string): number {
  return Math.round((toUtc(to) - toUtc(from)) / DAY_MS)
}

export function addMonths(month: string, months: number): string {
  const [y, m] = month.split('-').map(Number)
  const total = y! * 12 + (m! - 1) + months
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`
}

export function daysInMonth(month: string): number {
  const [y, m] = month.split('-').map(Number)
  return new Date(Date.UTC(y!, m!, 0)).getUTCDate()
}

export function monthOf(isoDate: string): string {
  return isoDate.slice(0, 7)
}

/** DESCO timestamps look like `2026-11-04 00:00:00`. */
export function readingDate(timestamp: string): string {
  return timestamp.slice(0, 10)
}
