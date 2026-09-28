# Sentinel — Smart Underground Drainage Monitoring & Sewer Blockage Alert System

React + TypeScript + Vite + Tailwind CSS v4 +
Recharts + Leaflet + Framer Motion.

## Run it

```bash
npm install
npm run dev       # local dev server
npm run build     # production build → dist/
```

## What's included

- **Landing page** (`/`) → CTA into the dashboard
- **Overview** (`/dashboard`) — KPI grid, live system status, critical alerts, sector snapshot
- **Live Monitoring** (`/live`) — per-node sensor cards + real-time charts, 1H/6H/24H/7D/30D ranges
- **Drainage Map** (`/map`) — Leaflet map, color-coded node/gateway markers, popups, status/sector filters
- **Nodes** (`/nodes`) — searchable/sortable/filterable table of all 200 nodes, paginated
- **Node detail** (`/nodes/:id`) — full sensor readout, historical charts, network info, events, demo controls
- **Alerts** (`/alerts`) — tabbed alert center (All/Critical/Warning/Resolved/Tamper/Flood/Gas/Network)
- **Analytics** (`/analytics`) — sector water/battery trends, alert frequency, uptime, packet loss
- **AI Predictions** (`/predictions`) — simulated blockage-risk predictions, risk matrix, explanations
- **Network** (`/network`) — gateway cards, ESP-NOW mesh tree by hop count, architecture diagram
- **Maintenance** (`/maintenance`) — calibration/battery/signal/tamper task queue
- **System Settings** (`/settings`) — demo thresholds (explicitly labeled, not certified safety limits)

All pages share one collapsible sidebar + header shell (`src/components/layout`).

## Architecture — real hardware data

Every page reads data through hooks in `src/hooks/useDrainageData.ts`, which
call two adapters:

```
src/services/hardware/
  HardwareAdapter.ts       <- interface (contract)
  MockHardwareAdapter.ts   <- current implementation, in-memory simulation engine
  RealHardwareAdapter.ts   <- REST/WebSocket hardware integration
  index.ts                 <- production adapter by default

src/services/ml/
  MlAdapter.ts, MockMlAdapter.ts, index.ts  <- same pattern for blockage prediction

src/services/api/ApiClient.ts  <- typed fetch() wrapper for the backend
```

No component in `src/pages` or `src/components` imports mock data directly.
Production mode is the default and reads only from the backend configured in
`.env`. Mock data is available only when `VITE_USE_MOCK_DATA=true`.

Create `.env.local` from `.env.example` and set:

```bash
VITE_USE_MOCK_DATA=false
VITE_API_BASE_URL=http://localhost:8000/api
VITE_TELEMETRY_WS_URL=ws://localhost:8000/ws/telemetry
```

The frontend expects the REST responses to match the TypeScript domain types in
`src/types/index.ts`. Telemetry WebSocket messages may be either a `DrainNode[]`
or `{ "nodes": DrainNode[] }` / `{ "data": DrainNode[] }`. The browser displays
the values received from the backend without generating replacements.

Expected future REST surface (see `RealHardwareAdapter.ts` for the full list):
`GET /api/nodes`, `GET /api/nodes/:id`, `GET /api/nodes/:id/readings`,
`GET /api/alerts`, `POST /api/alerts/:id/acknowledge`, `GET /api/gateways`,
`GET /api/network/topology`, `GET /api/maintenance`, `POST /api/ml/predict`.

## Local mock mode

Set `VITE_USE_MOCK_DATA=true` only when you need the local simulation. The
simulation controls are hidden automatically in production hardware mode.

## Data labeling

Per the project brief, this is a safety-critical infrastructure concept, so:
- Synthetic data is explicitly marked **"Simulated data"** where shown.
- Demo alert thresholds are labeled as demo values, not certified limits.
- No "explosion proof" / "certified safe" language appears anywhere —
  copy instead says "prototype architecture" / "designed for hazardous
  environments" / "certification required for production deployment."

## Known trade-offs in this build

- The main JS bundle is ~270 kB gzipped (Leaflet + Recharts + Framer Motion
  pulled in eagerly). Route-level code-splitting (`React.lazy`) would trim
  this further if needed for production.
- Map tiles load from the public OpenStreetMap tile server at runtime, so an
  internet connection is needed in the browser that opens the app (this
  sandbox's own network restrictions don't affect the built static files).
- Mock data is seeded (stable node layout across reloads) but the live
  simulation tick is stateful in memory only — refreshing the page resets it.
