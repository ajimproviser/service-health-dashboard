import { useEffect, useState } from 'react'
import type { Administration } from '../types'

export const DISABLE_CONFIRMATION =
  'Disable this service? Incoming API requests will be rejected until it is enabled again.'

interface AdminPanelProps {
  /** null means the real state could not be read, so no action is offered. */
  administration: Administration | null
  onSetEnabled: (enabled: boolean) => Promise<Administration>
}

export function AdminPanel({ administration, onSetEnabled }: AdminPanelProps) {
  const [enabled, setEnabled] = useState<boolean | null>(administration?.serviceEnabled ?? null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setEnabled(administration?.serviceEnabled ?? null)
  }, [administration])

  const unknown = enabled === null

  async function toggle() {
    if (enabled === null || busy) return
    const next = !enabled
    // Disabling is the risky direction, so it needs an explicit confirmation.
    if (!next && !window.confirm(DISABLE_CONFIRMATION)) return

    setBusy(true)
    setError('')
    try {
      const result = await onSetEnabled(next)
      setEnabled(result.serviceEnabled)
    } catch {
      setError('Could not change the service state. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const statusText = unknown ? '⚪ Service state unknown' : enabled ? '🟢 Service enabled' : '🔴 Service disabled'
  const buttonText = busy ? 'Please wait...' : unknown ? 'Unavailable' : enabled ? 'Disable service' : 'Enable service'
  const buttonClass = unknown ? 'btn btn--muted' : enabled ? 'btn btn--danger' : 'btn btn--success'

  return (
    <section className="panel" aria-label="Administration">
      <h3>Administration</h3>
      <p className="admin__status">{statusText}</p>
      <button type="button" className={buttonClass} disabled={unknown || busy} onClick={toggle}>
        {buttonText}
      </button>
      {unknown && (
        <p className="admin__error" role="alert">
          Could not read the current service state. Please refresh the page.
        </p>
      )}
      {error && (
        <p className="admin__error" role="alert">
          {error}
        </p>
      )}
    </section>
  )
}
