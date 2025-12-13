import { ZebraError, ZebraErrorCode } from "../errors";
import type { ZebraDevice } from "../types";

export const createDevicePayload = (
  device: ZebraDevice | null | undefined,
  errorMessage: string
) => {
  if (!device?.uid) {
    throw new ZebraError(ZebraErrorCode.VALIDATION_ERROR, errorMessage);
  }

  const payload: Record<string, string | number | undefined> = {};
  const entries = [
    ["name", device.name],
    ["deviceType", device.deviceType],
    ["connection", device.connection],
    ["uid", device.uid],
    ["version", device.version],
    ["provider", device.provider],
    ["manufacturer", device.manufacturer],
  ];

  for (const [key, value] of entries) {
    if (!!key && value !== undefined) {
      payload[key] = value;
    }
  }

  return payload;
};
