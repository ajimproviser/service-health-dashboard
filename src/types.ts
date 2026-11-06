export type HealthStatus = 'healthy' | 'warning' | 'unhealthy' | 'unknown'

export type ChartType = 'traffic' | 'error-rate'

export interface EndpointStats {
  path: string
  totalRequests: number
  /** Percentage of responses with a 2xx status. */
  successRate: number
  /** Percentage of responses with a 5xx status. Client errors (4xx) are not counted. */
  serverErrorRate: number
  p95LatencyMs: number
}

export interface PodCounts {
  ready: number
  total: number
}

export interface Administration {
  serviceEnabled: boolean
}

export interface ServiceSummary {
  name: string
  title: string
  description: string
  podHealth: HealthStatus
  availability: HealthStatus
}

export interface ServiceDetails {
  name: string
  title: string
  version: string
  pods: PodCounts
  endpoints: EndpointStats[]
  /** null when the real state could not be read: the UI must not offer an action in that case. */
  administration: Administration | null
  refreshedAt: string
}

export interface SeriesPoint {
  timestamp: string
  value: number
}
