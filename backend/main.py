from fastapi import FastAPI, Request, Form, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import asyncio
from contextlib import asynccontextmanager
from datetime import datetime, timezone
import json
import random

import db  # ← dual-write PostgreSQL layer

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Simulator disabled so physical nodes dictate online/offline status
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ──────────────────────────────────────────────
# HELPERS
# ──────────────────────────────────────────────
def parse_lora_string(raw: str) -> dict:
    """
    Parses the ESP32 slave packet format:
    NODE=1,PKT=5,TEMP=26.3,HUM=58.2,MQ135=310,H2S=45,CH4=80,WLVL=50,WFLOW=1.2,BAT=85
    """
    result = {}
    for part in raw.split(","):
        if "=" in part:
            k, v = part.split("=", 1)
            result[k.strip().upper()] = v.strip()
    return result


# ──────────────────────────────────────────────
# INGEST ENDPOINT  ← ESP32 Master posts here
# ──────────────────────────────────────────────
@app.post("/lora-data")
async def receive_lora_data(
    request: Request,
    data: str   = Form(default=""),
    rssi: int   = Form(default=0),
    snr:  float = Form(default=0.0),
    packet: int = Form(default=0),
):
    """Accept form-encoded POST from ESP32 Master (sendToServer function)."""
    parsed = parse_lora_string(data)

    try:
        node_id_str = parsed.get("NODE", "0")
        node_id = 0 if node_id_str.lower() == "master" else int(node_id_str)
        temp_s  = parsed.get("TEMP", "nan")
        hum_s   = parsed.get("HUM",  "nan")
        temp    = float(temp_s) if temp_s.lower() != "nan" else None
        hum     = float(hum_s)  if hum_s.lower()  != "nan" else None
        mq135   = int(float(parsed.get("MQ135", 0)))
        h2s     = int(float(parsed.get("H2S",   0)))
        ch4     = int(float(parsed.get("CH4",   0)))
        wlvl    = int(float(parsed.get("WLVL", 0))) if "WLVL" in parsed else None
        wflow   = float(parsed.get("WFLOW", 0.0)) if "WFLOW" in parsed else None
        bat     = float(parsed.get("BAT", 0.0)) if "BAT" in parsed else None
    except Exception as e:
        return JSONResponse({"status": "error", "message": str(e)}, status_code=400)

    ts = datetime.now(timezone.utc).isoformat()
    await db.insert_reading(node_id, ts, temp, hum, mq135, h2s, ch4, rssi, snr, packet, wlvl, wflow, bat)

    print(f"[{datetime.now().strftime('%H:%M:%S')}] Node {node_id} | "
          f"T={temp} H={hum} MQ135={mq135} H2S={h2s} CH4={ch4} WLVL={wlvl} FLOW={wflow} BAT={bat}")
    return {"status": "success", "node": node_id}


# Also accept JSON POST (for any future use / manual testing)
@app.post("/api/data")
async def receive_json_data(request: Request):
    try:
        body = await request.body()
        raw = body.decode("utf-8").strip()
        try:
            d = json.loads(raw)
            node_id_val = d.get("node", 0)
            node_id = 0 if str(node_id_val).lower() == "master" else int(node_id_val)
            temp    = d.get("temp")
            hum     = d.get("hum")
            mq135   = d.get("mq135", 0)
            h2s     = d.get("h2s", 0)
            ch4     = d.get("ch4", 0)
            rssi    = d.get("rssi", 0)
            snr     = d.get("snr", 0.0)
            packet  = d.get("packet", 0)
            wlvl    = d.get("wlvl")
            wflow   = d.get("wflow")
            bat     = d.get("bat")
        except json.JSONDecodeError:
            parsed  = parse_lora_string(raw)
            node_id_str = parsed.get("NODE", "0")
            node_id = 0 if node_id_str.lower() == "master" else int(node_id_str)
            temp    = float(parsed.get("TEMP", 0))
            hum     = float(parsed.get("HUM", 0))
            mq135   = int(float(parsed.get("MQ135", 0)))
            h2s     = int(float(parsed.get("H2S", 0)))
            ch4     = int(float(parsed.get("CH4", 0)))
            rssi    = 0; snr = 0.0; packet = 0
            wlvl    = int(float(parsed.get("WLVL", 0))) if "WLVL" in parsed else None
            wflow   = float(parsed.get("WFLOW", 0.0)) if "WFLOW" in parsed else None
            bat     = float(parsed.get("BAT", 0.0)) if "BAT" in parsed else None

        ts = datetime.now(timezone.utc).isoformat()
        await db.insert_reading(node_id, ts, temp, hum, mq135, h2s, ch4, rssi, snr, packet, wlvl, wflow, bat)
        return {"status": "success", "node": node_id}
    except Exception as e:
        return JSONResponse({"status": "error", "message": str(e)}, status_code=400)

async def simulate_node1():
    while True:
        try:
            ts = datetime.now(timezone.utc).isoformat()
            
            # Master Node (Node 0) - PG
            await db.insert_reading(0, ts, 26.5, 55.0, 400, 400, 400, -30, 0.0, 0, 0, 0.0, 100.0)
            
            # Slave Node 1 (Node 1) - Drainage Block A
            temp1 = 26.0 + random.uniform(-0.5, 0.5)
            hum1 = 50.0 + random.uniform(-2, 2)
            mq135_1 = int(400 + random.uniform(-10, 20))
            h2s_1 = int(400 + random.uniform(-5, 5))
            ch4_1 = int(400 + random.uniform(-10, 10))
            rssi1 = int(-45 + random.uniform(-5, 5))
            await db.insert_reading(1, ts, temp1, hum1, mq135_1, h2s_1, ch4_1, rssi1, 0.0, 0, 25, 0.5, 98.5)
            
            # Slave Node 2 (Node 2) - Block B
            temp2 = 25.5 + random.uniform(-0.5, 0.5)
            hum2 = 52.0 + random.uniform(-2, 2)
            mq135_2 = int(400 + random.uniform(-10, 20))
            h2s_2 = int(400 + random.uniform(-5, 5))
            ch4_2 = int(400 + random.uniform(-10, 10))
            rssi2 = int(-55 + random.uniform(-5, 5))
            await db.insert_reading(2, ts, temp2, hum2, mq135_2, h2s_2, ch4_2, rssi2, 0.0, 0, 0, 0.0, 99.0)
            
        except Exception as e:
            print(f"Simulate error: {e}")
        await asyncio.sleep(7)

# ──────────────────────────────────────────────
# NORMALIZATION HELPERS
# ──────────────────────────────────────────────
# Hackathon setup: sensors are in a room with clean air.
# We assume a baseline ADC value of ~400 for fresh air.
def norm_ch4(raw: int) -> float:
    # Baseline ~400. Map to % LEL.
    baseline = 400
    if raw <= baseline: return 0.0
    return round(min(100.0, (raw - baseline) / (4095 - baseline) * 100), 1)

def norm_h2s(raw: int) -> float:
    # Baseline ~400. Map to ppm. Toxic above 10 ppm, max e.g. 50 ppm.
    baseline = 400
    if raw <= baseline: return 0.0
    return round(min(50.0, (raw - baseline) / (4095 - baseline) * 50), 1)

def norm_mq135(raw: int) -> int:
    # Baseline ~400.
    baseline = 400
    if raw <= baseline: return 400
    return 400 + (raw - baseline)

def get_sector_name(nid: int) -> str:
    if nid == 0:
        return "Block A, Beta 1, Greater Noida"
    elif nid == 1:
        return "Block A, Beta 1, Greater Noida"
    elif nid == 2:
        return "Block B, Beta 1, Greater Noida"
    return f"Sector {chr(64 + nid)}"


# ──────────────────────────────────────────────
# DASHBOARD API ENDPOINTS
# ──────────────────────────────────────────────
def latest_per_node() -> list[dict]:
    return db.query("""
        SELECT r.* FROM readings r
        INNER JOIN (
            SELECT node_id, MAX(id) as max_id FROM readings GROUP BY node_id
        ) latest ON r.id = latest.max_id
    """)


def node_to_drain_node(r: dict) -> dict:
    node_id = str(r["node_id"])
    ch4_lel   = norm_ch4(r.get("ch4") or 0)
    h2s_ppm   = norm_h2s(r.get("h2s") or 0)
    mq135_val = norm_mq135(r.get("mq135") or 0)
    water_lvl = r.get("wlvl") or 0
    water_flw = r.get("wflow") or 0.0
    battery   = r.get("battery") or 100.0

    status = "online"
    
    # Check for staleness (offline if no data for >5 minutes)
    ts = r.get("timestamp")
    now = datetime.now(timezone.utc)
    if isinstance(ts, str):
        try:
            ts = datetime.fromisoformat(ts)
        except ValueError:
            pass
            
    if isinstance(ts, datetime) and (now - ts).total_seconds() > 300:
        status = "offline"
    else:
        # User requested: critical if >= 100% (overflow), warning if > 75%
        if ch4_lel > 20 or h2s_ppm > 10 or water_lvl >= 100:
            status = "critical"
        elif ch4_lel > 10 or h2s_ppm > 5 or water_lvl > 75:
            status = "warning"

    nid = r["node_id"]
    sector_name = get_sector_name(nid)
    # Real GPS coordinates (Beta I, Greater Noida, UP 201310)
    locations = {
        0: {"lat": 28.476502, "lng": 77.504466, "label": "Block A, Beta I, Greater Noida – Master Node"},
        1: {"lat": 28.477414, "lng": 77.503938, "label": "Block A, Beta I, Greater Noida"},
        2: {"lat": 28.478387, "lng": 77.504407, "label": "Block B, Beta I, Greater Noida"},
    }
    loc = locations.get(nid, {"lat": 28.476502, "lng": 77.504466, "label": f"Node {node_id} – {sector_name}"})

    ts = r.get("timestamp")
    ts_str = ts.isoformat() if hasattr(ts, "isoformat") else str(ts)

    return {
        "id": node_id,
        "sector": sector_name,
        "status": status,
        "location": loc,
        "waterLevel": water_lvl,
        "methaneLEL": ch4_lel,
        "h2sPpm": h2s_ppm,
        "temperature": r.get("temp") or 0,
        "humidity": r.get("hum") or 0,
        "mq135": mq135_val,
        "waterFlow": water_flw,
        "rssi": r.get("rssi") or 0,
        "hopCount": 1 if nid != 0 else 0,
        "parentNodeId": "0" if nid != 0 else None,
        "gatewayId": "gw-master",
        "packetLoss": 0,
        "lastSeen": ts_str,
        "battery": battery,
        "risk": "critical" if status == "critical" else ("medium" if status == "warning" else "low"),
        "tampered": False,
        "installedAt": "2026-01-01T00:00:00Z",
        "calibrationDueAt": "2026-12-01T00:00:00Z",
    }


@app.get("/api/nodes")
def get_nodes():
    # Fetch latest readings for nodes that have data
    latest = {r["node_id"]: r for r in latest_per_node()}
    
    nodes = []
    for nid in [0, 1, 2]:
        if nid in latest:
            nodes.append(node_to_drain_node(latest[nid]))
        else:
            # Create a default "offline" node entry for nodes with no data yet
            sector_name = get_sector_name(nid)
            locations = {
                0: {"lat": 28.476502, "lng": 77.504466, "label": "Block A, Beta I, Greater Noida – Master Node"},
                1: {"lat": 28.477414, "lng": 77.503938, "label": "Block A, Beta I, Greater Noida"},
                2: {"lat": 28.478387, "lng": 77.504407, "label": "Block B, Beta I, Greater Noida"},
            }
            nodes.append({
                "id": str(nid),
                "sector": sector_name,
                "status": "offline",
                "location": locations[nid],
                "waterLevel": 0,
                "methaneLEL": 0.0,
                "h2sPpm": 0.0,
                "temperature": 0.0,
                "humidity": 0.0,
                "mq135": 400,
                "waterFlow": 0.0,
                "rssi": 0,
                "hopCount": 1 if nid != 0 else 0,
                "parentNodeId": "0" if nid != 0 else None,
                "gatewayId": "gw-master",
                "packetLoss": 100,
                "lastSeen": datetime.now(timezone.utc).isoformat(),
                "battery": 0.0,
                "risk": "low",
                "tampered": False,
                "installedAt": "2026-01-01T00:00:00Z",
                "calibrationDueAt": "2026-12-01T00:00:00Z",
            })
    return nodes


@app.get("/api/nodes/{node_id}")
def get_node(node_id: str):
    nid = 0 if node_id.lower() == "master" else int(node_id)
    row = db.query_one(
        "SELECT * FROM readings WHERE node_id=%s ORDER BY id DESC LIMIT 1",
        (nid,)
    )
    if not row:
        # Return default offline structure if no readings
        sector_name = get_sector_name(nid)
        locations = {
            0: {"lat": 28.476502, "lng": 77.504466, "label": "Block A, Beta I, Greater Noida – Master Node"},
            1: {"lat": 28.477414, "lng": 77.503938, "label": "Block A, Beta I, Greater Noida"},
            2: {"lat": 28.478387, "lng": 77.504407, "label": "Block B, Beta I, Greater Noida"},
        }
        return {
            "id": str(nid),
            "sector": sector_name,
            "status": "offline",
            "location": locations.get(nid, {"lat": 28.476502, "lng": 77.504466, "label": "Node"}),
            "waterLevel": 0,
            "methaneLEL": 0.0,
            "h2sPpm": 0.0,
            "temperature": 0.0,
            "humidity": 0.0,
            "mq135": 400,
            "waterFlow": 0.0,
            "rssi": 0,
            "hopCount": 1 if nid != 0 else 0,
            "parentNodeId": "0" if nid != 0 else None,
            "gatewayId": "gw-master",
            "packetLoss": 100,
            "lastSeen": datetime.now(timezone.utc).isoformat(),
            "battery": 0.0,
            "risk": "low",
            "tampered": False,
            "installedAt": "2026-01-01T00:00:00Z",
            "calibrationDueAt": "2026-12-01T00:00:00Z",
        }
    return node_to_drain_node(row)


@app.get("/api/nodes/{node_id}/readings")
def get_readings(node_id: str, hours: int = 24):
    nid = 0 if node_id.lower() == "master" else int(node_id)
    # Select up to 2000 chronological readings from the requested time period
    rows = db.query(
        f"SELECT * FROM readings WHERE node_id=%s AND timestamp >= NOW() - INTERVAL '{hours} hours' ORDER BY timestamp ASC LIMIT 2000",
        (nid,)
    )
    result = []
    for r in rows:
        ts = r.get("timestamp")
        ts_str = ts.isoformat() if hasattr(ts, "isoformat") else str(ts)
        result.append({
            "nodeId": str(r["node_id"]),
            "timestamp": ts_str,
            "waterLevel": r.get("wlvl") or 0,
            "methaneLEL": norm_ch4(r.get("ch4") or 0),
            "h2sPpm":     norm_h2s(r.get("h2s") or 0),
            "temperature": r.get("temp") or 0,
            "humidity":    r.get("hum")  or 0,
            "mq135":       norm_mq135(r.get("mq135") or 0),
            "waterFlow": r.get("wflow") or 0.0,
            "rssi": r.get("rssi") or 0,
            "battery": r.get("battery") or 100.0
        })
    return result


@app.get("/api/alerts")
def get_alerts():
    alerts = []
    for r in latest_per_node():
        node_id = str(r["node_id"])
        ch4_lel   = norm_ch4(r.get("ch4") or 0)
        h2s_ppm   = norm_h2s(r.get("h2s") or 0)
        water_lvl = r.get("wlvl") or 0
        ts = r.get("timestamp")
        ts_str = ts.isoformat() if hasattr(ts, "isoformat") else str(ts)
        sector = get_sector_name(r['node_id'])

        # ── Gas alerts ────────────────────────────────────────────
        if ch4_lel > 10:
            alerts.append({
                "id": f"ch4-{node_id}",
                "nodeId": node_id,
                "category": "gas",
                "severity": "critical" if ch4_lel > 20 else "warning",
                "title": "High Methane (CH4)",
                "message": f"CH4 at {ch4_lel:.1f}% LEL on Node {node_id}",
                "sector": sector,
                "value": ch4_lel, "unit": "% LEL", "threshold": 10,
                "timestamp": ts_str, "status": "active",
            })
        if h2s_ppm > 5:
            alerts.append({
                "id": f"h2s-{node_id}",
                "nodeId": node_id,
                "category": "gas",
                "severity": "critical" if h2s_ppm > 10 else "warning",
                "title": "High H2S",
                "message": f"H2S at {h2s_ppm:.1f} ppm on Node {node_id}",
                "sector": sector,
                "value": h2s_ppm, "unit": "ppm", "threshold": 5,
                "timestamp": ts_str, "status": "active",
            })

        # ── Water / flood alerts ──────────────────────────────────
        if water_lvl >= 100:
            alerts.append({
                "id": f"flood-{node_id}",
                "nodeId": node_id,
                "category": "flood",
                "severity": "critical",
                "title": "Drain Overflow",
                "message": f"Water level at {water_lvl}% (overflow) on Node {node_id}",
                "sector": sector,
                "value": water_lvl, "unit": "%", "threshold": 100,
                "timestamp": ts_str, "status": "active",
            })
        elif water_lvl > 75:
            alerts.append({
                "id": f"water-{node_id}",
                "nodeId": node_id,
                "category": "flood",
                "severity": "warning",
                "title": "High Water Level",
                "message": f"Water level at {water_lvl}% on Node {node_id}",
                "sector": sector,
                "value": water_lvl, "unit": "%", "threshold": 75,
                "timestamp": ts_str, "status": "active",
            })
    return alerts


@app.post("/api/alerts/{alert_id}/acknowledge")
def ack_alert(alert_id: str):
    return {"status": "acknowledged"}


@app.post("/api/alerts/{alert_id}/resolve")
def resolve_alert(alert_id: str):
    return {"status": "resolved"}


@app.get("/api/gateways")
def get_gateways():
    total = (db.query_one("SELECT COUNT(*) as cnt FROM readings") or {}).get("cnt", 0)
    
    latest = latest_per_node()
    max_ts = None
    for r in latest:
        ts = r.get("timestamp")
        if isinstance(ts, str):
            try: ts = datetime.fromisoformat(ts)
            except ValueError: pass
        if isinstance(ts, datetime):
            if max_ts is None or ts > max_ts:
                max_ts = ts
                
    now = datetime.now(timezone.utc)
    is_online = max_ts is not None and (now - max_ts).total_seconds() <= 300
    status = "online" if is_online else "offline"
    last_sync_str = max_ts.isoformat() if max_ts else now.isoformat()

    return [{
        "id": "gw-master",
        "label": "Master Gateway (ESP32 + SX1278 LoRa 433MHz)",
        "status": status,
        # Gateway co-located with Node 0 (Master) – Block A, Beta I, Greater Noida
        "location": {"lat": 28.476502, "lng": 77.504466, "label": "Block A, Beta I, Greater Noida – Gateway"},
        "connectedNodes": len(latest),
        "meshHealth": 95 if is_online else 0,
        "backhaul": "connected" if is_online else "disconnected",
        "backhaulType": "WiFi",
        "uptime": "N/A",
        "packetsReceived": total,
        "packetsForwarded": total,
        "packetLoss": 0,
        "cpuLoad": 10 if is_online else 0,
        "memoryLoad": 15 if is_online else 0,
        "lastSync": last_sync_str,
    }]


@app.get("/api/network/topology")
def get_topology():
    nodes = [node_to_drain_node(r) for r in latest_per_node()]
    edges = [{"from": "gw-master", "to": n["id"], "rssi": n["rssi"], "hop": 1, "packetStatus": "good"} for n in nodes]
    return {"gateways": get_gateways(), "nodes": nodes, "edges": edges}


@app.get("/api/maintenance")
def get_maintenance():
    return []


@app.get("/api/events")
def get_events():
    rows = db.query("SELECT * FROM readings ORDER BY id DESC LIMIT 20")
    events = []
    for r in rows:
        ts = r.get("timestamp")
        ts_str = ts.isoformat() if hasattr(ts, "isoformat") else str(ts)
        events.append({
            "id": str(r["id"]),
            "nodeId": str(r["node_id"]),
            "timestamp": ts_str,
            "message": f"Node {r['node_id']}: T={r.get('temp')}°C H={r.get('hum')}% CH4={r.get('ch4')} H2S={r.get('h2s')}",
            "kind": "info",
        })
    return events


@app.get("/api/ml/predictions")
def get_predictions():
    predictions = []
    for r in latest_per_node():
        node_id = str(r["node_id"])
        # Use the same norm functions (with baseline=400) so fresh-air reads give 0 probability.
        # Without this, ADC=400 (clean air) would give ch4=9.8% and h2s=4.9 → medium risk always.
        ch4_lel = norm_ch4(r.get("ch4") or 0)   # 0.0–100.0 % LEL
        h2s_ppm = norm_h2s(r.get("h2s") or 0)   # 0.0–50.0 ppm
        water_lvl = r.get("wlvl") or 0
        # Weighted probability across all three sensors
        prob = min(1.0,
            (ch4_lel / 100.0 * 0.4) +
            (h2s_ppm / 50.0  * 0.35) +
            (water_lvl / 100.0 * 0.25)
        )
        risk = "critical" if prob > 0.6 else ("high" if prob > 0.4 else ("medium" if prob > 0.2 else "low"))
        factors = []
        if ch4_lel > 0:    factors.append(f"CH4 {ch4_lel:.1f}% LEL")
        if h2s_ppm > 0:    factors.append(f"H2S {h2s_ppm:.1f} ppm")
        if water_lvl > 50: factors.append(f"Water {water_lvl}%")
        if not factors:    factors = ["All sensors nominal"]
        predictions.append({
            "nodeId": node_id,
            "probability": round(prob, 2),
            "risk": risk,
            "confidence": 0.85,
            "factors": factors,
            "generatedAt": datetime.now(timezone.utc).isoformat(),
        })
    return predictions


# ──────────────────────────────────────────────
# DATABASE STATUS ENDPOINT
# ──────────────────────────────────────────────
@app.get("/api/db/status")
def get_db_status():
    return db.db_status()


# WebSocket telemetry — streams live node data every 5 seconds
@app.websocket("/ws/telemetry")
async def telemetry_ws(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            nodes = get_nodes()
            await websocket.send_text(json.dumps(nodes))
            await asyncio.sleep(5)
    except WebSocketDisconnect:
        pass


if __name__ == "__main__":
    print("=" * 50)
    print("  DrainWatch FastAPI Backend  (PostgreSQL + Supabase)")
    print("  http://0.0.0.0:3000")
    print("  ESP32 posts to: POST /lora-data")
    print("  DB status:      GET  /api/db/status")
    print("=" * 50)
    uvicorn.run("main:app", host="0.0.0.0", port=3000, reload=True)
