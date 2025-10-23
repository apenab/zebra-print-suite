import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useZebraPrinters } from '../useZebraPrinters'
import type { Printer } from '../../types/printer'

const createDeferred = <T,>() => {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void

  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })

  return { promise, resolve, reject }
}

const createPrinterClientMock = (
  initialImplementation: () => Promise<Printer[]>,
) => {
  let implementation = initialImplementation

  const listPrinters = vi.fn(async () => implementation())

  return {
    client: {
      listPrinters,
    },
    setImplementation(next: () => Promise<Printer[]>) {
      implementation = next
    },
  }
}

describe('useZebraPrinters', () => {
  const samplePrinters: Printer[] = [
    { id: 'printer-1', name: 'Zebra ZP 500 (ZPL)', isDefault: true },
    { id: 'printer-2', name: 'Zebra GX420d' },
  ]

  it('exposes initial loading state with no printers and no error', () => {
    const deferred = createDeferred<Printer[]>()
    const { client } = createPrinterClientMock(() => deferred.promise)

    const { result } = renderHook(() => useZebraPrinters({ client }))

    expect(result.current.loading).toBe(true)
    expect(result.current.printers).toEqual([])
    expect(result.current.error).toBeUndefined()
  })

  it('resolves printers and stops loading on success', async () => {
    const deferred = createDeferred<Printer[]>()
    const { client } = createPrinterClientMock(() => deferred.promise)
    const { result } = renderHook(() => useZebraPrinters({ client }))

    await act(async () => {
      deferred.resolve(samplePrinters)
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.printers).toEqual(samplePrinters)
    })
    expect(result.current.error).toBeUndefined()
  })

  it('captures errors and exposes them', async () => {
    const deferred = createDeferred<Printer[]>()
    const { client } = createPrinterClientMock(() => deferred.promise)
    const { result } = renderHook(() => useZebraPrinters({ client }))
    const fakeError = new Error('printer service offline')

    await act(async () => {
      deferred.reject(fakeError)
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(fakeError)
    })
    expect(result.current.printers).toEqual([])
  })

  it('refresh() triggers a new fetch cycle', async () => {
    const { client, setImplementation } = createPrinterClientMock(() =>
      Promise.resolve(samplePrinters),
    )
    const { result } = renderHook(() => useZebraPrinters({ client }))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.printers).toEqual(samplePrinters)
    })

    const updatedPrinters: Printer[] = [
      { id: 'printer-3', name: 'Zebra ZD420' },
    ]
    setImplementation(() => Promise.resolve(updatedPrinters))

    await act(async () => {
      await result.current.refresh()
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.printers).toEqual(updatedPrinters)
    })
  })

})
