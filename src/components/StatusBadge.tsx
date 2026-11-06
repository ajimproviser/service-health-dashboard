import type { HealthStatus } from '../types'

const LABELS: Record<HealthStatus, string> = {
  healthy: 'Healthy',
  warning: 'Warning',
  unhealthy: 'Unhealthy',
  unknown: 'Unknown',
}

interface StatusBadgeProps {
  status: HealthStatus
  /** What the status describes, e.g. "Pods" or "Availability". */
  label?: string
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <span className={`badge badge--${status}`} title={label ? `${label}: ${LABELS[status]}` : LABELS[status]}>
      {label ? `${label}: ` : ''}
      {LABELS[status]}
    </span>
  )
}
