import { useCallback, useState } from "react";
import {
  getConfiguration as defaultGetConfiguration,
  getInfo as defaultGetInfo,
  getStatus as defaultGetStatus,
  type GetConfigurationOptions,
  type GetInfoOptions,
  type GetStatusOptions,
  type ZebraDevice,
} from "zebra-web-bridge";

export type PrinterStatusClient = {
  getStatus: (options: GetStatusOptions) => Promise<string>;
  getInfo: (options: GetInfoOptions) => Promise<string>;
  getConfiguration: (options: GetConfigurationOptions) => Promise<string>;
};

export type UseZebraPrinterStatusOptions = {
  device?: ZebraDevice | null;
  client?: PrinterStatusClient;
};

type GetStatusOverrides = Omit<GetStatusOptions, "device">;
type GetInfoOverrides = Omit<GetInfoOptions, "device">;
type GetConfigurationOverrides = Omit<GetConfigurationOptions, "device">;

export type UseZebraPrinterStatusState = {
  statusLoading: boolean;
  infoLoading: boolean;
  configurationLoading: boolean;
  error: Error | undefined;
  lastResponse: string | undefined;
  lastKind: "status" | "info" | "configuration" | undefined;
  fetchStatus: (overrides?: GetStatusOverrides) => Promise<string>;
  fetchInfo: (overrides?: GetInfoOverrides) => Promise<string>;
  fetchConfiguration: (
    overrides?: GetConfigurationOverrides
  ) => Promise<string>;
};

const normalizeError = (error: unknown): Error => {
  if (error instanceof Error) return error;
  return new Error(typeof error === "string" ? error : "Unknown Zebra error");
};

const ensureDevice = (device?: ZebraDevice | null): ZebraDevice => {
  if (!device || !device.uid) {
    throw new Error("A Zebra device with a uid is required");
  }
  return device;
};

const defaultClient: PrinterStatusClient = {
  getStatus: defaultGetStatus,
  getInfo: defaultGetInfo,
  getConfiguration: defaultGetConfiguration,
};

export const useZebraPrinterStatus = (
  options: UseZebraPrinterStatusOptions
): UseZebraPrinterStatusState => {
  const client = options.client ?? defaultClient;
  const device = options.device;

  const [statusLoading, setStatusLoading] = useState(false);
  const [infoLoading, setInfoLoading] = useState(false);
  const [configurationLoading, setConfigurationLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [lastResponse, setLastResponse] = useState<string | undefined>(
    undefined
  );
  const [lastKind, setLastKind] = useState<
    "status" | "info" | "configuration" | undefined
  >(undefined);

  const fetchStatus = useCallback(
    async (overrides?: GetStatusOverrides) => {
      setStatusLoading(true);
      setError(undefined);
      try {
        const response = await client.getStatus({
          device: ensureDevice(device),
          ...(overrides ?? {}),
        });
        setLastResponse(response);
        setLastKind("status");
        return response;
      } catch (err) {
        const normalized = normalizeError(err);
        setError(normalized);
        throw normalized;
      } finally {
        setStatusLoading(false);
      }
    },
    [client, device]
  );

  const fetchInfo = useCallback(
    async (overrides?: GetInfoOverrides) => {
      setInfoLoading(true);
      setError(undefined);
      try {
        const response = await client.getInfo({
          device: ensureDevice(device),
          ...(overrides ?? {}),
        });
        setLastResponse(response);
        setLastKind("info");
        return response;
      } catch (err) {
        const normalized = normalizeError(err);
        setError(normalized);
        throw normalized;
      } finally {
        setInfoLoading(false);
      }
    },
    [client, device]
  );

  const fetchConfiguration = useCallback(
    async (overrides?: GetConfigurationOverrides) => {
      setConfigurationLoading(true);
      setError(undefined);
      try {
        const response = await client.getConfiguration({
          device: ensureDevice(device),
          ...(overrides ?? {}),
        });
        setLastResponse(response);
        setLastKind("configuration");
        return response;
      } catch (err) {
        const normalized = normalizeError(err);
        setError(normalized);
        throw normalized;
      } finally {
        setConfigurationLoading(false);
      }
    },
    [client, device]
  );

  return {
    statusLoading,
    infoLoading,
    configurationLoading,
    error,
    lastResponse,
    lastKind,
    fetchStatus,
    fetchInfo,
    fetchConfiguration,
  };
};
