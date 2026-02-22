"""Vercel serverless: POST /api/simulation — write simulation results back to Databricks."""
import json
import os
from http.server import BaseHTTPRequestHandler
from urllib.request import Request, urlopen
from datetime import datetime


def _exec_sql(host, token, warehouse_id, sql, timeout=9):
    """Execute a single SQL statement against Databricks, return (success, body)."""
    try:
        req = Request(
            f"{host}/api/2.0/sql/statements/",
            data=json.dumps({
                "warehouse_id": warehouse_id,
                "statement": sql,
                "wait_timeout": "8s",
            }).encode(),
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        with urlopen(req, timeout=timeout) as resp:
            body = json.loads(resp.read())
        return body.get("status", {}).get("state") == "SUCCEEDED", body
    except Exception as e:
        return False, {"error": str(e)}


def _ensure_table(host, token, warehouse_id):
    """Create simulation_results table if it doesn't exist."""
    create_sql = """
    CREATE TABLE IF NOT EXISTS sweetreturns.gold.simulation_results (
        snapshot_date    DATE,
        ticker           STRING,
        agent_name       STRING,
        action           STRING,
        profit           DOUBLE,
        whale_fund       STRING,
        whale_weight     DOUBLE,
        buy_crowd        INT,
        call_crowd       INT,
        put_crowd        INT,
        short_crowd      INT,
        submitted_at     TIMESTAMP
    )
    USING DELTA
    PARTITIONED BY (snapshot_date)
    """
    ok, _ = _exec_sql(host, token, warehouse_id, create_sql)
    return ok


_table_ensured = False


def _insert_to_databricks(rows: list) -> int:
    """Insert simulation result rows into Databricks via SQL Statement API."""
    global _table_ensured
    host = os.environ.get("DATABRICKS_HOST", "").strip().rstrip("/")
    token = os.environ.get("DATABRICKS_TOKEN", "").strip()
    http_path = os.environ.get("DATABRICKS_SQL_WAREHOUSE_PATH", "").strip()
    warehouse_id = http_path.rstrip("/").split("/")[-1] if http_path else ""

    if not (host and token and warehouse_id):
        return 0

    # Ensure table exists on first call
    if not _table_ensured:
        _ensure_table(host, token, warehouse_id)
        _table_ensured = True

    # Build batch INSERT statement (max 50 rows per call to stay within limits)
    inserted = 0
    batch_size = 50

    for i in range(0, len(rows), batch_size):
        batch = rows[i : i + batch_size]
        values = []
        for r in batch:
            # Escape single quotes in strings
            ticker = str(r.get("ticker", "")).replace("'", "''")
            agent = str(r.get("agent_name", "")).replace("'", "''")
            action = str(r.get("action", "")).replace("'", "''")
            whale = r.get("whale_fund")
            whale_str = f"'{whale}'" if whale else "NULL"
            whale_w = r.get("whale_weight")
            whale_w_str = str(whale_w) if whale_w is not None else "NULL"

            values.append(
                f"('{r.get('snapshot_date', '')}', '{ticker}', '{agent}', '{action}', "
                f"{r.get('profit', 0)}, {whale_str}, {whale_w_str}, "
                f"{r.get('buy_crowd', 0)}, {r.get('call_crowd', 0)}, "
                f"{r.get('put_crowd', 0)}, {r.get('short_crowd', 0)}, "
                f"CURRENT_TIMESTAMP())"
            )

        sql = (
            "INSERT INTO sweetreturns.gold.simulation_results "
            "(snapshot_date, ticker, agent_name, action, profit, whale_fund, whale_weight, "
            "buy_crowd, call_crowd, put_crowd, short_crowd, submitted_at) VALUES "
            + ", ".join(values)
        )

        ok, body = _exec_sql(host, token, warehouse_id, sql)
        if ok:
            inserted += len(batch)
        elif not _table_ensured:
            # Table might not exist — try creating and retry
            _ensure_table(host, token, warehouse_id)
            _table_ensured = True
            ok2, _ = _exec_sql(host, token, warehouse_id, sql)
            if ok2:
                inserted += len(batch)

    return inserted


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        """Handle CORS preflight."""
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            if content_length > 500_000:  # 500KB limit
                self._respond(413, {"error": "Payload too large", "max_bytes": 500000})
                return

            body = json.loads(self.rfile.read(content_length))

            snapshot_date = body.get("snapshot_date", "")
            trades = body.get("trades", [])
            crowd_metrics = body.get("crowd_metrics", [])

            if not snapshot_date:
                self._respond(400, {"error": "snapshot_date is required"})
                return

            # Build rows for insertion
            rows = []

            # Agent trades
            for t in trades[:100]:  # Cap at 100 trades per submission
                rows.append(
                    {
                        "snapshot_date": snapshot_date,
                        "ticker": t.get("ticker", ""),
                        "agent_name": t.get("agent_name", ""),
                        "action": t.get("action", ""),
                        "profit": float(t.get("profit", 0)),
                        "whale_fund": t.get("whale_fund"),
                        "whale_weight": t.get("whale_weight"),
                        "buy_crowd": 0,
                        "call_crowd": 0,
                        "put_crowd": 0,
                        "short_crowd": 0,
                    }
                )

            # Crowd metrics (per-store aggregate)
            for c in crowd_metrics[:600]:  # Cap at 600 stores
                rows.append(
                    {
                        "snapshot_date": snapshot_date,
                        "ticker": c.get("ticker", ""),
                        "agent_name": "__crowd__",
                        "action": "CROWD",
                        "profit": 0,
                        "whale_fund": None,
                        "whale_weight": None,
                        "buy_crowd": int(c.get("buy", 0)),
                        "call_crowd": int(c.get("call", 0)),
                        "put_crowd": int(c.get("put", 0)),
                        "short_crowd": int(c.get("short", 0)),
                    }
                )

            inserted = _insert_to_databricks(rows)

            self._respond(
                200,
                {
                    "status": "ok",
                    "rows_inserted": inserted,
                    "trades_received": len(trades),
                    "crowd_received": len(crowd_metrics),
                    "snapshot_date": snapshot_date,
                },
            )

        except json.JSONDecodeError:
            self._respond(400, {"error": "Invalid JSON body"})
        except Exception as e:
            self._respond(500, {"error": str(e)[:200]})

    def _respond(self, code: int, payload: dict):
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(payload).encode())
