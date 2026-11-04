/** Rounds a raw step up to 1, 2, 2.5 or 5 × 10ⁿ so axis ticks read cleanly. */
export function niceStep(raw: number): number {
  if (raw <= 0) return 1
  const power = 10 ** Math.floor(Math.log10(raw))
  const fraction = raw / power
  const nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10
  return nice * power
}

/** Evenly spaced ticks from 0 that cover `max` in about `count` steps. */
export function niceTicks(max: number, count = 4): number[] {
  const step = niceStep(max / count)
  const top = Math.max(step, Math.ceil(max / step) * step)
  return Array.from({ length: Math.round(top / step) + 1 }, (_, i) => Number((i * step).toFixed(10)))
}

/** Column path with a rounded data end and a square baseline. */
export function columnPath(x: number, y: number, width: number, baseline: number): string {
  const height = baseline - y
  if (height <= 0) return ''
  const r = Math.min(4, width / 2, height)
  return `M${x} ${baseline}V${y + r}Q${x} ${y} ${x + r} ${y}H${x + width - r}Q${x + width} ${y} ${x + width} ${y + r}V${baseline}Z`
}
