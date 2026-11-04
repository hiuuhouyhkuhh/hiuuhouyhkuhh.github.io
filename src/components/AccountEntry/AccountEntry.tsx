import { useId, useState, type FormEvent } from 'react'
import { normalizeAccount } from '../../lib/api'
import './AccountEntry.css'

interface AccountEntryProps {
  onSubmit: (account: string) => void
  /** Error from a lookup that already failed (e.g. unknown account). */
  error?: string
  initialValue?: string
}

export function AccountEntry({ onSubmit, error, initialValue = '' }: AccountEntryProps) {
  const id = useId()
  const [value, setValue] = useState(initialValue)
  const [localError, setLocalError] = useState<string>()
  const message = localError ?? error

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const account = normalizeAccount(value)
    if (!account) {
      setLocalError('Enter the 6–12 digit account number printed on your bill.')
      return
    }
    setLocalError(undefined)
    onSubmit(account)
  }

  return (
    <form className="entry" onSubmit={handleSubmit} noValidate>
      <label className="entry__label label" htmlFor={`${id}-account`}>
        DESCO prepaid account number
      </label>
      <div className="entry__field" data-invalid={message ? '' : undefined}>
        <input
          id={`${id}-account`}
          className="entry__input mono"
          inputMode="numeric"
          autoComplete="off"
          spellCheck={false}
          placeholder="00000000"
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setLocalError(undefined)
          }}
          aria-invalid={message ? 'true' : 'false'}
          aria-describedby={message ? `${id}-error ${id}-hint` : `${id}-hint`}
        />
        <button className="entry__submit" type="submit">
          Read meter
          <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16">
            <path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.75" />
          </svg>
        </button>
      </div>
      {message ? (
        <p id={`${id}-error`} className="entry__error" role="alert">
          {message}
        </p>
      ) : null}
      <p id={`${id}-hint`} className="entry__hint">
        Printed on your bill and recharge receipt. It stays on this device.
      </p>
    </form>
  )
}
