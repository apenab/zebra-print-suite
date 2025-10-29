import { afterEach, describe, expect, it, vi } from "vitest";

import { getDefaultDevice } from "../api/getDefaultDevice";
import { ZebraError, ZebraErrorCode } from "../errors";

const createAbortError = () => {
  if (typeof DOMException === "function") {
    return new DOMException("Aborted", "AbortError");
  }

  const error = new Error("Aborted");
  error.name = "AbortError";
  return error;
};

describe("getDefaultDevice", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).window;
  });

  it("returns the default device reported by Zebra BrowserPrint", async () => {
    const deviceResponse = {
      name: "Zebra Printer",
      deviceType: "printer",
      connection: "usb",
      uid: "usb:123",
      manufacturer: "Zebra",
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify(deviceResponse),
    });

    vi.stubGlobal("fetch", fetchMock);

    const device = await getDefaultDevice({ deviceType: "printer" });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:9100/default?type=printer",
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
    expect(device).toMatchObject({
      name: "Zebra Printer",
      deviceType: "printer",
      connection: "usb",
      uid: "usb:123",
      manufacturer: "Zebra",
    });
  });

  it("returns null when no default device is available", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => "",
    });

    vi.stubGlobal("fetch", fetchMock);

    const device = await getDefaultDevice({ deviceType: "printer" });

    expect(device).toBeNull();
  });

  it("propagates ZebraError with SERVICE_UNAVAILABLE when the request times out", async () => {
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

    const promise = getDefaultDevice({
      deviceType: "printer",
      timeoutMs: 10,
    }).catch((error) => {
      expect(error).toBeInstanceOf(ZebraError);
      throw error;
    });

    const expectation = expect(promise).rejects.toMatchObject({
      code: ZebraErrorCode.SERVICE_UNAVAILABLE,
    });

    await vi.advanceTimersByTimeAsync(15);
    await expectation;
  });
});
