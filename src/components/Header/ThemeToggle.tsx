import { useEffect } from 'react'
import { useLocalStorage } from '../../hooks/useLocalStorage'

type Theme = 'dark' | 'light'

function systemTheme(): Theme {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark'
}

export function ThemeToggle() {
  const [stored, setStored] = useLocalStorage<Theme | null>('pp:theme', null, (raw) =>
    raw === 'light' || raw === 'dark' ? raw : null,
  )
  const theme = stored ?? systemTheme()
  const next: Theme = theme === 'dark' ? 'light' : 'dark'

  useEffect(() => {
    if (stored) document.documentElement.dataset.theme = stored
  }, [stored])

  return (
    <button
      type="button"
      className="icon-button"
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      onClick={() => setStored(next)}
    >
      {theme === 'dark' ? (
        <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
          <circle cx="10" cy="10" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M10 1.5v2.5M10 16v2.5M1.5 10H4M16 10h2.5M4 4l1.8 1.8M14.2 14.2 16 16M4 16l1.8-1.8M14.2 5.8 16 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
          <path d="M16.5 12.5A7 7 0 0 1 7.5 3.5a7 7 0 1 0 9 9Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      )}
    </button>
  )
}
