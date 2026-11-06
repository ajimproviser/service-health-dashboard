import { Link } from 'react-router-dom'
import { useApi } from '../api/apiClient'
import { StatusBadge } from '../components/StatusBadge'
import { useAsync } from '../hooks/useAsync'

export function ServicesPage() {
  const api = useApi()
  const services = useAsync((signal) => api.listServices(signal), [api])

  return (
    <main className="page">
      <header className="hero">
        <p className="hero__eyebrow">Operations</p>
        <h1>Service health</h1>
        <p>Pod readiness and availability for every service, at a glance.</p>
      </header>

      {services.loading && (
        <p className="state" role="status">
          Loading services...
        </p>
      )}

      {services.error && (
        <div className="state" role="alert">
          Could not load services.{' '}
          <button type="button" className="link-button" onClick={services.reload}>
            Try again
          </button>
        </div>
      )}

      {services.data && (
        <ul className="grid">
          {services.data.map((service) => (
            <li key={service.name}>
              <Link className="service-card" to={`/services/${service.name}`}>
                <h2>{service.title}</h2>
                <p>{service.description}</p>
                <div className="service-card__badges">
                  <StatusBadge status={service.podHealth} label="Pods" />
                  <StatusBadge status={service.availability} label="Availability" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
