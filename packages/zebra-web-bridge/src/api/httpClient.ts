import { ZebraError, ZebraErrorCode } from "../errors";
import type { UrlOptions } from "./urlConstructor";

type Protocol = "http" | "https";

export const DEFAULT_TIMEOUT_MS = 3000;
const DEFAULT_HOST = "127.0.0.1";

export const resolveProtocol = (): Protocol => {
  if (
    typeof window !== "undefined" &&
    typeof window.location === "object" &&
    window.location?.protocol === "https:"
  ) {
    return "https";
  }

  return "http";
};

export const resolvePort = (protocol: Protocol): number =>
  protocol === "https" ? 9101 : 9100;

export const resolveUrlOptions = (
  overrides: Partial<UrlOptions>
): UrlOptions => {
  const protocol = overrides.protocol ?? resolveProtocol();

  return {
    protocol,
    host: overrides.host ?? DEFAULT_HOST,
    port: overrides.port ?? resolvePort(protocol),
  };
};

export const withAbortTimeout = async <T>(
  timeoutMs: number,
  task: (signal: AbortSignal) => Promise<T>
): Promise<T> => {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    return await task(controller.signal);
  } finally {
    clearTimeout(timer);
  }
};

export const fetchJson = async (
  url: string,
  signal: AbortSignal
): Promise<unknown> => {
  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new ZebraError(
      ZebraErrorCode.SERVICE_UNAVAILABLE,
      `Zebra service responded with status ${response.status}`
    );
  }

  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new ZebraError(
      ZebraErrorCode.SERVICE_UNAVAILABLE,
      "Received invalid JSON from Zebra service",
      error instanceof Error ? { cause: error } : undefined
    );
  }
};
