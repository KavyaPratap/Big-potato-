# 🚰 DrainWatch — Smart Drainage Monitoring System

> Real-time underground drainage infrastructure monitoring using LoRa mesh networking, IoT sensors, and a live web dashboard.

**Deployed at:** Beta I, Greater Noida, Uttar Pradesh 201310

---

## 📸 System Overview

DrainWatch is an IoT-based drainage monitoring system that detects:
- 🌊 **Water levels** and **overflow** in drains
- 💨 **Toxic gases** — Methane (CH4), Hydrogen Sulfide (H2S), Air Quality (MQ135)
- 🌡️ **Temperature & Humidity** inside drainage chambers
- 🔋 **Battery health** of remote sensor nodes
- 📡 **Signal quality** (RSSI / SNR) across the LoRa mesh

All sensor data is streamed live to a web dashboard and stored in both a local PostgreSQL database and Supabase (cloud).

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        FIELD HARDWARE                        │
│                                                              │
│  [ESP32 Slave Node 1]  ──LoRa 433MHz──►  [ESP32 Master]     │
│  [ESP32 Slave Node 2]  ──LoRa 433MHz──►  (SX1278 + OLED)    │
│                                              │               │
│                                         WiFi HTTP POST       │
└──────────────────────────────────────────────────────────────┘
                                               │
                                               ▼
┌──────────────────────────────────────────────────────────────┐
│                     FastAPI BACKEND  (:3000)                 │
│                                                              │
│  POST /lora-data  ← ESP32 master posts form-encoded data     │
│  GET  /api/nodes  · /api/alerts · /api/gateways · /api/ml   │
│  WS   /ws/telemetry  ← live push every 5 s                  │
│                                                              │
│  Dual-write:  Local PostgreSQL  ←→  Supabase (cloud)         │
└──────────────────────────────────────────────────────────────┘
                                               │
                                               ▼
┌──────────────────────────────────────────────────────────────┐
│               React + Vite FRONTEND  (:5173)                 │
│                                                              │
│  Overview · Map · Nodes · Alerts · Network · Predictions     │
│  Live WebSocket updates · OpenStreetMap (Leaflet)            │
└──────────────────────────────────────────────────────────────┘
```

---

## 📡 Hardware

### Master Node (Gateway)
| Component | Detail |
|-----------|--------|
| MCU | ESP32-S3 |
| Radio | SX1278 LoRa @ 433 MHz |
| Display | SSD1306 OLED 128×64 |
| Connectivity | WiFi → HTTP POST to backend |
| Pinout | SCK=12, MISO=13, MOSI=11, SS=10, RST=9, DIO0=8 |
| I2C (OLED) | SDA=4, SCL=5 |

### Slave Nodes (Sensor Nodes)
| Component | Detail |
|-----------|--------|
| MCU | ESP32 |
| Radio | SX1278 LoRa @ 433 MHz |
| Sensors | MQ135 (air quality), gas sensor (CH4/H2S), DHT (Temp/Hum) |
| Water | Ultrasonic / resistive level sensor + flow meter |

### Deployed Node Locations
| Node | Role | Location | GPS Coordinates |
|------|------|----------|-----------------|
| Node 0 | Master (Gateway) | Block A, Beta I, Greater Noida | `28.476502, 77.504466` |
| Node 1 | Slave | Block A, Beta I, Greater Noida | `28.477414, 77.503938` |
| Node 2 | Slave | Block B, Beta I, Greater Noida | `28.478387, 77.504407` |

### LoRa Packet Format (Slave → Master)
```
NODE=1,PKT=5,TEMP=26.3,HUM=58.2,MQ135=310,H2S=45,CH4=80,WLVL=50,WFLOW=1.2,BAT=85
```

---

## 🗂️ Project Structure

```
Big-potato-/
├── backend/
│   ├── main.py          # FastAPI app — all API endpoints + WebSocket
│   ├── db.py            # Dual-write DB layer (local PG + Supabase)
│   ├── init_pg.py       # One-time DB setup / schema migration
│   ├── .env             # DB credentials (not committed)
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── pages/       # OverviewPage, MapPage, NodesPage, AlertsPage…
│   │   ├── components/  # dashboard, map, alerts, charts, layout, ui
│   │   ├── hooks/       # useDrainageData (REST + WebSocket)
│   │   ├── services/    # RealHardwareAdapter, ApiMlAdapter
│   │   └── types/       # TypeScript domain types
│   ├── .env             # VITE_API_BASE_URL, VITE_TELEMETRY_WS_URL
│   └── package.json
│
└── src/
    └── main.cpp         # ESP32 Master firmware (LoRa receiver + WiFi uploader)
```

---

## ⚡ Quick Start

### Prerequisites
- **Python** 3.10+
- **Node.js** 18+
- **PostgreSQL** 14+ running locally
- **PlatformIO** (for firmware flashing)

---

### 1 — Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env     # or create .env manually (see below)

# Initialize / migrate the database (safe to run anytime)
python init_pg.py

# Start the API server
python main.py
# → http://0.0.0.0:3000
```

**`backend/.env` variables:**
```env
# Local PostgreSQL
LOCAL_PG_HOST=localhost
LOCAL_PG_PORT=5432
LOCAL_PG_DB=drainwatch
LOCAL_PG_USER=postgres
LOCAL_PG_PASSWORD=your_password

# Supabase (online cloud sync)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_key

# Set "true" to disable cloud sync (fully offline mode)
DISABLE_ONLINE_SYNC=false
```

---

### 2 — Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Start dev server
npm run dev
# → http://localhost:5173
```

**`frontend/.env` variables:**
```env
# Set true for in-memory mock data (no backend needed)
VITE_USE_MOCK_DATA=false

# Backend REST base URL
VITE_API_BASE_URL=http://localhost:3000/api

# WebSocket (auto-derived from VITE_API_BASE_URL if blank)
VITE_TELEMETRY_WS_URL=ws://localhost:3000/ws/telemetry
```

---

### 3 — Firmware Flash (ESP32 Master)

1. Open in **PlatformIO**
2. Edit `src/main.cpp`:
   ```cpp
   // ⚠️ Set to your laptop's hotspot IP (run ipconfig to find it)
   #define SERVER_IP   "10.85.78.3"

   const char* WIFI_SSID     = "YourHotspot";
   const char* WIFI_PASSWORD = "YourPassword";
   ```
3. **PlatformIO → Upload**

---

## 🌐 API Reference

All endpoints served at `http://localhost:3000`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/lora-data` | Ingest LoRa data from ESP32 master (form-encoded) |
| `POST` | `/api/data` | Ingest data via JSON (for testing) |
| `GET` | `/api/nodes` | All nodes with latest sensor readings |
| `GET` | `/api/nodes/{id}` | Single node detail |
| `GET` | `/api/nodes/{id}/readings?hours=24` | Historical sensor readings |
| `GET` | `/api/alerts` | Active gas + flood alerts |
| `POST` | `/api/alerts/{id}/acknowledge` | Acknowledge an alert |
| `POST` | `/api/alerts/{id}/resolve` | Resolve an alert |
| `GET` | `/api/gateways` | Gateway status and mesh health |
| `GET` | `/api/network/topology` | Full mesh topology (nodes + edges) |
| `GET` | `/api/ml/predictions` | Blockage risk predictions per node |
| `GET` | `/api/events` | Last 20 system events |
| `GET` | `/api/db/status` | Local + Supabase connectivity status |
| `WS` | `/ws/telemetry` | Live node data stream (pushed every 5 s) |

---

## 📊 Sensor Normalization

Sensors are ADC-based (0–4095). **Clean-air baseline ≈ 400 ADC.**  
Values at or below baseline are treated as 0 (no hazard).

| Sensor | Raw Input | Output Unit | Formula |
|--------|-----------|-------------|---------|
| CH4 (Methane) | ADC 0–4095 | % LEL (0–100) | `max(0, (ADC−400) / 3695 × 100)` |
| H2S | ADC 0–4095 | ppm (0–50) | `max(0, (ADC−400) / 3695 × 50)` |
| MQ135 (Air Quality) | ADC 0–4095 | ADC offset | `400 + max(0, ADC−400)` |
| Water Level | % from sensor | % | Pass-through |
| Water Flow | L/min | L/min | Pass-through |
| Temperature | °C | °C | Pass-through |
| Humidity | % | % | Pass-through |
| Battery | % | % | Pass-through |

### Alert Thresholds

| Parameter | Warning | Critical |
|-----------|---------|----------|
| CH4 | > 10% LEL | > 20% LEL |
| H2S | > 5 ppm | > 10 ppm |
| Water Level | > 75% | ≥ 100% (overflow) |
| Node offline | — | No data for > 5 min |

---

## 🗄️ Database Schema

```sql
CREATE TABLE readings (
    id        SERIAL PRIMARY KEY,
    node_id   INTEGER     NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    temp      REAL,                      -- °C
    hum       REAL,                      -- %
    mq135     INTEGER     DEFAULT 0,     -- raw ADC
    h2s       INTEGER     DEFAULT 0,     -- raw ADC
    ch4       INTEGER     DEFAULT 0,     -- raw ADC
    rssi      INTEGER     DEFAULT 0,     -- dBm
    snr       REAL        DEFAULT 0,     -- dB
    packet    INTEGER     DEFAULT 0,     -- packet counter
    wlvl      INTEGER,                   -- water level %
    wflow     REAL,                      -- water flow L/min
    battery   REAL        DEFAULT 100    -- battery %
);

CREATE INDEX idx_readings_node_time ON readings (node_id, timestamp DESC);
```

**Sync strategy:**
- All **reads** → local PostgreSQL (low latency)
- All **writes** → local PG first (synchronous) then Supabase (async, fire-and-forget)
- Cloud sync failure is non-fatal and logged only

To re-run migrations on an existing database (safe, idempotent):
```bash
python init_pg.py
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Firmware | C++ · PlatformIO · Arduino SDK |
| Radio | SX1278 LoRa @ 433 MHz |
| Backend | Python 3.10+ · FastAPI · Uvicorn |
| Database (local) | PostgreSQL 14+ · psycopg2 |
| Database (cloud) | Supabase (PostgreSQL + REST API) |
| Frontend | React 19 · TypeScript · Vite 8 |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Map | Leaflet · react-leaflet · OpenStreetMap |
| Icons | Lucide React |
| Animation | Framer Motion |
| Real-time | WebSocket `/ws/telemetry` |

---

## 📄 License

MIT License

---

*Built for Smart City Infrastructure Monitoring · Beta I, Greater Noida, UP 201310*
