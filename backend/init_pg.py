"""
init_pg.py  -  Run this once to create the 'drainwatch' database + tables
               on both local PostgreSQL and (optionally) Supabase.

Usage:
    python init_pg.py               -> init local only
    python init_pg.py --all         -> init local + online (Supabase)
"""
import sys
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from dotenv import load_dotenv
import os

load_dotenv()

# ── Connection DSN builders ───────────────────────────────────────────────────
def _local_dsn(dbname=None):
    return dict(
        host=os.getenv("LOCAL_PG_HOST", "localhost"),
        port=int(os.getenv("LOCAL_PG_PORT", 5432)),
        dbname=dbname or os.getenv("LOCAL_PG_DB", "drainwatch"),
        user=os.getenv("LOCAL_PG_USER", "postgres"),
        password=os.getenv("LOCAL_PG_PASSWORD", "12345"),
    )

def _online_dsn():
    return dict(
        host=os.getenv("SUPABASE_HOST", ""),
        port=int(os.getenv("SUPABASE_PORT", 5432)),
        dbname=os.getenv("SUPABASE_DB", "postgres"),
        user=os.getenv("SUPABASE_USER", "postgres"),
        password=os.getenv("SUPABASE_PASSWORD", ""),
        sslmode="require",
    )

# ── DDL ───────────────────────────────────────────────────────────────────────
CREATE_READINGS = """
CREATE TABLE IF NOT EXISTS readings (
    id          SERIAL PRIMARY KEY,
    node_id     INTEGER      NOT NULL,
    timestamp   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    temp        REAL,
    hum         REAL,
    mq135       INTEGER      DEFAULT 0,
    h2s         INTEGER      DEFAULT 0,
    ch4         INTEGER      DEFAULT 0,
    rssi        INTEGER      DEFAULT 0,
    snr         REAL         DEFAULT 0,
    packet      INTEGER      DEFAULT 0,
    wlvl        INTEGER,
    wflow       REAL,
    battery     REAL         DEFAULT 100
);
"""

# Patch existing DBs that were created before wlvl/wflow/battery were added
PATCH_COLUMNS = """
ALTER TABLE readings ADD COLUMN IF NOT EXISTS wlvl    INTEGER;
ALTER TABLE readings ADD COLUMN IF NOT EXISTS wflow   REAL;
ALTER TABLE readings ADD COLUMN IF NOT EXISTS battery REAL DEFAULT 100;
"""

CREATE_INDEX = """
CREATE INDEX IF NOT EXISTS idx_readings_node_time
    ON readings (node_id, timestamp DESC);
"""

# ── Init helpers ──────────────────────────────────────────────────────────────
def create_db_if_missing_local():
    """Create the 'drainwatch' database on local PG if it doesn't exist."""
    try:
        conn = psycopg2.connect(**_local_dsn(dbname="postgres"))
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        dbname = os.getenv("LOCAL_PG_DB", "drainwatch")
        cur.execute("SELECT 1 FROM pg_database WHERE datname=%s", (dbname,))
        if not cur.fetchone():
            cur.execute(f'CREATE DATABASE "{dbname}"')
            print(f"  [+] Created database '{dbname}'")
        else:
            print(f"  [ok] Database '{dbname}' already exists")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"  [!] Could not create database: {e}")
        raise

def init_schema(dsn, label):
    try:
        conn = psycopg2.connect(**dsn)
        conn.autocommit = True
        cur = conn.cursor()
        cur.execute(CREATE_READINGS)
        cur.execute(PATCH_COLUMNS)   # adds wlvl/wflow/battery to existing tables
        cur.execute(CREATE_INDEX)
        cur.close()
        conn.close()
        print(f"  [ok] [{label}] Schema initialised (with wlvl/wflow/battery columns)")
    except Exception as e:
        print(f"  [!] [{label}] Failed: {e}")
        raise

# ── Entry point ───────────────────────────────────────────────────────────────
def main():
    init_online = "--all" in sys.argv

    print("\n---  DrainWatch DB Init  ---")
    print("\n[1/2] Local PostgreSQL ...")
    create_db_if_missing_local()
    init_schema(_local_dsn(), "Local PG")

    if init_online:
        print("\n[2/2] Supabase (online) ...")
        host = os.getenv("SUPABASE_HOST", "")
        if not host or "<YOUR_PROJECT_REF>" in host:
            print("  [!] SUPABASE_HOST not configured in backend/.env -- skipping")
        else:
            init_schema(_online_dsn(), "Supabase")
    else:
        print("\n[2/2] Supabase skipped (run with --all to init online DB too)")

    print("\n[OK] Done!\n")

if __name__ == "__main__":
    main()
