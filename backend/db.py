"""
db.py  –  Dual-write database layer for DrainWatch.

Every sensor reading is written to:
  1. Local PostgreSQL  (always, synchronous)
  2. Supabase          (async background task, skipped if DISABLE_ONLINE_SYNC=true
                        or Supabase credentials not configured)

Query functions read exclusively from local PostgreSQL for low latency.
"""
import os
import asyncio
import json
import urllib.request
import psycopg2
import psycopg2.pool
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
from datetime import datetime, timezone
from typing import Optional

load_dotenv()

# ── DSN helpers ───────────────────────────────────────────────────────────────
def _local_dsn() -> dict:
    return dict(
        host=os.getenv("LOCAL_PG_HOST", "localhost"),
        port=int(os.getenv("LOCAL_PG_PORT", 5432)),
        dbname=os.getenv("LOCAL_PG_DB", "drainwatch"),
        user=os.getenv("LOCAL_PG_USER", "postgres"),
        password=os.getenv("LOCAL_PG_PASSWORD", "12345"),
    )

def _online_dsn() -> dict:
    return dict(
        url=os.getenv("SUPABASE_URL", "https://bihleohcyryxolygeypi.supabase.co"),
        key=os.getenv("SUPABASE_KEY", "")
    )

def _online_configured() -> bool:
    dsn = _online_dsn()
    return bool(dsn["url"]) and bool(dsn["key"])

def _online_enabled() -> bool:
    return (
        _online_configured()
        and os.getenv("DISABLE_ONLINE_SYNC", "false").lower() != "true"
    )

# ── Connection pool (local) ───────────────────────────────────────────────────
_pool: Optional[psycopg2.pool.ThreadedConnectionPool] = None

def get_pool() -> psycopg2.pool.ThreadedConnectionPool:
    global _pool
    if _pool is None:
        _pool = psycopg2.pool.ThreadedConnectionPool(1, 10, **_local_dsn())
    return _pool

def get_conn():
    """Get a connection from the local pool (returns with RealDictCursor)."""
    conn = get_pool().getconn()
    conn.cursor_factory = RealDictCursor
    return conn

def release_conn(conn):
    get_pool().putconn(conn)

# ── Insert helper ─────────────────────────────────────────────────────────────
_INSERT_SQL = """
INSERT INTO readings
    (node_id, timestamp, temp, hum, mq135, h2s, ch4, rssi, snr, packet, wlvl, wflow, battery)
VALUES
    (%(node_id)s, %(timestamp)s, %(temp)s, %(hum)s, %(mq135)s,
     %(h2s)s, %(ch4)s, %(rssi)s, %(snr)s, %(packet)s, %(wlvl)s, %(wflow)s, %(battery)s)
RETURNING id;
"""

def _insert_local(params: dict) -> int:
    """Write to local PG, return inserted row id."""
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(_INSERT_SQL, params)
            row_id = cur.fetchone()["id"]
        conn.commit()
        return row_id
    except Exception:
        conn.rollback()
        raise
    finally:
        release_conn(conn)

def _insert_online(params: dict):
    """Write to Supabase via REST API (called in a background thread)."""
    try:
        dsn = _online_dsn()
        url = dsn["url"].rstrip("/") + "/rest/v1/readings"
        key = dsn["key"]
        
        headers = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        }
        
        # REST API expects fields matching column names exactly
        payload = json.dumps(params).encode("utf-8")
        req = urllib.request.Request(url, data=payload, headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=10) as response:
            pass
    except Exception as e:
        # Non-fatal – log and continue
        print(f"[DB] ⚠ Supabase REST write failed: {e}")

async def insert_reading(
    node_id: int,
    timestamp: str,
    temp: Optional[float],
    hum: Optional[float],
    mq135: int,
    h2s: int,
    ch4: int,
    rssi: int,
    snr: float,
    packet: int,
    wlvl: Optional[int] = None,
    wflow: Optional[float] = None,
    battery: Optional[float] = None,
) -> int:
    """
    Dual-write a reading to local PG (sync) and Supabase (async background).
    Returns the local row id.
    """
    params = dict(
        node_id=node_id,
        timestamp=timestamp,
        temp=temp,
        hum=hum,
        mq135=mq135,
        h2s=h2s,
        ch4=ch4,
        rssi=rssi,
        snr=snr,
        packet=packet,
        wlvl=wlvl,
        wflow=wflow,
        battery=battery,
    )

    # 1. Local (always)
    row_id = _insert_local(params)

    # 2. Online (fire-and-forget in thread pool)
    if _online_enabled():
        loop = asyncio.get_running_loop()   # correct inside async context (3.10+)
        loop.run_in_executor(None, _insert_online, params)

    return row_id

# ── Query helpers (read from local) ──────────────────────────────────────────
def query(sql: str, params=None) -> list[dict]:
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(sql, params or ())
            return [dict(r) for r in cur.fetchall()]
    finally:
        release_conn(conn)

def query_one(sql: str, params=None) -> Optional[dict]:
    rows = query(sql, params)
    return rows[0] if rows else None

def db_status() -> dict:
    """Return connection status for local and online databases."""
    local_ok = False
    online_ok = False

    try:
        conn = get_conn()
        with conn.cursor() as cur:
            cur.execute("SELECT 1")
        release_conn(conn)
        local_ok = True
    except Exception:
        pass

    if _online_configured():
        try:
            dsn = _online_dsn()
            req = urllib.request.Request(dsn["url"].rstrip("/") + "/rest/v1/", headers={"apikey": dsn["key"]})
            with urllib.request.urlopen(req, timeout=5) as response:
                if response.status == 200:
                    online_ok = True
        except Exception:
            pass

    return {
        "local": "connected" if local_ok else "error",
        "online": (
            "connected" if online_ok
            else ("disabled" if not _online_configured()
                  else ("sync_off" if not _online_enabled() else "error"))
        ),
    }
