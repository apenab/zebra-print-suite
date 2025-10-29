import type { ZebraDevice } from "../types";

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const asString = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

const asNumber = (value: unknown): number | undefined =>
  typeof value === "number" ? value : undefined;

export const normalizeDevice = (value: unknown): ZebraDevice | null => {
  if (!isRecord(value)) {
    return null;
  }

  return {
    name: asString(value.name),
    deviceType: asString(value.deviceType),
    connection: asString(value.connection),
    uid: asString(value.uid),
    version: asNumber(value.version),
    provider: asString(value.provider),
    manufacturer: asString(value.manufacturer),
  };
};

export const normalizeDeviceArray = (value: unknown): ZebraDevice[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => normalizeDevice(item))
    .filter((device): device is ZebraDevice => device !== null);
};
