# Zebra Print Suite

Easily integrate Zebra printers into your web applications. This set of libraries lets you discover, communicate with, and send ZPL commands to Zebra printers through the [Zebra BrowserPrint](https://www.zebra.com/us/en/support-downloads/printer-software/by-request-software.html) service.

## What problem does it solve?

Communicating with Zebra printers from the browser requires interacting with the local BrowserPrint service, which exposes an HTTP API. This suite abstracts all that complexity:

- Automatically discovers connected printers
- Handles bidirectional communication (send ZPL, read responses)
- Normalizes responses across service versions
- Provides strict TypeScript types and robust error handling

## Prerequisites

Before using these libraries, make sure the **Zebra BrowserPrint** service is installed on the machine running the browser:

1. Download [Zebra BrowserPrint](https://www.zebra.com/us/en/support-downloads/printer-software/by-request-software.html) from the official Zebra site
2. Install and run the service (listens on ports 9100/9101)
3. Connect your Zebra printer via USB, network, or Bluetooth

## Available packages

| Package                                                      | Description                                                          | Installation                    |
| ------------------------------------------------------------ | -------------------------------------------------------------------- | ------------------------------- |
| [`zebra-web-bridge`](packages/zebra-web-bridge/README.md)    | Low-level TypeScript SDK. Works with any framework or vanilla JS     | `npm install zebra-web-bridge`  |
| [`react-zebra-print`](packages/react-zebra-print/README.md)  | React hooks for declarative printer integration                      | `npm install react-zebra-print` |

## Quick start

### With React

```tsx
import { useZebraPrinters, useZebraPrinterIO } from "react-zebra-print";

function PrinterPanel() {
  const { printers, loading, error, refresh } = useZebraPrinters();
  const [selectedPrinter, setSelectedPrinter] = useState(null);

  const { sendToPrinter, sending } = useZebraPrinterIO({
    device: selectedPrinter
  });

  const printLabel = async () => {
    const zpl = `^XA^FO50,50^A0N,50,50^FDHello World^FS^XZ`;
    await sendToPrinter(zpl);
  };

  if (loading) return <p>Detecting printers…</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <select onChange={(e) => setSelectedPrinter(printers[e.target.value])}>
        {printers.map((p, i) => (
          <option key={p.id} value={i}>{p.name}</option>
        ))}
      </select>
      <button onClick={printLabel} disabled={sending}>
        Print label
      </button>
    </div>
  );
}
```

### Without a framework (TypeScript/JavaScript)

```ts
import {
  getLocalDevices,
  send,
  getStatus,
  ZebraError
} from "zebra-web-bridge";

// Discover printers
const printers = await getLocalDevices({ deviceType: "printer" });
console.log("Printers found:", printers);

// Send ZPL to a printer
const zpl = `^XA^FO50,50^A0N,50,50^FDHello World^FS^XZ`;
await send({ device: printers[0], data: zpl });

// Query printer status
const status = await getStatus(printers[0].uid);
console.log("Status:", status);
```

## Key features

### zebra-web-bridge

- **Device discovery** — `getLocalDevices()`, `getDefaultDevice()`
- **Bidirectional communication** — `send()`, `read()`
- **Printer queries** — `getStatus()`, `getInfo()`, `getConfiguration()`
- **Service configuration** — `getApplicationConfiguration()`
- **Auto protocol detection** — HTTP (port 9100) or HTTPS (port 9101) based on context
- **Configurable timeouts** — Defaults to 3 seconds, customizable per operation
- **Typed errors** — `ZebraError` with specific codes for debugging

### react-zebra-print

- **`useZebraPrinters()`** — Discovers and lists printers with loading state and refresh
- **`useZebraPrinterIO()`** — Sends and receives data from a specific printer
- **Custom clients** — Inject your own fetching logic (caching, polling, remote APIs)
- **Optimized bundles** — ESM and CJS with TypeScript types included

## Error handling

```ts
import { getLocalDevices, ZebraError, ZebraErrorCode } from "zebra-web-bridge";

try {
  const printers = await getLocalDevices();
} catch (error) {
  if (error instanceof ZebraError) {
    if (error.code === ZebraErrorCode.SERVICE_UNAVAILABLE) {
      // BrowserPrint service is not running
      console.error("Please start the Zebra BrowserPrint service");
    }
  }
}
```

## Project structure

```text
zebra-print-suite/
├── packages/
│   ├── zebra-web-bridge/     # TypeScript SDK (no framework dependencies)
│   └── react-zebra-print/    # React hooks
└── apps/
    └── demo/                 # Demo application
```

## Development

```bash
# Install dependencies
pnpm install

# Development mode (build + demo with hot reload)
pnpm run dev

# Run tests
pnpm --filter zebra-web-bridge test
pnpm --filter react-zebra-print test

# Production build
pnpm run build
```

## Further documentation

- [zebra-web-bridge — Full API and implementation tracker](packages/zebra-web-bridge/README.md)
- [react-zebra-print — Hooks and custom clients](packages/react-zebra-print/README.md)
