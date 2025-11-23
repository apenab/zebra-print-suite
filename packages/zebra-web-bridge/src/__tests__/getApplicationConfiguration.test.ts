import { afterEach, describe, expect, it, vi } from "vitest";

import { getApplicationConfiguration } from "../api/getApplicationConfiguration";
import { ZebraError, ZebraErrorCode } from "../errors";

const createAbortError = () => {
  if (typeof DOMException === "function") {
    return new DOMException("Aborted", "AbortError");
  }

  const error = new Error("Aborted");
  error.name = "AbortError";
  return error;
};

describe("getApplicationConfiguration", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).window;
  });

  it("returns the normalized application configuration reported by BrowserPrint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          application: {
            version: "3.1.250",
            build_number: 31250,
            api_level: 3,
            platform: "macos",
            supportedConversions: {
              bmp: ["zpl", "cpcl", 42],
              pdf: ["zpl"],
              invalid: "oops",
            },
          },
        }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const configuration = await getApplicationConfiguration();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:9100/config",
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
    expect(configuration).toEqual({
      application: {
        version: "3.1.250",
        buildNumber: 31250,
        apiLevel: 3,
        platform: "macos",
        supportedConversions: {
          bmp: ["zpl", "cpcl"],
          pdf: ["zpl"],
        },
      },
    });
  });

  it("returns null when the service responds without configuration data", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => "",
    });

    vi.stubGlobal("fetch", fetchMock);

    const configuration = await getApplicationConfiguration();

    expect(configuration).toBeNull();
  });

  it("returns null when the payload does not include an application object", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({}),
    });

    vi.stubGlobal("fetch", fetchMock);

    const configuration = await getApplicationConfiguration();

    expect(configuration).toBeNull();
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

    const promise = getApplicationConfiguration({
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
