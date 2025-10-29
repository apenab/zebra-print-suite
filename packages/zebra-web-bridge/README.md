# zebra-web-bridge

TypeScript SDK that talks to the local Zebra BrowserPrint service. It ships strict types, graceful timeouts, and a normalized device payload so React or Node clients can consume printers without parsing BrowserPrint responses manually.

## Features

- Normalizes both the legacy `deviceType -> []` payload and the current `{ deviceList: [] }` format.
- Filters devices by `deviceType` out of the box (defaults to all devices).
- Resolves `http`/`https` automatically based on `window.location.protocol` and switches ports (`9100`/`9101`) accordingly.
- Surface-level errors are wrapped in a typed `ZebraError` with the `SERVICE_UNAVAILABLE` code for timeouts, aborted requests, bad status codes, or invalid JSON.

## Quick start

```ts
import { getLocalDevices } from "zebra-web-bridge";

async function loadPrinters() {
  // By default it targets http://127.0.0.1:9100/available
  const printers = await getLocalDevices({ deviceType: "printer" });
  console.log(printers);
}
```

Override the protocol/host/port when you need to reach a remote BrowserPrint instance:

```ts
await getLocalDevices({
  deviceType: "printer",
  protocol: "https",
  host: "192.168.0.42",
  port: 9101,
  timeoutMs: 5_000,
});
```

When the service is unreachable or returns invalid data, catch the `ZebraError` to surface a friendly message to end users:

```ts
import { getLocalDevices, ZebraError, ZebraErrorCode } from "zebra-web-bridge";

try {
  await getLocalDevices();
} catch (error) {
  if (
    error instanceof ZebraError &&
    error.code === ZebraErrorCode.SERVICE_UNAVAILABLE
  ) {
    // Inform the user that BrowserPrint is offline or misconfigured.
  }
}
```

## API surface

- `getLocalDevices(options?)` – Returns a `Promise<ZebraDevice[]>`. Accepts:
  - `deviceType` (`"printer"` et al.) for filtering.
  - `timeoutMs` (default `3000`).
  - Optional `protocol`, `host`, and `port`.
- `ZebraErrorCode` and `ZebraError` – Typed error wrapper for any BrowserPrint connectivity or parsing problem.
- `ZebraDevice` – Normalized shape returned by `getLocalDevices`.
- `GetLocalDevicesOptions` – Options bag type for the function above.

## Development

```bash
pnpm install                    # from the monorepo root
pnpm --filter zebra-web-bridge build
pnpm --filter zebra-web-bridge test
```

Vitest covers the request lifecycle, including timeouts, filtering, and error propagation. Contributions should ship with accompanying unit tests.

## Zebra Web Bridge — Implementation Tracker

**Legend:**

- ✅ Implemented
- 🟡 Partial / WIP
- ⬜️ Not started

---

## Core / BrowserPrint-level

| Status | Method                                          | Notes / Source |
| :----: | ----------------------------------------------- | -------------- |
|   ✅   | `getLocalDevices(options)`                      |
|  ⬜️   | `getDefaultDevice(type)`                        | Pending.       |
|  ⬜️   | `getApplicationConfiguration()`                 | Pending.       |
|  ⬜️   | `send(uid, data, options?)`                     | Pending.       |
|  ⬜️   | `read(uid, options?)`                           | Pending.       |
|  ⬜️   | `readAllAvailable(uid, options?)`               | Pending.       |
|  ⬜️   | `sendThenRead(uid, data, options?)`             | Pending.       |
|  ⬜️   | `sendThenReadAllAvailable(uid, data, options?)` | Pending.       |
|  ⬜️   | `convert(fileOrUrl, options?)`                  | Pending.       |
|  ⬜️   | `scanImage(fileOrUrl, options?)`                | Pending.       |
|  ⬜️   | `loadFileFromUrl(url)`                          | Pending.       |

---

## Zebra-specific (Printer extensions)

| Status | Method                           | Notes / Source |
| :----: | -------------------------------- | -------------- |
|  ⬜️   | `getStatus(uid, options?)`       | Pending.       |
|  ⬜️   | `getInfo(uid)`                   | Pending.       |
|  ⬜️   | `getConfiguration(uid)`          | Pending.       |
|  ⬜️   | `setSGD(uid, key, value)`        | Pending.       |
|  ⬜️   | `getSGD(uid, key)`               | Pending.       |
|  ⬜️   | `setThenGetSGD(uid, key, value)` | Pending.       |
|  ⬜️   | `query(uid, command)`            | Pending.       |
|  ⬜️   | `watch(uid, cb, options?)`       | Pending.       |
|  ⬜️   | `stopWatching(uid)`              | Pending.       |

---

## Shared Types & Utilities

| Status | Item                       | Notes / Source                                                                                                                                                        |
| :----: | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   ✅   | `ZebraDevice`              | Defined in `src/api/getLocalDevices.ts`.                                                                                                                              |
|   ✅   | `ZebraErrorCode`           | `SERVICE_UNAVAILABLE` implemented in `src/api/getLocalDevices.ts`.                                                                                                    |
|   ✅   | `ZebraError`               | Implemented (custom error with `code`) in `src/api/getLocalDevices.ts`.                                                                                               |
|   🟡   | `pickEndpointByProtocol`   | Currently via `resolveProtocol()` + `urlConstructor` usage in `getLocalDevices`. Consider extracting to `src/utils/pickEndpointByProtocol.ts`.                        |
|   🟡   | `normalizeDeviceResponse`  | Partially covered by `toDeviceArray`, `fromDeviceList`, `selectDevicesByType` in `getLocalDevices.ts`. Consider extracting to `src/utils/normalizeDeviceResponse.ts`. |
|   ✅   | `fetchJson(url, signal)`   | Implemented in `getLocalDevices.ts` (status check + robust JSON parse + ZebraError).                                                                                  |
|  ⬜️   | `withTimeout(promise, ms)` | Currently done inline with `AbortController` in `getLocalDevices`. Consider a reusable util in `src/utils/withTimeout.ts`.                                            |
|   ✅   | `urlConstructor`           | Used via `getEndpointUrl` (imported). Lives in `src/api/urlConstructor.ts`.                                                                                           |

---
