import { ZebraError, ZebraErrorCode } from "../errors";
import type { ZebraDevice } from "../types";
import {
  isRecord,
  normalizeDevice,
} from "../utils/deviceNormalization";
import {
  DEFAULT_TIMEOUT_MS,
  fetchJson,
  resolveUrlOptions,
  withAbortTimeout,
} from "./httpClient";
import { getEndpointUrl, type UrlOptions } from "./urlConstructor";

export type GetDefaultDeviceOptions = {
  deviceType?: string;
  timeoutMs?: number;
} & Partial<UrlOptions>;

const appendDeviceType = (url: string, deviceType?: string): string => {
  if (!deviceType) {
    return url;
  }

  const trimmedType = deviceType.trim();

  if (!trimmedType) {
    return url;
  }

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}type=${encodeURIComponent(trimmedType)}`;
};

export const getDefaultDevice = async (
  options: GetDefaultDeviceOptions = {}
): Promise<ZebraDevice | null> => {
  const { deviceType, timeoutMs = DEFAULT_TIMEOUT_MS, ...urlOverrides } =
    options;

  const urlOptions = resolveUrlOptions(urlOverrides);
  const baseUrl = getEndpointUrl({
    endpoint: "defaultDevice",
    ...urlOptions,
  });
  const url = appendDeviceType(baseUrl, deviceType);

  try {
    const payload = await withAbortTimeout(timeoutMs, (signal) =>
      fetchJson(url, signal)
    );

    if (!payload || !isRecord(payload) || Object.keys(payload).length === 0) {
      return null;
    }

    const device = normalizeDevice(payload);
    return device ?? null;
  } catch (error) {
    if (error instanceof ZebraError) {
      throw error;
    }

    const message =
      error instanceof Error ? error.message : "Unknown Zebra service error";
    throw new ZebraError(
      ZebraErrorCode.SERVICE_UNAVAILABLE,
      message,
      error instanceof Error ? { cause: error } : undefined
    );
  }
};
