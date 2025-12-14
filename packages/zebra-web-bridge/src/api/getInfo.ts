import { read } from "./read";
import { send } from "./send";
import type { ZebraDevice } from "../types";
import type { UrlOptions } from "./urlConstructor";

export type GetInfoOptions = {
  device: ZebraDevice;
  timeoutMs?: number;
} & Partial<UrlOptions>;

const INFO_COMMAND = "~hi\r\n";

export const getInfo = async (options: GetInfoOptions): Promise<string> => {
  const { device, ...overrides } = options;

  await send({
    device,
    data: INFO_COMMAND,
    ...overrides,
  });

  return read({
    device,
    ...overrides,
  });
};
