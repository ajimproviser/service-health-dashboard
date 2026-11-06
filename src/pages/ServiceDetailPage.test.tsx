import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiContext } from '../api/apiClient'
import { createMockApi } from '../api/mockApi'
import { ServiceDetailPage } from './ServiceDetailPage'
import { ServicesPage } from './ServicesPage'

// ECharts needs a real canvas, which jsdom does not provide; the chart itself is not under test here.
vi.mock('../components/TimeSeriesChart', () => ({ TimeSeriesChart: () => null }))

function renderAt(path: string) {
  const api = createMockApi({ latencyMs: 0 })
  return render(
    <ApiContext.Provider value={api}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/" element={<ServicesPage />} />
          <Route path="/services/:name" element={<ServiceDetailPage />} />
        </Routes>
      </MemoryRouter>
    </ApiContext.Provider>,
  )
}

describe('ServicesPage', () => {
  it('lists every service with its pod and availability status', async () => {
    renderAt('/')

    const card = (await screen.findByRole('heading', { name: 'Search API' })).closest('a')!
    expect(within(card).getByText('Pods: Warning')).toBeInTheDocument()
    expect(within(card).getByText('Availability: Healthy')).toBeInTheDocument()
  })

  it('does not mark a service red just because it rejects many bad requests', async () => {
    renderAt('/')

    // Identity Verification answers mostly 4xx but almost never 5xx.
    const card = (await screen.findByRole('heading', { name: 'Identity Verification' })).closest('a')!
    expect(within(card).getByText('Availability: Healthy')).toBeInTheDocument()
  })

  it('flags a service with a high server error rate', async () => {
    renderAt('/')

    const card = (await screen.findByRole('heading', { name: 'Report Exporter' })).closest('a')!
    expect(within(card).getByText('Availability: Unhealthy')).toBeInTheDocument()
    expect(within(card).getByText('Pods: Unhealthy')).toBeInTheDocument()
  })
})

describe('ServiceDetailPage', () => {
  let confirmSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
  })

  afterEach(() => {
    confirmSpy.mockRestore()
  })

  it('shows endpoint statistics and service details', async () => {
    renderAt('/services/payments-gateway')

    expect(await screen.findByRole('heading', { name: 'Payments Gateway' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '/payments/v1/authorize' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '/payments/v1/capture' })).toBeInTheDocument()
    expect(screen.getAllByText('Server error rate').length).toBe(2)
    expect(screen.getByText('3 / 3 ready')).toBeInTheDocument()
  })

  it('reloads the statistics when the time range changes', async () => {
    renderAt('/services/payments-gateway')
    await screen.findByRole('heading', { name: 'Payments Gateway' })
    const before = screen.getAllByText('Total requests')[0]!.parentElement!.textContent

    await userEvent.selectOptions(screen.getByLabelText('Time range'), '5')

    await vi.waitFor(() => {
      const after = screen.getAllByText('Total requests')[0]!.parentElement!.textContent
      expect(after).not.toBe(before)
    })
  })

  it('offers no action when the administration state cannot be read', async () => {
    renderAt('/services/report-exporter')

    expect(await screen.findByRole('heading', { name: 'Report Exporter' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Unavailable' })).toBeDisabled()
  })

  it('disables a service end to end and shows its traffic dropping to zero', async () => {
    renderAt('/services/search-api')
    await screen.findByRole('heading', { name: 'Search API' })

    await userEvent.click(screen.getByRole('button', { name: 'Disable service' }))

    expect(await screen.findByText(/service disabled/i)).toBeInTheDocument()
    await vi.waitFor(() => {
      expect(screen.getByText('Total requests').parentElement).toHaveTextContent('0')
    })
  })
})
