# react-zebra-print

React hook that wraps the `zebra-web-bridge` SDK to expose a declarative interface for discovering Zebra printers from BrowserPrint-enabled environments. The package ships ESM/CJS bundles plus `.d.ts` files generated with `vite-plugin-dts`.

## Features

- `useZebraPrinters()` hook that tracks printers, loading state, errors, and refresh logic.
- Default client powered by `getLocalDevices({ deviceType: "printer" })`, so no wiring required for the common case.
- Ability to inject a custom `PrinterClient` for advanced fetching strategies (caching, polling, remote APIs).
- Lightweight printer model: `{ id, name, isDefault? }`.
- Tested with Vitest and `@testing-library/react` using Happy DOM.

## Quick start

```tsx
import { useZebraPrinters } from "react-zebra-print";

export function PrintersList() {
  const { printers, loading, error, refresh } = useZebraPrinters();

  if (loading) return <p>Detecting printers…</p>;
  if (error) return <p>Could not load printers: {error.message}</p>;

  return (
    <div>
      <ul>
        {printers.map((printer) => (
          <li key={printer.id}>{printer.name}</li>
        ))}
      </ul>
      <button type="button" onClick={() => void refresh()}>
        Refresh
      </button>
    </div>
  );
}
```

## Custom clients

Provide your own `PrinterClient` when you need to call a backend service or apply custom selection logic:

```ts
import type { PrinterClient } from "react-zebra-print";

const cloudPrinterClient: PrinterClient = {
  async listPrinters() {
    const response = await fetch("/api/printers");
    return (await response.json()).printers;
  },
};
```

```tsx
const { printers } = useZebraPrinters({ client: cloudPrinterClient });
```

Whatever you throw, `useZebraPrinters` will surface it via the `error` field after normalizing the value into an `Error` instance.

## Development

```bash
pnpm install                            # from the monorepo root
pnpm --filter react-zebra-print build   # generates dist/ (ESM, CJS, d.ts)
pnpm --filter react-zebra-print test
pnpm --filter demo dev                  # demo app consuming this package
```

The Vite-powered build emits production-ready bundles, while the demo relies on the published output to mimic real-world usage. Add or update Vitest suites when changing hook behavior.
