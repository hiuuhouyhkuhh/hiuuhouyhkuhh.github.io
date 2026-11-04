import { useEffect, useRef, useState } from 'react'

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia !== 'function' || window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Eases a number from its previous value to `target`. Instant under reduced motion. */
export function useCountUp(target: number, durationMs = 900): number {
  const [value, setValue] = useState(0)
  const shown = useRef(0)
  const reduced = prefersReducedMotion()

  useEffect(() => {
    if (prefersReducedMotion()) return
    const from = shown.current
    const start = performance.now()
    const handle = { frame: 0 }
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      shown.current = from + (target - from) * (1 - (1 - t) ** 4)
      setValue(shown.current)
      if (t < 1) handle.frame = requestAnimationFrame(tick)
    }
    handle.frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(handle.frame)
  }, [target, durationMs])

  return reduced ? target : value
}
