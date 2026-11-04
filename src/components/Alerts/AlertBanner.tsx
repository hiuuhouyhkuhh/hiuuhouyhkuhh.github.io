import type { Alert } from '../../lib/alerts'
import './Alerts.css'

interface AlertBannerProps {
  alert: Alert
  suggestion?: string
}

export function AlertBanner({ alert, suggestion }: AlertBannerProps) {
  if (alert.level === 'none') return null
  return (
    <div className="alert" data-level={alert.level} role={alert.level === 'critical' ? 'alert' : 'status'}>
      <svg className="alert__icon" viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
        <path d="M10 2.5 18.5 17h-17z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M10 8v4.25M10 14.4v.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      <div className="alert__body">
        <p className="alert__title">
          <span className="visually-hidden">{alert.level === 'critical' ? 'Urgent: ' : 'Heads up: '}</span>
          {alert.title}
        </p>
        <p className="alert__detail">
          {alert.detail}
          {suggestion ? ` ${suggestion}` : ''}
        </p>
      </div>
      <a className="alert__link" href="#alerts">
        Alert settings
      </a>
    </div>
  )
}
