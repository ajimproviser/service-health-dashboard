import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminPanel } from './AdminPanel'

describe('AdminPanel', () => {
  let confirmSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
  })

  afterEach(() => {
    confirmSpy.mockRestore()
  })

  it('disables the service after the user confirms', async () => {
    const onSetEnabled = vi.fn().mockResolvedValue({ serviceEnabled: false })
    render(<AdminPanel administration={{ serviceEnabled: true }} onSetEnabled={onSetEnabled} />)

    await userEvent.click(screen.getByRole('button', { name: 'Disable service' }))

    expect(confirmSpy).toHaveBeenCalled()
    expect(onSetEnabled).toHaveBeenCalledWith(false)
    expect(await screen.findByText(/service disabled/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Enable service' })).toBeEnabled()
  })

  it('leaves the service untouched when the user cancels', async () => {
    confirmSpy.mockReturnValue(false)
    const onSetEnabled = vi.fn()
    render(<AdminPanel administration={{ serviceEnabled: true }} onSetEnabled={onSetEnabled} />)

    await userEvent.click(screen.getByRole('button', { name: 'Disable service' }))

    expect(onSetEnabled).not.toHaveBeenCalled()
    expect(screen.getByText(/service enabled/i)).toBeInTheDocument()
  })

  it('enables the service without asking for confirmation', async () => {
    const onSetEnabled = vi.fn().mockResolvedValue({ serviceEnabled: true })
    render(<AdminPanel administration={{ serviceEnabled: false }} onSetEnabled={onSetEnabled} />)

    await userEvent.click(screen.getByRole('button', { name: 'Enable service' }))

    expect(confirmSpy).not.toHaveBeenCalled()
    expect(onSetEnabled).toHaveBeenCalledWith(true)
    expect(await screen.findByText(/service enabled/i)).toBeInTheDocument()
  })

  it('reports an unknown state and offers no action when the state could not be read', async () => {
    const onSetEnabled = vi.fn()
    render(<AdminPanel administration={null} onSetEnabled={onSetEnabled} />)

    const button = screen.getByRole('button', { name: 'Unavailable' })
    expect(button).toBeDisabled()
    expect(screen.getByRole('alert')).toHaveTextContent('Could not read the current service state')

    await userEvent.click(button)
    expect(onSetEnabled).not.toHaveBeenCalled()
  })

  it('keeps the current state and shows an error when the update fails', async () => {
    const onSetEnabled = vi.fn().mockRejectedValue(new Error('boom'))
    render(<AdminPanel administration={{ serviceEnabled: true }} onSetEnabled={onSetEnabled} />)

    await userEvent.click(screen.getByRole('button', { name: 'Disable service' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not change the service state')
    expect(screen.getByRole('button', { name: 'Disable service' })).toBeEnabled()
  })

  it('locks the button while a change is in flight so it cannot be double-submitted', async () => {
    let resolve: (value: { serviceEnabled: boolean }) => void = () => {}
    const onSetEnabled = vi.fn().mockReturnValue(new Promise((r) => (resolve = r)))
    render(<AdminPanel administration={{ serviceEnabled: false }} onSetEnabled={onSetEnabled} />)

    await userEvent.click(screen.getByRole('button', { name: 'Enable service' }))

    expect(screen.getByRole('button', { name: 'Please wait...' })).toBeDisabled()
    resolve({ serviceEnabled: true })
    await waitFor(() => expect(screen.getByRole('button', { name: 'Disable service' })).toBeEnabled())
    expect(onSetEnabled).toHaveBeenCalledTimes(1)
  })
})
