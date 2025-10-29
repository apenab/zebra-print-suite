import { ZebraError, ZebraErrorCode } from "../errors";
import type { ZebraDevice } from "../types";
import {
  normalizeDeviceArray,
  isRecord,
} from "../utils/deviceNormalization";
import {
  DEFAULT_TIMEOUT_MS,
  fetchJson,
  resolveUrlOptions,
  withAbortTimeout,
} from "./httpClient";
import { getEndpointUrl, type UrlOptions } from "./urlConstructor";

export type GetLocalDevicesOptions = {
  deviceType?: string;
  timeoutMs?: number;
} & Partial<UrlOptions>;

const fromDeviceList = (
  payload: Record<string, unknown>,
  deviceType?: string
): ZebraDevice[] => {
  const deviceList = normalizeDeviceArray(payload.deviceList);

  if (!deviceList.length) {
    return deviceList;
  }

  if (!deviceType) {
    return deviceList;
  }

  const normalizedType = deviceType.toLowerCase();
  return deviceList.filter((device) =>
    device.deviceType
      ? device.deviceType.toLowerCase() === normalizedType
      : true
  );
};

const selectDevicesByType = (
  payload: Record<string, unknown>,
  deviceType?: string
): ZebraDevice[] => {
  const devicesFromList = fromDeviceList(payload, deviceType);

  if (devicesFromList.length || Array.isArray(payload.deviceList)) {
    return devicesFromList;
  }

  if (!deviceType) {
    return Object.values(payload).flatMap((value) =>
      normalizeDeviceArray(value)
    );
  }

  const normalizedType = deviceType.toLowerCase();
  const entries = Object.entries(payload);

  const matchingEntry =
    entries.find(([key]) => key.toLowerCase() === normalizedType) ??
    entries.find(([key]) => key.toLowerCase() === `${normalizedType}s`);

  if (!matchingEntry) {
    return [];
  }

  return normalizeDeviceArray(matchingEntry[1]);
};

export const getLocalDevices = async (
  options: GetLocalDevicesOptions = {}
): Promise<ZebraDevice[]> => {
  const { deviceType, timeoutMs = DEFAULT_TIMEOUT_MS, ...urlOverrides } =
    options;

  const urlOptions = resolveUrlOptions(urlOverrides);
  const url = getEndpointUrl({
    endpoint: "local",
    ...urlOptions,
  });

  try {
    const payload = await withAbortTimeout(timeoutMs, (signal) =>
      fetchJson(url, signal)
    );

    if (!isRecord(payload)) {
      return [];
    }

    return selectDevicesByType(payload, deviceType);
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
