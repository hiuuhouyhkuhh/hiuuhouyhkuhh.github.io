import { useId, useState, type Dispatch, type SetStateAction } from 'react'
import type { AlertSettings as Settings } from '../../lib/alerts'
import './Alerts.css'

interface AlertSettingsProps {
  settings: Settings
  onChange: Dispatch<SetStateAction<Settings>>
}

const RUNWAY_OPTIONS = [3, 5, 7, 10, 14]

const notificationsSupported = () => typeof window !== 'undefined' && 'Notification' in window

/** iPhone Safari only offers notifications once PowerPulse is opened from the Home Screen. */
function needsHomeScreen(): boolean {
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const standalone =
    (typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches) ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  return ios && !standalone
}

export function AlertSettings({ settings, onChange }: AlertSettingsProps) {
  const id = useId()
  const [threshold, setThreshold] = useState(String(settings.thresholdTaka))
  const [permission, setPermission] = useState(() =>
    notificationsSupported() ? Notification.permission : 'unsupported',
  )

  async function toggleNotify(enabled: boolean) {
    if (!enabled) return onChange((prev) => ({ ...prev, notify: false }))
    if (!notificationsSupported()) return
    const result = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission
    setPermission(result)
    // Settings may have changed while the permission prompt was open.
    onChange((prev) => ({ ...prev, notify: result === 'granted' }))
  }

  return (
    <section className="alert-settings" id="alerts" aria-labelledby={`${id}-title`}>
      <div className="section-head">
        <div>
          <h2 id={`${id}-title`}>Alerts</h2>
          <p>Checked every time you open PowerPulse.</p>
        </div>
      </div>

      <div className="alert-settings__fields">
        <label className="field" htmlFor={`${id}-threshold`}>
          <span className="label">Warn me when the balance is below</span>
          <span className="field__input">
            <span className="field__affix" aria-hidden="true">
              ৳
            </span>
            <input
              id={`${id}-threshold`}
              type="number"
              inputMode="numeric"
              min={0}
              step={50}
              value={threshold}
              onChange={(e) => {
                setThreshold(e.target.value)
                const value = Number(e.target.value)
                if (e.target.value !== '' && Number.isFinite(value) && value >= 0) {
                  onChange({ ...settings, thresholdTaka: value })
                }
              }}
            />
          </span>
        </label>

        <label className="field" htmlFor={`${id}-runway`}>
          <span className="label">Or when fewer days are left than</span>
          <span className="field__input">
            <select
              id={`${id}-runway`}
              value={settings.runwayDays}
              onChange={(e) => onChange({ ...settings, runwayDays: Number(e.target.value) })}
            >
              {RUNWAY_OPTIONS.map((days) => (
                <option key={days} value={days}>
                  {days} days
                </option>
              ))}
            </select>
          </span>
        </label>

        <div className="field">
          <label className="switch" htmlFor={`${id}-notify`}>
            <input
              id={`${id}-notify`}
              type="checkbox"
              role="switch"
              checked={settings.notify && permission === 'granted'}
              disabled={permission === 'unsupported' || permission === 'denied'}
              onChange={(e) => void toggleNotify(e.target.checked)}
            />
            <span className="switch__track" aria-hidden="true" />
            Browser notification
          </label>
          <p className="field__note">
            {permission === 'denied'
              ? 'Notifications are blocked for this site in your browser settings.'
              : permission === 'unsupported'
                ? needsHomeScreen()
                  ? 'On iPhone, tap Share → Add to Home Screen, then open PowerPulse from there to turn this on.'
                  : 'This browser does not support notifications.'
                : 'Shown when you open PowerPulse and an alert is active, at most once a day per meter.'}
          </p>
        </div>
      </div>
    </section>
  )
}
