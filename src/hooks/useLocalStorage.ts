import { useCallback, useState } from 'react'

/** Turns whatever was stored into a valid value, or `undefined` to use the fallback. */
export type Parse<T> = (raw: unknown) => T | undefined

function read<T>(key: string, fallback: T, parse?: Parse<T>): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    const value: unknown = JSON.parse(raw)
    return (parse ? parse(value) : (value as T)) ?? fallback
  } catch {
    return fallback
  }
}

export function useLocalStorage<T>(key: string, fallback: T, parse?: Parse<T>) {
  const [value, setValue] = useState<T>(() => read(key, fallback, parse))

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = next instanceof Function ? next(prev) : next
        try {
          localStorage.setItem(key, JSON.stringify(resolved))
        } catch {
          // Private mode or full storage: keep working in memory.
        }
        return resolved
      })
    },
    [key],
  )

  return [value, update] as const
}
