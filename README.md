# Service Health Dashboard

A React + TypeScript single-page app for monitoring the health of backend services: pod readiness, availability,
per-endpoint traffic, 5xx error rate and p95 latency, plus a guarded enable/disable control.

It runs entirely on a built-in mock API, so it needs no backend, cluster or credentials.

## Stack

React 19 · TypeScript (strict) · Vite · React Router · Apache ECharts · Vitest + Testing Library

## Run it

```sh
npm install
npm run dev        # http://localhost:5173
npm test           # unit + component tests
npm run build      # type-check and production build
```

## Design notes

- **Swappable backend.** Components only know the `ApiClient` interface (`src/api/apiClient.ts`). The mock in
  `src/api/mockApi.ts` implements it; a real REST client can replace it in `main.tsx` without touching any component.
- **Availability is based on 5xx, not "not 2xx".** A 400/404/422 means the API is rejecting bad requests as designed,
  so a burst of client errors must not turn a healthy service red. See `src/lib/health.ts`.
- **No stale responses.** `useAsync` cancels the previous request with an `AbortSignal` when the time range changes,
  so a slow response for an old range can never overwrite a newer one.
- **Safe admin control.** Disabling needs a confirmation, the button locks while a change is in flight, and if the
  real state cannot be read the UI shows "unknown" and offers no action instead of acting on a guess.

## Layout

```
src/
  api/          ApiClient interface + deterministic mock
  components/   StatusBadge, StatCard, TimeSeriesChart, TimeRangeSelector, AdminPanel, EndpointSection
  hooks/        useAsync (abortable data loading)
  lib/          health.ts (status rules)
  pages/        ServicesPage, ServiceDetailPage
```
