import { ZebraError, ZebraErrorCode } from "../errors";
import type { ZebraDevice } from "../types";
import {
  DEFAULT_TIMEOUT_MS,
  postJsonText,
  resolveUrlOptions,
  withAbortTimeout,
} from "./httpClient";
import { getEndpointUrl, type UrlOptions } from "./urlConstructor";
import { createDevicePayload } from "../utils/devicePayload";

export type ReadOptions = {
  device: ZebraDevice;
  timeoutMs?: number;
} & Partial<UrlOptions>;

export const read = async (options: ReadOptions): Promise<string> => {
  const { device, timeoutMs = DEFAULT_TIMEOUT_MS, ...urlOverrides } = options;

  const urlOptions = resolveUrlOptions(urlOverrides);
  const url = getEndpointUrl({
    endpoint: "read",
    ...urlOptions,
  });

  try {
    const payload = {
      device: createDevicePayload(
        device,
        "Device uid is required to read from the device"
      ),
    };

    const responseText = await withAbortTimeout(timeoutMs, (signal) =>
      postJsonText(url, payload, signal)
    );

    return responseText;
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
