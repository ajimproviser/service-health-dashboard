import { availabilityStatus, podStatus } from '../lib/health'
import type {
  Administration,
  ChartType,
  EndpointStats,
  PodCounts,
  SeriesPoint,
  ServiceDetails,
  ServiceSummary,
} from '../types'
import type { ApiClient } from './apiClient'

interface MockService {
  title: string
  description: string
  version: string
  pods: PodCounts
  /** Per-endpoint traffic and error profile used to generate numbers. */
  endpoints: { path: string; baseRpm: number; serverErrorRate: number; clientErrorRate: number; p95: number }[]
  /** When false, the admin state "cannot be read": the UI must show an unknown state. */
  administrationReadable: boolean
}

const SERVICES: Record<string, MockService> = {
  'payments-gateway': {
    title: 'Payments Gateway',
    description: 'Authorises and captures card payments for partner merchants.',
    version: '2.14.1',
    pods: { ready: 3, total: 3 },
    endpoints: [
      { path: '/payments/v1/authorize', baseRpm: 420, serverErrorRate: 0.12, clientErrorRate: 3.1, p95: 180 },
      { path: '/payments/v1/capture', baseRpm: 260, serverErrorRate: 0.2, clientErrorRate: 1.4, p95: 210 },
    ],
    administrationReadable: true,
  },
  'identity-verification': {
    title: 'Identity Verification',
    description: 'Verifies that a subscriber owns the identity they present.',
    version: '1.8.0',
    pods: { ready: 3, total: 3 },
    // Mostly client errors (4xx): the API is working as designed, so it must stay healthy.
    endpoints: [{ path: '/identity/v1/verify', baseRpm: 310, serverErrorRate: 0.05, clientErrorRate: 38, p95: 140 }],
    administrationReadable: true,
  },
  'notification-service': {
    title: 'Notification Service',
    description: 'Sends transactional SMS and email notifications.',
    version: '0.9.7',
    pods: { ready: 3, total: 3 },
    endpoints: [{ path: '/notifications/v1/send', baseRpm: 180, serverErrorRate: 4.2, clientErrorRate: 1, p95: 520 }],
    administrationReadable: true,
  },
  'search-api': {
    title: 'Search API',
    description: 'Full-text search across the product catalogue.',
    version: '3.2.4',
    pods: { ready: 2, total: 3 },
    endpoints: [{ path: '/search/v2/query', baseRpm: 640, serverErrorRate: 0.4, clientErrorRate: 2, p95: 95 }],
    administrationReadable: true,
  },
  'report-exporter': {
    title: 'Report Exporter',
    description: 'Generates scheduled CSV and PDF reports.',
    version: '1.1.0',
    pods: { ready: 1, total: 3 },
    endpoints: [{ path: '/reports/v1/export', baseRpm: 40, serverErrorRate: 9, clientErrorRate: 2, p95: 2400 }],
    administrationReadable: false,
  },
}

/** Small deterministic PRNG so charts and tests are stable between runs. */
function seeded(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hash(text: string): number {
  let value = 2166136261
  for (let i = 0; i < text.length; i++) {
    value ^= text.charCodeAt(i)
    value = Math.imul(value, 16777619)
  }
  return value >>> 0
}

function round(value: number, digits = 2): number {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    const onAbort = () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    }
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

export interface MockApiOptions {
  /** Simulated network latency per call. */
  latencyMs?: number
  /** Clock, injectable for tests. */
  now?: () => number
}

export function createMockApi({ latencyMs = 300, now = Date.now }: MockApiOptions = {}): ApiClient {
  const enabled = new Map<string, boolean>(Object.keys(SERVICES).map((name) => [name, true]))

  function service(name: string): MockService {
    const found = SERVICES[name]
    if (!found) throw new Error(`Unknown service: ${name}`)
    return found
  }

  function endpointStats(name: string, rangeMinutes: number): EndpointStats[] {
    const random = seeded(hash(`${name}:${rangeMinutes}`))
    const isEnabled = enabled.get(name) ?? true
    return service(name).endpoints.map((endpoint) => {
      const totalRequests = isEnabled ? Math.round(endpoint.baseRpm * rangeMinutes * (0.9 + random() * 0.2)) : 0
      const serverErrorRate = isEnabled ? round(endpoint.serverErrorRate * (0.85 + random() * 0.3)) : 0
      const clientErrorRate = isEnabled ? endpoint.clientErrorRate * (0.85 + random() * 0.3) : 0
      return {
        path: endpoint.path,
        totalRequests,
        successRate: round(Math.max(0, 100 - serverErrorRate - clientErrorRate)),
        serverErrorRate,
        p95LatencyMs: isEnabled ? Math.round(endpoint.p95 * (0.9 + random() * 0.2)) : 0,
      }
    })
  }

  return {
    async listServices(signal) {
      await sleep(latencyMs, signal)
      return Object.entries(SERVICES).map<ServiceSummary>(([name, definition]) => ({
        name,
        title: definition.title,
        description: definition.description,
        podHealth: podStatus(definition.pods),
        availability: availabilityStatus(endpointStats(name, 30)),
      }))
    },

    async getServiceDetails(name, rangeMinutes, signal) {
      await sleep(latencyMs, signal)
      const definition = service(name)
      return {
        name,
        title: definition.title,
        version: definition.version,
        pods: definition.pods,
        endpoints: endpointStats(name, rangeMinutes),
        administration: definition.administrationReadable ? { serviceEnabled: enabled.get(name) ?? true } : null,
        refreshedAt: new Date(now()).toISOString(),
      } satisfies ServiceDetails
    },

    async getSeries(name, path, chart: ChartType, rangeMinutes, signal) {
      await sleep(latencyMs, signal)
      const endpoint = service(name).endpoints.find((candidate) => candidate.path === path)
      if (!endpoint) throw new Error(`Unknown endpoint: ${path}`)
      const isEnabled = enabled.get(name) ?? true
      const points = 24
      const end = now()
      const stepMs = (rangeMinutes * 60_000) / points
      const random = seeded(hash(`${name}:${path}:${chart}:${rangeMinutes}`))
      const series: SeriesPoint[] = []
      for (let i = 0; i < points; i++) {
        const noise = 0.8 + random() * 0.4
        const value =
          chart === 'traffic' ? endpoint.baseRpm * noise : endpoint.serverErrorRate * (0.5 + random())
        series.push({
          timestamp: new Date(end - (points - 1 - i) * stepMs).toISOString(),
          value: isEnabled ? round(value) : 0,
        })
      }
      return series
    },

    async setServiceEnabled(name, value): Promise<Administration> {
      await sleep(latencyMs)
      service(name)
      enabled.set(name, value)
      return { serviceEnabled: value }
    },
  }
}
