import { read } from "./read";
import { send } from "./send";
import type { ZebraDevice } from "../types";
import type { UrlOptions } from "./urlConstructor";

export type GetConfigurationOptions = {
  device: ZebraDevice;
  timeoutMs?: number;
} & Partial<UrlOptions>;

const CONFIG_COMMAND = "^XA^HH^XZ";

export const getConfiguration = async (
  options: GetConfigurationOptions
): Promise<string> => {
  const { device, ...overrides } = options;

  await send({
    device,
    data: CONFIG_COMMAND,
    ...overrides,
  });

  return read({
    device,
    ...overrides,
  });
};
