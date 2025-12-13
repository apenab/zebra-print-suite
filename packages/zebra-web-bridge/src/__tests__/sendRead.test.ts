import { afterEach, describe, expect, it, vi } from "vitest";

import { read } from "../api/read";
import { send } from "../api/send";
import { ZebraError, ZebraErrorCode } from "../errors";
import type { ZebraDevice } from "../types";

const device: ZebraDevice = {
  name: "Zebra Printer",
  deviceType: "printer",
  connection: "usb",
  uid: "usb:123",
  manufacturer: "Zebra",
};

const createAbortError = () => {
  if (typeof DOMException === "function") {
    return new DOMException("Aborted", "AbortError");
  }

  const error = new Error("Aborted");
  error.name = "AbortError";
  return error;
};

describe("send", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).window;
  });

  it("posts raw data to the BrowserPrint /write endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => "OK",
    });

    vi.stubGlobal("fetch", fetchMock);

    const response = await send({ device, data: "^XA^XZ" });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:9100/write",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          device,
          data: "^XA^XZ",
        }),
        signal: expect.any(AbortSignal),
      })
    );
    expect(response).toBe("OK");
  });

  it("raises ZebraError when the request times out", async () => {
    vi.useFakeTimers();

    const fetchMock = vi.fn(
      (
        _url: string,
        init?: {
          signal?: AbortSignal;
        }
      ) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(createAbortError());
          });
        })
    );

    vi.stubGlobal("fetch", fetchMock);

    const promise = send({
      device,
      data: "~hs",
      timeoutMs: 5,
    }).catch((error) => {
      expect(error).toBeInstanceOf(ZebraError);
      throw error;
    });

    const expectation = expect(promise).rejects.toMatchObject({
      code: ZebraErrorCode.SERVICE_UNAVAILABLE,
    });

    await vi.advanceTimersByTimeAsync(10);
    await expectation;
  });

  it("requires a device uid", async () => {
    await expect(
      send({
        device: { name: "No UID" },
        data: "test",
      })
    ).rejects.toMatchObject({
      code: ZebraErrorCode.VALIDATION_ERROR,
    });
  });
});

describe("read", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).window;
  });

  it("posts to /read and returns response text", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => "PRINTER STATUS",
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await read({ device });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:9100/read",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ device }),
        signal: expect.any(AbortSignal),
      })
    );
    expect(result).toBe("PRINTER STATUS");
  });

  it("raises ZebraError when the request times out", async () => {
    vi.useFakeTimers();

    const fetchMock = vi.fn(
      (
        _url: string,
        init?: {
          signal?: AbortSignal;
        }
      ) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(createAbortError());
          });
        })
    );

    vi.stubGlobal("fetch", fetchMock);

    const promise = read({
      device,
      timeoutMs: 5,
    }).catch((error) => {
      expect(error).toBeInstanceOf(ZebraError);
      throw error;
    });

    const expectation = expect(promise).rejects.toMatchObject({
      code: ZebraErrorCode.SERVICE_UNAVAILABLE,
    });

    await vi.advanceTimersByTimeAsync(10);
    await expectation;
  });

  it("requires a device uid", async () => {
    await expect(
      read({
        device: { name: "No UID" },
      })
    ).rejects.toMatchObject({
      code: ZebraErrorCode.VALIDATION_ERROR,
    });
  });
});
