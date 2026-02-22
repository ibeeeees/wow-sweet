"""Vercel serverless: GET /api/stocks — live stock payload from Databricks."""
import json
import os
from http.server import BaseHTTPRequestHandler
from urllib.request import Request, urlopen


def _query_databricks(sql: str, params=None) -> list:
    """Execute SQL via Databricks SQL Statement REST API."""
    host = os.environ.get("DATABRICKS_HOST", "").strip().rstrip("/")
    token = os.environ.get("DATABRICKS_TOKEN", "").strip()
    http_path = os.environ.get("DATABRICKS_SQL_WAREHOUSE_PATH", "").strip()
    warehouse_id = http_path.rstrip("/").split("/")[-1] if http_path else ""

    if not (host and token and warehouse_id):
        return []

    if params:
        for p in params:
            sql = sql.replace("%s", f"'{str(p)}'", 1)

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


def _build_payload() -> dict:
    """Query golden_tickets for latest date snapshot."""
    rows = _query_databricks("SELECT MAX(Date) AS d FROM sweetreturns.gold.golden_tickets")
    if not rows:
        return {"stocks": [], "source": "empty"}

    latest_date = rows[0].get("d")
    if not latest_date:
        return {"stocks": [], "source": "empty"}

    stock_rows = _query_databricks(
        """
        SELECT ticker, sector, close, daily_return,
               drawdown_pct, drawdown_percentile, volume_percentile, vol_percentile,
               market_cap, golden_score,
               dip_ticket, shock_ticket, asymmetry_ticket,
               dislocation_ticket, convexity_ticket,
               is_platinum,
               fwd_return_60d,
               bb_pct_b, zscore_20d, realized_vol_20d,
               momentum_5d, momentum_20d
        FROM sweetreturns.gold.golden_tickets
        WHERE date = %s
        ORDER BY sector, market_cap DESC
        """,
        [latest_date],
    )

    if not stock_rows:
        return {"stocks": [], "source": "empty"}

    stocks = []
    for row in stock_rows:
        gs = int(_f(row.get("golden_score")))
        fwd60 = _f(row.get("fwd_return_60d"))
        dd = _f(row.get("drawdown_pct"))
        vol = _f(row.get("realized_vol_20d"))

        # Derive direction bias from momentum and drawdown
        mom5 = _f(row.get("momentum_5d"))
        buy_bias = 0.35 if mom5 > 0 else 0.2
        short_bias = 0.15 if mom5 > 0 else 0.3
        call_bias = 0.3 if dd < -0.1 else 0.25
        put_bias = 1.0 - buy_bias - short_bias - call_bias

        # Derive store dimensions from golden_score
        base_w = 1.2 + gs * 0.3
        base_h = 1.5 + gs * 0.4
        base_d = 1.0 + gs * 0.2

        stocks.append({
            "ticker": row["ticker"],
            "sector": row.get("sector") or "Unknown",
            "close": _f(row.get("close")),
            "daily_return": round(_f(row.get("daily_return")), 6),
            "drawdown_current": round(dd, 4),
            "volume_percentile": round(_f(row.get("volume_percentile")), 4),
            "volatility_percentile": round(_f(row.get("vol_percentile")), 4),
            "market_cap_rank": round(_f(row.get("drawdown_percentile"), 0.5), 4),
            "golden_score": gs,
            "ticket_levels": {
                "dip_ticket": row.get("dip_ticket") in (True, "true", 1, "1"),
                "shock_ticket": row.get("shock_ticket") in (True, "true", 1, "1"),
                "asymmetry_ticket": row.get("asymmetry_ticket") in (True, "true", 1, "1"),
                "dislocation_ticket": row.get("dislocation_ticket") in (True, "true", 1, "1"),
                "convexity_ticket": row.get("convexity_ticket") in (True, "true", 1, "1"),
            },
            "is_platinum": row.get("is_platinum") in (True, "true", 1, "1"),
            "rarity_percentile": round(_f(row.get("drawdown_percentile"), 0.5), 4),
            "direction_bias": {
                "buy": round(buy_bias, 2),
                "call": round(call_bias, 2),
                "put": round(max(put_bias, 0.05), 2),
                "short": round(short_bias, 2),
            },
            "forward_return_distribution": {
                "p5": round(fwd60 - vol * 1.6, 4) if vol else -0.08,
                "p25": round(fwd60 - vol * 0.7, 4) if vol else -0.02,
                "median": round(fwd60, 4),
                "p75": round(fwd60 + vol * 0.7, 4) if vol else 0.05,
                "p95": round(fwd60 + vol * 1.6, 4) if vol else 0.12,
                "skew": round(mom5 * 0.5, 4),
            },
            "store_dimensions": {
                "width": round(base_w, 2),
                "height": round(base_h, 2),
                "depth": round(base_d, 2),
                "glow": round(gs * 0.2, 2),
            },
            "agent_density": max(50, int(200 + gs * 100)),
            "speed_multiplier": round(1.0 + abs(mom5) * 2, 2),
            "technicals": {
                "rsi_14": 50.0,
                "macd_histogram": round(mom5 * 0.01, 4),
                "bb_pct_b": round(_f(row.get("bb_pct_b"), 0.5), 4),
                "zscore_20d": round(_f(row.get("zscore_20d")), 4),
                "realized_vol_20d": round(vol, 4),
            },
            "volatility": round(vol, 4),
            "max_drawdown": round(dd, 4),
            "vol_spike": round(_f(row.get("volume_percentile")), 4),
            "skewness": round(mom5 * 0.5, 4),
            "ret_20d": round(_f(row.get("daily_return")), 6),
        })

    return {
        "stocks": stocks,
        "correlation_edges": [],
        "snapshot_date": str(latest_date),
        "stock_count": len(stocks),
        "source": "databricks",
    }


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            payload = _build_payload()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Cache-Control", "s-maxage=300, stale-while-revalidate=60")
            self.end_headers()
            self.wfile.write(json.dumps(payload).encode())
        except Exception as e:
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({
                "stocks": [],
                "source": "error",
                "error": str(e)[:200],
            }).encode())
