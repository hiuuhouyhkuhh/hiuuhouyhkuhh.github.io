import { Component, type ReactNode } from 'react'

interface State {
  failed: boolean
}

function resetSavedData() {
  Object.keys(localStorage)
    .filter((key) => key.startsWith('pp:'))
    .forEach((key) => localStorage.removeItem(key))
  window.location.assign(window.location.pathname)
}

/** Last line of defence: a readable recovery screen instead of a blank page. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <main className="page">
        <section className="panel-error" role="alert">
          <h1>Something went wrong</h1>
          <p>PowerPulse hit an unexpected problem. Reloading usually fixes it.</p>
          <div style={{ display: 'flex', gap: 'var(--s-3)' }}>
            <button type="button" className="button button--accent" onClick={() => window.location.reload()}>
              Reload
            </button>
            <button type="button" className="button" onClick={resetSavedData}>
              Reset saved accounts and settings
            </button>
          </div>
        </section>
      </main>
    )
  }
}
