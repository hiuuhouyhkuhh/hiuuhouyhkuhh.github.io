import { useCallback, useState } from 'react'

/**
 * Measures an element's width so SVG charts can draw in real pixels. Uses a
 * callback ref so it keeps working when the element is swapped out and back.
 */
export function useElementWidth<T extends HTMLElement>(fallback = 640) {
  const [width, setWidth] = useState(fallback)

  const ref = useCallback((el: T | null) => {
    if (!el || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(([entry]) => {
      if (entry && entry.contentRect.width > 0) setWidth(Math.round(entry.contentRect.width))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return [ref, width] as const
}
