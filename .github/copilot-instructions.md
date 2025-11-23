<!-- Copilot instructions for contributing code and making targeted edits. Keep short and actionable. -->

# Copilot / Agent Guidance — zebra-print-suite

This file contains repository-specific guidance for AI coding agents working in this monorepo.

1. Big picture

- Monorepo managed with `pnpm` workspaces. Top-level scripts use `pnpm --filter` to target packages.
- Two library packages: `packages/zebra-web-bridge` (TypeScript SDK for BrowserPrint) and `packages/react-zebra-print` (React hook + bundles). `apps/demo` is a Vite app that consumes the packaged output.

2. Important implementation details (use as quick references)

- `packages/zebra-web-bridge/src/api/httpClient.ts`: core HTTP primitives — `resolveUrlOptions`, `withAbortTimeout`, `fetchJson`, default host `127.0.0.1`, ports `9100/9101`, default timeout `3000ms`.
- `packages/zebra-web-bridge/src/api/urlConstructor.ts`: `EndpointsMap` and `getEndpointUrl` — use this to build endpoint URLs.
- `packages/zebra-web-bridge/src/api/getLocalDevices.ts`: canonical example of calling the client primitives, normalizing payloads, and wrapping errors into `ZebraError`.
- `packages/zebra-web-bridge/src/utils/deviceNormalization.ts`: normalization helpers (`normalizeDevice`, `normalizeDeviceArray`, `isRecord`) — use when parsing BrowserPrint responses.
- `packages/react-zebra-print/src/hooks/useZebraPrinters.ts`: hook patterns and default client that calls `getLocalDevices({ deviceType: 'printer' })`. Shows how custom `PrinterClient` is injected.

3. Error and type conventions

- Errors coming from network/parsing/timeouts are wrapped in `ZebraError` using `ZebraErrorCode.SERVICE_UNAVAILABLE`. Preserve this behaviour when adding new network calls.
- Normalized device model lives in `packages/zebra-web-bridge/src/types.ts` (imported in `src/index.ts`). Prefer returning strongly typed values.

4. Build / dev / test workflows (concrete commands)

- Install: `pnpm install` (from repo root).
- Dev (recommended, real build output): `pnpm run dev:watch` — builds `react-zebra-print` with `vite build --watch` and runs the demo; ensures demo consumes emitted `dist/` artifacts.
- Fast dev aliasing (temporary, only for quick iteration): edit `apps/demo/vite.config.ts` to alias `react-zebra-print` to `packages/react-zebra-print/src`. Remove alias before publishing.
- Build libraries: `pnpm run build` (root) or `pnpm --filter react-zebra-print build` / `pnpm --filter zebra-web-bridge build`.
- Run tests per package: `pnpm --filter zebra-web-bridge test` and `pnpm --filter react-zebra-print test`.

5. Patterns to follow when editing or adding features

- Reuse `getEndpointUrl` + `resolveUrlOptions` + `withAbortTimeout` + `fetchJson` for any new BrowserPrint endpoints (send/read/config). This preserves timeout, protocol/port selection and error wrapping.
- Normalize payloads with helpers from `utils/deviceNormalization.ts` rather than ad-hoc parsing.
- When adding public API surface to the bridge, export from `packages/zebra-web-bridge/src/index.ts` and update the README table if appropriate.
- `react-zebra-print` expects the bridge to return `ZebraDevice[]`. If you change the shape, update the hook conversion (`toPrinter`) in `useZebraPrinters.ts`.

6. Tests and environment notes

- Tests run with Vitest. React tests use `@testing-library/react` + Happy DOM (see package config). Look under `packages/*/src/__tests__` for examples.
- When writing tests that make network calls, reuse `withAbortTimeout` semantics in mocks and assert that `ZebraError` is thrown on timeout or bad JSON.

7. Where to look for examples

- Adding a new endpoint: mirror `getLocalDevices.ts` pattern (URL building -> fetchJson -> normalize -> wrap errors).
- Adding a React-facing feature: mirror `useZebraPrinters.ts` for state shape, `client` injection, and error normalization.

8. Quick pointers for reviewers

- Prefer small, focused changes. Ensure package exports are updated in `packages/*/src/index.ts` and that `pnpm --filter ... build` emits expected artifacts (`dist/index.mjs`, `index.cjs`, `index.d.ts` for `react-zebra-print`).
- Avoid changing the `dev:watch` behavior or demo aliasing unless the change improves fidelity between the demo and published output.

If anything here looks incomplete or you want more examples (tests, Vite configs, or release steps), tell me which area to expand and I'll update this file. 9. Repository-specific patterns & examples

- Bridge URL / fetch pattern: always build URLs with `getEndpointUrl(resolveUrlOptions(...))`, call `withAbortTimeout(timeoutMs, signal => fetchJson(url, signal))`, then `isRecord(payload)` and normalize via `normalizeDeviceArray` / `normalizeDevice`.
- Payload compatibility: support both `{ deviceList: [...] }` and the legacy `{"printer": [...]}` keyed formats. See `getLocalDevices.ts` for the exact detection order and fallback logic.
- Error handling: wrap non-ZebraError exceptions into `new ZebraError(ZebraErrorCode.SERVICE_UNAVAILABLE, message, { cause })` before rethrowing. See `getLocalDevices.ts` catch block.
- Hook pattern: `useZebraPrinters` provides a `client` injection point. Default client calls `getLocalDevices({ deviceType: 'printer' })`. When changing device shapes, update the `toPrinter` mapper in `useZebraPrinters.ts`.
- ID fallbacking: prefer `uid`, then `name`, then `${deviceType}:${connection}` as `id` (see `toPrinter` implementation).

10. Commit messages (Conventional Commits + package scope)

Agents must produce commit messages that follow Conventional Commits and include the package scope when relevant. Rules:

- Format: `<type>(<scope>): <short summary>`
- Types to use: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`, `ci`, `style`.
- Scope: use the package name under `packages/` or `apps/` (e.g. `zebra-web-bridge`, `react-zebra-print`, `demo`). If a change spans multiple packages, use `chore(monorepo):` or `chore(<multiple>):` with a brief note in the body listing packages.
- Body: optional, provide a short explanatory paragraph when the change is non-trivial. Add `BREAKING CHANGE:` footer when applicable.
- Examples:
  - `feat(zebra-web-bridge): add getApplicationConfiguration support`
  - `fix(react-zebra-print): handle devices without names in toPrinter`
  - `chore(demo): update vite alias for fast dev`
  - `chore(monorepo): release prep for react-zebra-print and zebra-web-bridge`

Agent checklist for commit/PR titles

- If editing a single package, use that package as scope. (e.g., `fix(zebra-web-bridge): ...`)
- If the change is a demo-only tweak, scope `demo` or `apps/demo` is acceptable.
- Ensure the short summary is imperative, present-tense and less than ~72 characters.
- Put implementation details and rationale in the commit body; reference tests added/changed.

Optional automation suggestions (do not add without approval)

- Adopt `commitlint` + `husky` + `@commitlint/config-conventional` to enforce formatting locally/CI.
- Optionally add a small `commit-msg` hook that extracts package scope from changed files (e.g., first matched `packages/<name>/`) to suggest a scope.
