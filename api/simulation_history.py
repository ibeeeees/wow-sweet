"""Vercel serverless: GET /api/simulation_history — aggregated simulation results.

Returns crowd sentiment and agent performance from past simulation cycles,
so the frontend agents can use historical data to inform current decisions.
"""
import json
import os
from http.server import BaseHTTPRequestHandler
from urllib.request import Request, urlopen


def _query_databricks(sql: str) -> list:
    """Execute SQL via Databricks SQL Statement REST API."""
    host = os.environ.get("DATABRICKS_HOST", "").strip().rstrip("/")
    token = os.environ.get("DATABRICKS_TOKEN", "").strip()
    http_path = os.environ.get("DATABRICKS_SQL_WAREHOUSE_PATH", "").strip()
    warehouse_id = http_path.rstrip("/").split("/")[-1] if http_path else ""

    if not (host and token and warehouse_id):
        return []

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

        with urlopen(req, timeout=9) as resp:
            body = json.loads(resp.read())

        if body.get("status", {}).get("state") != "SUCCEEDED":
            return []

        columns = [c["name"] for c in body.get("manifest", {}).get("schema", {}).get("columns", [])]
        rows = body.get("result", {}).get("data_array", [])
        return [dict(zip(columns, row)) for row in rows]
    except Exception:
        return []


def _f(val, default=0.0):
    try:
        return float(val) if val is not None else default
    except (ValueError, TypeError):
        return default


def _build_history() -> dict:
    """Build aggregated simulation history for agent decision-making."""

    # 1. Per-ticker crowd sentiment (last 5 snapshots)
    crowd_rows = _query_databricks("""
        SELECT ticker, snapshot_date,
               SUM(buy_crowd) as total_buy,
               SUM(call_crowd) as total_call,
               SUM(put_crowd) as total_put,
               SUM(short_crowd) as total_short
        FROM sweetreturns.gold.simulation_results
        WHERE agent_name = '__crowd__'
          AND snapshot_date >= (
              SELECT DATE_SUB(MAX(snapshot_date), 5)
              FROM sweetreturns.gold.simulation_results
          )
        GROUP BY ticker, snapshot_date
        ORDER BY ticker, snapshot_date
    """)

    # 2. Top-performing agents (all time)
    agent_rows = _query_databricks("""
        SELECT agent_name,
               COUNT(*) as total_trades,
               SUM(profit) as total_profit,
               AVG(profit) as avg_profit,
               SUM(CASE WHEN profit >= 0 THEN 1 ELSE 0 END) as wins,
               MAX(snapshot_date) as last_active
        FROM sweetreturns.gold.simulation_results
        WHERE agent_name != '__crowd__'
        GROUP BY agent_name
        ORDER BY total_profit DESC
        LIMIT 30
    """)

    # 3. Per-ticker profitability (which stores are making agents money)
    ticker_perf = _query_databricks("""
        SELECT ticker,
               COUNT(*) as trade_count,
               SUM(profit) as total_profit,
               AVG(profit) as avg_profit,
               SUM(CASE WHEN action = 'BUY' THEN profit ELSE 0 END) as buy_profit,
               SUM(CASE WHEN action = 'CALL' THEN profit ELSE 0 END) as call_profit,
               SUM(CASE WHEN action = 'PUT' THEN profit ELSE 0 END) as put_profit,
               SUM(CASE WHEN action = 'SHORT' THEN profit ELSE 0 END) as short_profit
        FROM sweetreturns.gold.simulation_results
        WHERE agent_name != '__crowd__'
        GROUP BY ticker
        HAVING COUNT(*) >= 3
        ORDER BY avg_profit DESC
        LIMIT 100
    """)

    # 4. Total cycle count
    cycle_rows = _query_databricks("""
        SELECT COUNT(DISTINCT snapshot_date) as cycle_count,
               MIN(snapshot_date) as first_date,
               MAX(snapshot_date) as last_date,
               COUNT(*) as total_records
        FROM sweetreturns.gold.simulation_results
    """)

    # Build response
    crowd_by_ticker = {}
    for r in crowd_rows:
        ticker = r.get("ticker", "")
        if ticker not in crowd_by_ticker:
            crowd_by_ticker[ticker] = []
        crowd_by_ticker[ticker].append({
            "date": str(r.get("snapshot_date", "")),
            "buy": int(_f(r.get("total_buy"))),
            "call": int(_f(r.get("total_call"))),
            "put": int(_f(r.get("total_put"))),
            "short": int(_f(r.get("total_short"))),
        })

    agents = []
    for r in agent_rows:
        total = int(_f(r.get("total_trades"), 1))
        wins = int(_f(r.get("wins")))
        agents.append({
            "name": r.get("agent_name", ""),
            "total_trades": total,
            "total_profit": round(_f(r.get("total_profit")), 2),
            "avg_profit": round(_f(r.get("avg_profit")), 2),
            "win_rate": round(wins / max(total, 1), 3),
            "last_active": str(r.get("last_active", "")),
        })

    ticker_performance = []
    for r in ticker_perf:
        ticker_performance.append({
            "ticker": r.get("ticker", ""),
            "trade_count": int(_f(r.get("trade_count"))),
            "total_profit": round(_f(r.get("total_profit")), 2),
            "avg_profit": round(_f(r.get("avg_profit")), 2),
            "best_action": max(
                [("BUY", _f(r.get("buy_profit"))),
                 ("CALL", _f(r.get("call_profit"))),
                 ("PUT", _f(r.get("put_profit"))),
                 ("SHORT", _f(r.get("short_profit")))],
                key=lambda x: x[1]
            )[0],
        })

    cycle_info = cycle_rows[0] if cycle_rows else {}

    return {
        "crowd_sentiment": crowd_by_ticker,
        "agent_leaderboard": agents,
        "ticker_performance": ticker_performance,
        "cycles": {
            "count": int(_f(cycle_info.get("cycle_count"))),
            "first_date": str(cycle_info.get("first_date", "")),
            "last_date": str(cycle_info.get("last_date", "")),
            "total_records": int(_f(cycle_info.get("total_records"))),
        },
        "source": "databricks",
    }


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            payload = _build_history()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Cache-Control", "s-maxage=120, stale-while-revalidate=60")
            self.end_headers()
            self.wfile.write(json.dumps(payload).encode())
        except Exception as e:
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({
                "crowd_sentiment": {},
                "agent_leaderboard": [],
                "ticker_performance": [],
                "cycles": {"count": 0},
                "source": "empty",
                "error": str(e)[:200],
            }).encode())
