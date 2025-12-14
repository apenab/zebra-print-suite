import { read } from "./read";
import { send } from "./send";
import type { ZebraDevice } from "../types";
import type { UrlOptions } from "./urlConstructor";

export type GetStatusOptions = {
  device: ZebraDevice;
  timeoutMs?: number;
} & Partial<UrlOptions>;

const STATUS_COMMAND = "~hs\r\n";

export const getStatus = async (options: GetStatusOptions): Promise<string> => {
  const { device, ...overrides } = options;

  await send({
    device,
    data: STATUS_COMMAND,
    ...overrides,
  });

  return read({
    device,
    ...overrides,
  });
};
