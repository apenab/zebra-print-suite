import { describe, expect, it, vi, afterEach } from "vitest";

import { getConfiguration } from "../api/getConfiguration";
import { getInfo } from "../api/getInfo";
import { getStatus } from "../api/getStatus";
import type { ZebraDevice } from "../types";

vi.mock("../api/send", () => ({
  send: vi.fn().mockResolvedValue("OK"),
}));

vi.mock("../api/read", () => ({
  read: vi.fn().mockResolvedValue("RESPONSE"),
}));

const device: ZebraDevice = {
  name: "Zebra Printer",
  deviceType: "printer",
  connection: "usb",
  uid: "usb:123",
  manufacturer: "Zebra",
};

describe("getStatus / getInfo / getConfiguration", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("sends the status command then reads the response", async () => {
    const { send } = await import("../api/send");
    const { read } = await import("../api/read");

    const response = await getStatus({
      device,
      timeoutMs: 5000,
      host: "192.168.0.10",
    });

    expect(send).toHaveBeenCalledWith({
      device,
      data: "~hs\r\n",
      timeoutMs: 5000,
      host: "192.168.0.10",
    });
    expect(read).toHaveBeenCalledWith({
      device,
      timeoutMs: 5000,
      host: "192.168.0.10",
    });
    expect(response).toBe("RESPONSE");
  });

  it("sends the info command then reads the response", async () => {
    const { send } = await import("../api/send");
    const { read } = await import("../api/read");

    await getInfo({ device });

    expect(send).toHaveBeenCalledWith({
      device,
      data: "~hi\r\n",
    });
    expect(read).toHaveBeenCalledWith({ device });
  });

  it("sends the configuration command then reads the response", async () => {
    const { send } = await import("../api/send");
    const { read } = await import("../api/read");

    await getConfiguration({ device });

    expect(send).toHaveBeenCalledWith({
      device,
      data: "^XA^HH^XZ",
    });
    expect(read).toHaveBeenCalledWith({ device });
  });
});
