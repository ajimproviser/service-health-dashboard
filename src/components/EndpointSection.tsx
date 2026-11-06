import { useApi } from '../api/apiClient'
import { useAsync } from '../hooks/useAsync'
import type { ChartType, EndpointStats } from '../types'
import { StatCard } from './StatCard'
import { TimeSeriesChart } from './TimeSeriesChart'

interface EndpointSectionProps {
  service: string
  endpoint: EndpointStats
  rangeMinutes: number
  refreshToken: number
}

interface ChartPanelProps {
  service: string
  path: string
  chart: ChartType
  title: string
  unit: string
  color: string
  rangeMinutes: number
  refreshToken: number
}

function ChartPanel({ service, path, chart, title, unit, color, rangeMinutes, refreshToken }: ChartPanelProps) {
  const api = useApi()
  const series = useAsync(
    (signal) => api.getSeries(service, path, chart, rangeMinutes, signal),
    [api, service, path, chart, rangeMinutes, refreshToken],
  )

  return (
    <article className="panel">
      <h3>{title}</h3>
      {series.error ? (
        <p className="admin__error" role="alert">
          Could not load this chart.
        </p>
      ) : series.data ? (
        <TimeSeriesChart points={series.data} unit={unit} color={color} />
      ) : (
        <div className="chart chart--loading" role="status">
          Loading chart...
        </div>
      )}
    </article>
  )
}

export function EndpointSection({ service, endpoint, rangeMinutes, refreshToken }: EndpointSectionProps) {
  return (
    <section className="endpoint">
      <h2 className="endpoint__path">{endpoint.path}</h2>
      <div className="cards">
        <StatCard
          title="Total requests"
          value={endpoint.totalRequests.toLocaleString()}
          hint="In the selected time range"
        />
        <StatCard title="Success rate" value={`${endpoint.successRate}%`} hint="2xx responses" />
        <StatCard
          title="Server error rate"
          value={`${endpoint.serverErrorRate}%`}
          hint="5xx only; client errors (4xx) are not counted"
        />
        <StatCard title="p95 latency" value={`${endpoint.p95LatencyMs} ms`} hint="95th percentile response time" />
      </div>
      <div className="charts">
        <ChartPanel
          service={service}
          path={endpoint.path}
          chart="traffic"
          title="Traffic (requests / min)"
          unit="rpm"
          color="#2563eb"
          rangeMinutes={rangeMinutes}
          refreshToken={refreshToken}
        />
        <ChartPanel
          service={service}
          path={endpoint.path}
          chart="error-rate"
          title="Server error rate (5xx)"
          unit="%"
          color="#dc2626"
          rangeMinutes={rangeMinutes}
          refreshToken={refreshToken}
        />
      </div>
    </section>
  )
}
