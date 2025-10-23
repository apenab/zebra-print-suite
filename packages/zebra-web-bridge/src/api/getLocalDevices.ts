import { getEndpointUrl, type UrlOptions } from "./urlConstructor";

export type ZebraDevice = {
  name?: string;
  deviceType?: string;
  connection?: string;
  uid?: string;
  version?: number;
  provider?: string;
  manufacturer?: string;
};

export enum ZebraErrorCode {
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
}

export class ZebraError extends Error {
  readonly code: ZebraErrorCode;

  constructor(code: ZebraErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ZebraError";
    this.code = code;
  }
}

export type GetLocalDevicesOptions = {
  deviceType?: string;
  timeoutMs?: number;
} & Partial<UrlOptions>;

const DEFAULT_TIMEOUT_MS = 3000;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const asString = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

const asNumber = (value: unknown): number | undefined =>
  typeof value === "number" ? value : undefined;

const toDeviceArray = (value: unknown): ZebraDevice[] =>
  Array.isArray(value)
    ? value.filter(isRecord).map((item) => ({
        name: asString(item.name),
        deviceType: asString(item.deviceType),
        connection: asString(item.connection),
        uid: asString(item.uid),
        version: asNumber(item.version),
        provider: asString(item.provider),
        manufacturer: asString(item.manufacturer),
      }))
    : [];

const resolveProtocol = (): "http" | "https" => {
  if (
    typeof window !== "undefined" &&
    typeof window.location === "object" &&
    window.location?.protocol === "https:"
  ) {
    return "https";
  }

  return "http";
};

const fromDeviceList = (
  payload: Record<string, unknown>,
  deviceType?: string
): ZebraDevice[] => {
  const deviceList = toDeviceArray(payload.deviceList);

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
    return Object.values(payload).flatMap(toDeviceArray);
  }

  const normalizedType = deviceType.toLowerCase();
  const entries = Object.entries(payload);

  const matchingEntry =
    entries.find(([key]) => key.toLowerCase() === normalizedType) ??
    entries.find(([key]) => key.toLowerCase() === `${normalizedType}s`);

  if (!matchingEntry) {
    return [];
  }

  return toDeviceArray(matchingEntry[1]);
};

const fetchJson = async (
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
    return {};
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

const protocol = resolveProtocol();
const port = protocol === "https" ? 9101 : 9100;

export const getLocalDevices = async (
  options: GetLocalDevicesOptions = {}
): Promise<ZebraDevice[]> => {
  const { deviceType, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  const url = getEndpointUrl({
    endpoint: "local",
    protocol: options.protocol ?? protocol,
    host: options.host ?? "127.0.0.1",
    port: options.port ?? port,
  });

  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const payload = await fetchJson(url, controller.signal);

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
  } finally {
    clearTimeout(timer);
  }
};
