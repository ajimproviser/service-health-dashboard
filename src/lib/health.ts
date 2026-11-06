import type { EndpointStats, HealthStatus, PodCounts } from '../types'

export const AVAILABILITY_HEALTHY_AT = 99
export const AVAILABILITY_WARNING_AT = 95

const SEVERITY: Record<HealthStatus, number> = {
  healthy: 0,
  unknown: 1,
  warning: 2,
  unhealthy: 3,
}

/** Pod readiness: all ready is healthy, a strict majority is a warning, anything less is unhealthy. */
export function podStatus({ ready, total }: PodCounts): HealthStatus {
  if (total <= 0) return 'unknown'
  if (ready >= total) return 'healthy'
  if (ready * 2 > total) return 'warning'
  return 'unhealthy'
}

/**
 * Availability is judged on server errors (5xx) only. A 400/404/422 is the API working as designed,
 * so a burst of client errors must not turn a healthy service red.
 */
export function availabilityStatus(endpoints: EndpointStats[]): HealthStatus {
  if (endpoints.length === 0) return 'unknown'
  const average =
    endpoints.reduce((sum, endpoint) => sum + (100 - endpoint.serverErrorRate), 0) / endpoints.length
  if (average >= AVAILABILITY_HEALTHY_AT) return 'healthy'
  if (average >= AVAILABILITY_WARNING_AT) return 'warning'
  return 'unhealthy'
}

export function worstStatus(...statuses: HealthStatus[]): HealthStatus {
  return statuses.reduce<HealthStatus>(
    (worst, status) => (SEVERITY[status] > SEVERITY[worst] ? status : worst),
    'healthy',
  )
}
