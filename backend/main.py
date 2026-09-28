from fastapi import FastAPI, Request, Form, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import asyncio
from datetime import datetime, timezone
import json
import random

import db  # ← dual-write PostgreSQL layer

app = FastAPI()

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
    NODE=1,PKT=5,TEMP=26.3,HUM=58.2,MQ135=310,H2S=45,CH4=80
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
        node_id = int(parsed.get("NODE", 0))
        temp_s  = parsed.get("TEMP", "nan")
        hum_s   = parsed.get("HUM",  "nan")
        temp    = float(temp_s) if temp_s.lower() != "nan" else None
        hum     = float(hum_s)  if hum_s.lower()  != "nan" else None
        mq135   = int(float(parsed.get("MQ135", 0)))
        h2s     = int(float(parsed.get("H2S",   0)))
        ch4     = int(float(parsed.get("CH4",   0)))
    except Exception as e:
        return JSONResponse({"status": "error", "message": str(e)}, status_code=400)

    ts = datetime.now(timezone.utc).isoformat()
    await db.insert_reading(node_id, ts, temp, hum, mq135, h2s, ch4, rssi, snr, packet)

    print(f"[{datetime.now().strftime('%H:%M:%S')}] Node {node_id} | "
          f"T={temp} H={hum} MQ135={mq135} H2S={h2s} CH4={ch4} | RSSI={rssi} SNR={snr}")
    return {"status": "success", "node": node_id}


# Also accept JSON POST (for any future use / manual testing)
@app.post("/api/data")
async def receive_json_data(request: Request):
    try:
        body = await request.body()
        raw = body.decode("utf-8").strip()
        try:
            d = json.loads(raw)
            node_id = d.get("node", 0)
            temp    = d.get("temp")
            hum     = d.get("hum")
            mq135   = d.get("mq135", 0)
            h2s     = d.get("h2s", 0)
            ch4     = d.get("ch4", 0)
            rssi    = d.get("rssi", 0)
            snr     = d.get("snr", 0.0)
            packet  = d.get("packet", 0)
        except json.JSONDecodeError:
            parsed  = parse_lora_string(raw)
            node_id = int(parsed.get("NODE", 0))
            temp    = float(parsed.get("TEMP", 0))
            hum     = float(parsed.get("HUM", 0))
            mq135   = int(float(parsed.get("MQ135", 0)))
            h2s     = int(float(parsed.get("H2S", 0)))
            ch4     = int(float(parsed.get("CH4", 0)))
            rssi    = 0; snr = 0.0; packet = 0

        ts = datetime.now(timezone.utc).isoformat()
        await db.insert_reading(node_id, ts, temp, hum, mq135, h2s, ch4, rssi, snr, packet)
        return {"status": "success", "node": node_id}
    except Exception as e:
        return JSONResponse({"status": "error", "message": str(e)}, status_code=400)

async def simulate_node1():
    while True:
        try:
            temp = 26.0 + random.uniform(-0.5, 0.5)
            hum = 50.0 + random.uniform(-2, 2)
            mq135 = int(2160 + random.uniform(-10, 20))
            h2s = int(750 + random.uniform(-5, 5))
            ch4 = int(1340 + random.uniform(-10, 10))
            rssi = int(-45 + random.uniform(-5, 5))
            
            ts = datetime.now(timezone.utc).isoformat()
            await db.insert_reading(1, ts, temp, hum, mq135, h2s, ch4, rssi, 0.0, 0)
        except Exception as e:
            print(f"Simulate error: {e}")
        await asyncio.sleep(7)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(simulate_node1())
# ──────────────────────────────────────────────
# NORMALIZATION HELPERS
# ──────────────────────────────────────────────
def norm_ch4(raw: int) -> float:
    # Baseline ~1340
    return round(max(0.0, (raw - 1340) / (4095 - 1340) * 100), 1)

def norm_h2s(raw: int) -> float:
    # Baseline ~750
    return round(max(0.0, (raw - 750) / (4095 - 750) * 50), 1)

def norm_mq135(raw: int) -> int:
    # Baseline ~2150
    return max(0, raw - 2150)

def get_sector_name(nid: int) -> str:
    if nid == 1:
        return "Greater Noida Sector Beta 1, Block A"
    elif nid == 2:
        return "Greater Noida Sector Beta 1, Block B"
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
    water_lvl = 0.0
    water_flw = 0.0

    status = "online"
    if ch4_lel > 20 or h2s_ppm > 10: status = "critical"
    elif ch4_lel > 10 or h2s_ppm > 5: status = "warning"

    nid = r["node_id"]
    sector_name = get_sector_name(nid)
    locations = {
        1: {"lat": 28.4710, "lng": 77.5020, "label": "Node 1 – " + sector_name},
        2: {"lat": 28.4780, "lng": 77.5090, "label": "Node 2 – " + sector_name},
    }
    loc = locations.get(nid, {"lat": 28.6139, "lng": 77.2090, "label": f"Node {node_id} – {sector_name}"})

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
        "hopCount": 1,
        "parentNodeId": None,
        "gatewayId": "gw-master",
        "packetLoss": 0,
        "lastSeen": ts_str,
        "risk": "critical" if status == "critical" else ("medium" if status == "warning" else "low"),
        "tampered": False,
        "installedAt": "2026-01-01T00:00:00Z",
        "calibrationDueAt": "2026-12-01T00:00:00Z",
    }


@app.get("/api/nodes")
def get_nodes():
    return [node_to_drain_node(r) for r in latest_per_node()]


@app.get("/api/nodes/{node_id}")
def get_node(node_id: str):
    row = db.query_one(
        "SELECT * FROM readings WHERE node_id=%s ORDER BY id DESC LIMIT 1",
        (int(node_id),)
    )
    if not row:
        return JSONResponse({"error": "not found"}, status_code=404)
    return node_to_drain_node(row)


@app.get("/api/nodes/{node_id}/readings")
def get_readings(node_id: str, hours: int = 24):
    # Select up to 2000 chronological readings from the requested time period
    rows = db.query(
        f"SELECT * FROM readings WHERE node_id=%s AND timestamp >= NOW() - INTERVAL '{hours} hours' ORDER BY timestamp ASC LIMIT 2000",
        (int(node_id),)
    )
    result = []
    for r in rows:
        ts = r.get("timestamp")
        ts_str = ts.isoformat() if hasattr(ts, "isoformat") else str(ts)
        result.append({
            "nodeId": str(r["node_id"]),
            "timestamp": ts_str,
            "waterLevel": 0.0,
            "methaneLEL": norm_ch4(r.get("ch4") or 0),
            "h2sPpm":     norm_h2s(r.get("h2s") or 0),
            "temperature": r.get("temp") or 0,
            "humidity":    r.get("hum")  or 0,
            "mq135":       norm_mq135(r.get("mq135") or 0),
            "waterFlow": 0.0,
            "rssi": r.get("rssi") or 0,
            "battery": 98.5 if r["node_id"] == 1 else 94.2
        })
    return result


@app.get("/api/alerts")
def get_alerts():
    alerts = []
    for r in latest_per_node():
        node_id = str(r["node_id"])
        ch4_lel = norm_ch4(r.get("ch4") or 0)
        h2s_ppm = norm_h2s(r.get("h2s") or 0)
        ts = r.get("timestamp")
        ts_str = ts.isoformat() if hasattr(ts, "isoformat") else str(ts)

        if ch4_lel > 10:
            alerts.append({
                "id": f"ch4-{node_id}",
                "nodeId": node_id,
                "category": "gas",
                "severity": "critical" if ch4_lel > 20 else "warning",
                "title": "High Methane (CH4)",
                "message": f"CH4 at {ch4_lel:.1f}% LEL on Node {node_id}",
                "sector": get_sector_name(r['node_id']),
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
                "sector": get_sector_name(r['node_id']),
                "value": h2s_ppm, "unit": "ppm", "threshold": 5,
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
    return [{
        "id": "gw-master",
        "label": "Master Gateway (ESP32-S3)",
        "status": "online",
        "location": {"lat": 28.6139, "lng": 77.2090, "label": "Gateway"},
        "connectedNodes": len(latest_per_node()),
        "meshHealth": 95,
        "backhaul": "connected",
        "backhaulType": "WiFi",
        "uptime": "N/A",
        "packetsReceived": total,
        "packetsForwarded": total,
        "packetLoss": 0,
        "cpuLoad": 10,
        "memoryLoad": 15,
        "lastSync": datetime.now(timezone.utc).isoformat(),
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
        ch4_lel = (r.get("ch4") or 0) / 4095 * 100
        h2s_ppm = (r.get("h2s") or 0) / 4095 * 50
        prob = min(1.0, (ch4_lel / 100 * 0.6) + (h2s_ppm / 50 * 0.4))
        risk = "critical" if prob > 0.6 else ("high" if prob > 0.4 else ("medium" if prob > 0.2 else "low"))
        predictions.append({
            "nodeId": node_id,
            "probability": round(prob, 2),
            "risk": risk,
            "confidence": 0.85,
            "factors": ["CH4 level", "H2S level", "temperature"],
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
            nodes = [node_to_drain_node(r) for r in latest_per_node()]
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
