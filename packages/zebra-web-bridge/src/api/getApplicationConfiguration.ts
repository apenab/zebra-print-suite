import { ZebraError, ZebraErrorCode } from "../errors";
import type { ApplicationConfiguration } from "../types";
import { normalizeApplicationConfiguration } from "../utils/applicationConfiguration";
import {
  DEFAULT_TIMEOUT_MS,
  fetchJson,
  resolveUrlOptions,
  withAbortTimeout,
} from "./httpClient";
import { getEndpointUrl, type UrlOptions } from "./urlConstructor";

export type GetApplicationConfigurationOptions = {
  timeoutMs?: number;
} & Partial<UrlOptions>;

export const getApplicationConfiguration = async (
  options: GetApplicationConfigurationOptions = {}
): Promise<ApplicationConfiguration | null> => {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, ...urlOverrides } = options;

  const urlOptions = resolveUrlOptions(urlOverrides);
  const url = getEndpointUrl({
    endpoint: "applicationConfiguration",
    ...urlOptions,
  });

  try {
    const payload = await withAbortTimeout(timeoutMs, (signal) =>
      fetchJson(url, signal)
    );

    if (payload === null) {
      return null;
    }

    const configuration = normalizeApplicationConfiguration(payload);
    return configuration;
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
