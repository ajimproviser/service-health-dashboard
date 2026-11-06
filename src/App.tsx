import { lazy, Suspense } from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import { ServicesPage } from './pages/ServicesPage'

// The detail page pulls in the charting library, so it is loaded only when someone opens a service.
const ServiceDetailPage = lazy(() =>
  import('./pages/ServiceDetailPage').then((module) => ({ default: module.ServiceDetailPage })),
)

export function App() {
  return (
    <>
      <nav className="nav">
        <Link to="/" className="nav__brand">
          Service Health Dashboard
        </Link>
      </nav>
      <Suspense
        fallback={
          <p className="state" role="status">
            Loading...
          </p>
        }
      >
        <Routes>
          <Route path="/" element={<ServicesPage />} />
          <Route path="/services/:name" element={<ServiceDetailPage />} />
          <Route
            path="*"
            element={
              <main className="page">
                <p className="state">
                  Page not found. <Link to="/">Back to services</Link>
                </p>
              </main>
            }
          />
        </Routes>
      </Suspense>
    </>
  )
}
