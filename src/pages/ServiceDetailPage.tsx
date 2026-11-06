import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useApi } from '../api/apiClient'
import { AdminPanel } from '../components/AdminPanel'
import { EndpointSection } from '../components/EndpointSection'
import { StatusBadge } from '../components/StatusBadge'
import { TimeRangeSelector } from '../components/TimeRangeSelector'
import { useAsync } from '../hooks/useAsync'
import { availabilityStatus, podStatus } from '../lib/health'

export function ServiceDetailPage() {
  const { name = '' } = useParams()
  const api = useApi()
  const [rangeMinutes, setRangeMinutes] = useState(30)
  const [refreshToken, setRefreshToken] = useState(0)

  const details = useAsync(
    (signal) => api.getServiceDetails(name, rangeMinutes, signal),
    [api, name, rangeMinutes, refreshToken],
  )

  const data = details.data

  return (
    <main className="page">
      <div className="toolbar">
        <Link to="/">← Back to services</Link>
        <div className="toolbar__actions">
          {data && (
            <span className="toolbar__refreshed">
              Last refresh: <strong>{new Date(data.refreshedAt).toLocaleTimeString()}</strong>
            </span>
          )}
          <TimeRangeSelector value={rangeMinutes} onChange={setRangeMinutes} />
          <button
            type="button"
            className="btn btn--ghost"
            aria-label="Refresh"
            onClick={() => setRefreshToken((token) => token + 1)}
          >
            ↻
          </button>
        </div>
      </div>

      {details.loading && !data && (
        <p className="state" role="status">
          Loading service...
        </p>
      )}

      {details.error && (
        <div className="state" role="alert">
          Could not load this service.{' '}
          <button type="button" className="link-button" onClick={details.reload}>
            Try again
          </button>
        </div>
      )}

      {data && (
        <>
          <header className="hero hero--service">
            <div>
              <h1>{data.title}</h1>
              <p>Version {data.version}</p>
            </div>
            <div className="hero__badges">
              <StatusBadge status={podStatus(data.pods)} label="Pods" />
              <StatusBadge status={availabilityStatus(data.endpoints)} label="Availability" />
            </div>
          </header>

          {data.endpoints.map((endpoint) => (
            <EndpointSection
              key={endpoint.path}
              service={data.name}
              endpoint={endpoint}
              rangeMinutes={rangeMinutes}
              refreshToken={refreshToken}
            />
          ))}

          <div className="bottom">
            <section className="panel" aria-label="Service details">
              <h3>Service details</h3>
              <table>
                <tbody>
                  <tr>
                    <td>Version</td>
                    <td>{data.version}</td>
                  </tr>
                  <tr>
                    <td>Pods</td>
                    <td>
                      {data.pods.ready} / {data.pods.total} ready
                    </td>
                  </tr>
                  <tr>
                    <td>Endpoints</td>
                    <td>{data.endpoints.map((endpoint) => endpoint.path).join(', ')}</td>
                  </tr>
                </tbody>
              </table>
            </section>
            <AdminPanel
              administration={data.administration}
              onSetEnabled={async (enabled) => {
                const result = await api.setServiceEnabled(data.name, enabled)
                // Traffic and error numbers change with availability, so reload the page data.
                setRefreshToken((token) => token + 1)
                return result
              }}
            />
          </div>
        </>
      )}
    </main>
  )
}
