import { describe, expect, it } from 'vitest'
import type { EndpointStats } from '../types'
import { availabilityStatus, podStatus, worstStatus } from './health'

const endpoint = (serverErrorRate: number, successRate = 100 - serverErrorRate): EndpointStats => ({
  path: '/x',
  totalRequests: 1000,
  successRate,
  serverErrorRate,
  p95LatencyMs: 100,
})

describe('podStatus', () => {
  it.each([
    [{ ready: 3, total: 3 }, 'healthy'],
    [{ ready: 2, total: 3 }, 'warning'],
    [{ ready: 1, total: 2 }, 'unhealthy'],
    [{ ready: 1, total: 3 }, 'unhealthy'],
    [{ ready: 0, total: 0 }, 'unknown'],
  ] as const)('%j is %s', (pods, expected) => {
    expect(podStatus(pods)).toBe(expected)
  })
})

describe('availabilityStatus', () => {
  it('is unknown when there are no endpoints', () => {
    expect(availabilityStatus([])).toBe('unknown')
  })

  it('stays healthy when most failures are client errors (4xx)', () => {
    // Only 40% of responses are 2xx, but none are 5xx: the API is rejecting bad requests as designed.
    expect(availabilityStatus([endpoint(0, 40)])).toBe('healthy')
  })

  it('warns on a moderate server error rate', () => {
    expect(availabilityStatus([endpoint(3)])).toBe('warning')
  })

  it('is unhealthy on a high server error rate', () => {
    expect(availabilityStatus([endpoint(8)])).toBe('unhealthy')
  })

  it('averages across endpoints', () => {
    expect(availabilityStatus([endpoint(0), endpoint(2)])).toBe('healthy')
  })
})

describe('worstStatus', () => {
  it('returns the most severe status', () => {
    expect(worstStatus('healthy', 'warning', 'unhealthy')).toBe('unhealthy')
    expect(worstStatus('healthy', 'unknown')).toBe('unknown')
    expect(worstStatus()).toBe('healthy')
  })
})
