import { useEffect, useId, useRef, useState } from 'react'

interface AccountMenuProps {
  active: string
  accounts: string[]
  onSwitch: (account: string) => void
  onForget: (account: string) => void
  onAdd: () => void
}

export function AccountMenu({ active, accounts, onSwitch, onForget, onAdd }: AccountMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const id = useId()

  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const choose = (fn: () => void) => () => {
    setOpen(false)
    fn()
  }

  return (
    <div className="accounts" ref={rootRef}>
      <button
        type="button"
        className="accounts__toggle"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="label">Account</span>
        <span className="mono">{active}</span>
        <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
          <path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>
      {open ? (
        <div className="accounts__panel" id={id}>
          <ul>
            {accounts.map((account) => (
              <li key={account} className="accounts__row">
                <button
                  type="button"
                  className="accounts__pick mono"
                  aria-current={account === active ? 'true' : undefined}
                  onClick={choose(() => onSwitch(account))}
                >
                  {account}
                </button>
                <button
                  type="button"
                  className="accounts__forget"
                  aria-label={`Forget account ${account}`}
                  onClick={choose(() => onForget(account))}
                >
                  <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
                    <path d="M3 3l6 6M9 3 3 9" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="accounts__add" onClick={choose(onAdd)}>
            + Add another meter
          </button>
        </div>
      ) : null}
    </div>
  )
}
