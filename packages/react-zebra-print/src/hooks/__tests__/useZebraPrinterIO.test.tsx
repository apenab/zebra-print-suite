import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ZebraDevice } from 'zebra-web-bridge'
import { useZebraPrinterIO } from '../useZebraPrinterIO'

const sampleDevice: ZebraDevice = {
  uid: 'printer-uid',
  name: 'Zebra ZP 500 (ZPL)',
}

const createClientMock = () => {
  const send = vi.fn(async () => 'ok')
  const read = vi.fn(async () => 'status-ready')

  return { client: { send, read } }
}

describe('useZebraPrinterIO', () => {
  it('sends data and tracks sending state', async () => {
    const { client } = createClientMock()
    const { result } = renderHook(() =>
      useZebraPrinterIO({ device: sampleDevice, client }),
    )

    await act(async () => {
      await result.current.sendToPrinter('^XA')
    })

    await waitFor(() => {
      expect(result.current.sending).toBe(false)
    })

    expect(client.send).toHaveBeenCalledWith({
      device: sampleDevice,
      data: '^XA',
    })
    expect(result.current.lastResponse).toBe('ok')
    expect(result.current.error).toBeUndefined()
  })

  it('reads data and tracks reading state', async () => {
    const { client } = createClientMock()
    const { result } = renderHook(() =>
      useZebraPrinterIO({ device: sampleDevice, client }),
    )

    await act(async () => {
      await result.current.readFromPrinter({ timeoutMs: 5000 })
    })

    await waitFor(() => {
      expect(result.current.reading).toBe(false)
    })

    expect(client.read).toHaveBeenCalledWith({
      device: sampleDevice,
      timeoutMs: 5000,
    })
    expect(result.current.lastResponse).toBe('status-ready')
    expect(result.current.error).toBeUndefined()
  })

  it('captures and rethrows errors from send', async () => {
    const failingClient = {
      read: vi.fn(),
      send: vi.fn(async () => {
        throw new Error('printer offline')
      }),
    }
    const { result } = renderHook(() =>
      useZebraPrinterIO({ device: sampleDevice, client: failingClient }),
    )

    await expect(result.current.sendToPrinter('^XZ')).rejects.toThrow(
      'printer offline',
    )

    await waitFor(() => {
      expect(result.current.error?.message).toBe('printer offline')
      expect(result.current.sending).toBe(false)
    })
  })

  it('fails fast when device is missing or has no uid', async () => {
    const { client } = createClientMock()
    const { result } = renderHook(() =>
      useZebraPrinterIO({ device: null, client }),
    )

    await expect(
      act(async () => {
        await result.current.sendToPrinter('^XA')
      }),
    ).rejects.toThrow('uid is required')
  })
})
