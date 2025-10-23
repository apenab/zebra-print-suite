import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getLocalDevices,
  ZebraError,
  ZebraErrorCode,
} from "../api/getLocalDevices";

const createAbortError = () => {
  if (typeof DOMException === "function") {
    return new DOMException("Aborted", "AbortError");
  }

  const error = new Error("Aborted");
  error.name = "AbortError";
  return error;
};

describe("getLocalDevices", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).window;
  });

  it("returns devices fetched from the Zebra service", async () => {
    const devicesResponse = {
      deviceList: [
        {
          name: "Zebra Printer",
          deviceType: "printer",
          connection: "usb",
          uid: "usb:123",
        },
      ],
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify(devicesResponse),
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await getLocalDevices({ deviceType: "printer" });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:9100/available",
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      name: "Zebra Printer",
      deviceType: "printer",
      connection: "usb",
      uid: "usb:123",
    });
  });

  it("filters devices by the requested type", async () => {
    const devicesResponse = {
      deviceList: [
        { name: "Zebra Printer", deviceType: "printer", connection: "usb" },
        { name: "Barcode Scanner", deviceType: "scanner", connection: "usb" },
      ],
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify(devicesResponse),
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await getLocalDevices({ deviceType: "printer" });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      deviceType: "printer",
      name: "Zebra Printer",
    });
  });

  it("throws ZebraError with SERVICE_UNAVAILABLE when the request times out", async () => {
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

    const promise = getLocalDevices({
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
