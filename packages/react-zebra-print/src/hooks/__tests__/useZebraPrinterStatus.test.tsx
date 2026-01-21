import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ZebraDevice } from 'zebra-web-bridge'
import { useZebraPrinterStatus } from '../useZebraPrinterStatus'

const sampleDevice: ZebraDevice = {
  uid: 'printer-uid',
  name: 'Zebra ZP 500 (ZPL)',
}

const createClientMock = () => {
  const getStatus = vi.fn(async () => 'STATUS')
  const getInfo = vi.fn(async () => 'INFO')
  const getConfiguration = vi.fn(async () => 'CONFIG')

  return { client: { getStatus, getInfo, getConfiguration } }
}

describe('useZebraPrinterStatus', () => {
  it('fetches status and tracks loading/response', async () => {
    const { client } = createClientMock()
    const { result } = renderHook(() =>
      useZebraPrinterStatus({ device: sampleDevice, client }),
    )

    await act(async () => {
      await result.current.fetchStatus({ timeoutMs: 5000 })
    })

    expect(client.getStatus).toHaveBeenCalledWith({
      device: sampleDevice,
      timeoutMs: 5000,
    })
    await waitFor(() => {
      expect(result.current.statusLoading).toBe(false)
      expect(result.current.lastResponse).toBe('STATUS')
      expect(result.current.lastKind).toBe('status')
      expect(result.current.error).toBeUndefined()
    })
  })

  it('fetches info and configuration', async () => {
    const { client } = createClientMock()
    const { result } = renderHook(() =>
      useZebraPrinterStatus({ device: sampleDevice, client }),
    )

    await act(async () => {
      await result.current.fetchInfo()
      await result.current.fetchConfiguration()
    })

    expect(client.getInfo).toHaveBeenCalledWith({ device: sampleDevice })
    expect(client.getConfiguration).toHaveBeenCalledWith({
      device: sampleDevice,
    })
    expect(result.current.lastKind).toBe('configuration')
    expect(result.current.lastResponse).toBe('CONFIG')
  })

  it('captures and rethrows errors', async () => {
    const failingClient = {
      getStatus: vi.fn(async () => {
        throw new Error('status failed')
      }),
      getInfo: vi.fn(),
      getConfiguration: vi.fn(),
    }

    const { result } = renderHook(() =>
      useZebraPrinterStatus({ device: sampleDevice, client: failingClient }),
    )

    await expect(result.current.fetchStatus()).rejects.toThrow('status failed')

    await waitFor(() => {
      expect(result.current.error?.message).toBe('status failed')
      expect(result.current.statusLoading).toBe(false)
    })
  })

  it('fails fast without a valid device uid', async () => {
    const { client } = createClientMock()
    const { result } = renderHook(() =>
      useZebraPrinterStatus({ device: null, client }),
    )

    await expect(result.current.fetchStatus()).rejects.toThrow('uid')
  })
})
