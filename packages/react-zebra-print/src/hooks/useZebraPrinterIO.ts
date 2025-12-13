import { useCallback, useState } from "react";
import type {
  ReadOptions,
  SendOptions,
  ZebraDevice,
} from "zebra-web-bridge";
import { read as defaultRead, send as defaultSend } from "zebra-web-bridge";

export type PrinterIOClient = {
  read: (options: ReadOptions) => Promise<string>;
  send: (options: SendOptions) => Promise<string>;
};

export type UseZebraPrinterIOOptions = {
  device?: ZebraDevice | null;
  client?: PrinterIOClient;
};

type ReadOverrides = Omit<ReadOptions, "device">;
type SendOverrides = Omit<SendOptions, "device" | "data">;

export type UseZebraPrinterIOState = {
  sending: boolean;
  reading: boolean;
  error: Error | undefined;
  lastResponse: string | undefined;
  readFromPrinter: (overrides?: ReadOverrides) => Promise<string>;
  sendToPrinter: (data: string, overrides?: SendOverrides) => Promise<string>;
};

const normalizeError = (error: unknown): Error => {
  if (error instanceof Error) {
    return error;
  }
  return new Error(typeof error === "string" ? error : "Unknown Zebra error");
};

const ensureDevice = (device?: ZebraDevice | null): ZebraDevice => {
  if (!device || !device.uid) {
    throw new Error("A Zebra device with a uid is required");
  }
  return device;
};

const defaultClient: PrinterIOClient = {
  read: defaultRead,
  send: defaultSend,
};

export const useZebraPrinterIO = (
  options: UseZebraPrinterIOOptions
): UseZebraPrinterIOState => {
  const client = options.client ?? defaultClient;
  const device = options.device;

  const [sending, setSending] = useState(false);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [lastResponse, setLastResponse] = useState<string | undefined>(
    undefined
  );

  const sendToPrinter = useCallback(
    async (data: string, overrides?: SendOverrides) => {
      setSending(true);
      setError(undefined);
      try {
        const response = await client.send({
          device: ensureDevice(device),
          data,
          ...(overrides ?? {}),
        });
        setLastResponse(response);
        return response;
      } catch (err) {
        const normalized = normalizeError(err);
        setError(normalized);
        throw normalized;
      } finally {
        setSending(false);
      }
    },
    [client, device]
  );

  const readFromPrinter = useCallback(
    async (overrides?: ReadOverrides) => {
      setReading(true);
      setError(undefined);
      try {
        const response = await client.read({
          device: ensureDevice(device),
          ...(overrides ?? {}),
        });
        setLastResponse(response);
        return response;
      } catch (err) {
        const normalized = normalizeError(err);
        setError(normalized);
        throw normalized;
      } finally {
        setReading(false);
      }
    },
    [client, device]
  );

  return {
    sending,
    reading,
    error,
    lastResponse,
    readFromPrinter,
    sendToPrinter,
  };
};
