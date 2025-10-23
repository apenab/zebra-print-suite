import { useCallback, useEffect, useState } from "react";
import { getLocalDevices, type ZebraDevice } from "zebra-web-bridge";
import type { Printer } from "../types/printer";

export type PrinterClient = {
  listPrinters: () => Promise<Printer[]>;
};

export type UseZebraPrintersOptions = {
  client?: PrinterClient;
};

export type UseZebraPrintersState = {
  printers: Printer[];
  loading: boolean;
  error: Error | undefined;
  refresh: () => Promise<void>;
};

const DEFAULT_DEVICE_TYPE = "printer";

const toPrinter = (device: ZebraDevice): Printer => {
  const fallbackId =
    device.uid ??
    device.name ??
    `${device.deviceType ?? "printer"}:${device.connection ?? "unknown"}`;

  return {
    id: fallbackId,
    name: device.name ?? fallbackId,
  };
};

const defaultClient: PrinterClient = {
  async listPrinters() {
    const devices = await getLocalDevices({ deviceType: DEFAULT_DEVICE_TYPE });
    return devices.map(toPrinter);
  },
};

const normalizeError = (error: unknown): Error => {
  if (error instanceof Error) {
    return error;
  }

  return new Error(typeof error === "string" ? error : "Unknown printer error");
};

export const useZebraPrinters = (
  options: UseZebraPrintersOptions = {}
): UseZebraPrintersState => {
  const client = options.client ?? defaultClient;
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | undefined>(undefined);

  const loadPrinters = useCallback(async () => {
    setLoading(true);
    setError(undefined);

    try {
      const result = await client.listPrinters();
      setPrinters(result);
    } catch (err) {
      setPrinters([]);
      setError(normalizeError(err));
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    void loadPrinters();
  }, [loadPrinters]);

  const refresh = useCallback(async () => {
    await loadPrinters();
  }, [loadPrinters]);

  return {
    printers,
    loading,
    error,
    refresh,
  };
};
