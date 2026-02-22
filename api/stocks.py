"""Vercel serverless: GET /api/stocks — live stock payload from Databricks.

Queries golden_tickets for the latest date snapshot. Handles both column naming
conventions (gold_tickets.py canonical names AND legacy names) for robustness.
"""
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


def _b(val):
    """Parse boolean from various DB representations."""
    return val in (True, "true", "True", 1, "1")


def _build_payload() -> dict:
    """Query golden_tickets for latest date snapshot."""
    rows = _query_databricks("SELECT MAX(Date) AS d FROM sweetreturns.gold.golden_tickets")
    if not rows:
        return {"stocks": [], "source": "empty"}

    latest_date = rows[0].get("d")
    if not latest_date:
        return {"stocks": [], "source": "empty"}

    # Query using COALESCE to handle both column naming conventions:
    # - gold_tickets.py (canonical): ticket_1_dip, market_cap_percentile, buy_pct, etc.
    # - legacy schema: dip_ticket, market_cap, momentum_5d, etc.
    stock_rows = _query_databricks(
        """
        SELECT ticker, sector,
               COALESCE(Close, close) AS close,
               daily_return,
               drawdown_pct, drawdown_percentile, volume_percentile, vol_percentile,
               COALESCE(market_cap_percentile, market_cap, 0.5) AS market_cap_pctile,
               golden_score,
               COALESCE(ticket_1_dip, dip_ticket, false) AS t1_dip,
               COALESCE(ticket_2_shock, shock_ticket, false) AS t2_shock,
               COALESCE(ticket_3_asymmetry, asymmetry_ticket, false) AS t3_asymmetry,
               COALESCE(ticket_4_dislocation, dislocation_ticket, false) AS t4_dislocation,
               COALESCE(ticket_5_convexity, convexity_ticket, false) AS t5_convexity,
               is_platinum,
               rarity_percentile,
               COALESCE(buy_pct, NULL) AS buy_pct,
               COALESCE(call_pct, NULL) AS call_pct,
               COALESCE(put_pct, NULL) AS put_pct,
               COALESCE(short_pct, NULL) AS short_pct,
               fwd_return_60d,
               COALESCE(fwd_60d_skew, NULL) AS fwd_skew,
               COALESCE(fwd_60d_p5, NULL) AS fwd_p5,
               COALESCE(fwd_60d_p25, NULL) AS fwd_p25,
               COALESCE(fwd_60d_median, NULL) AS fwd_median,
               COALESCE(fwd_60d_p75, NULL) AS fwd_p75,
               COALESCE(fwd_60d_p95, NULL) AS fwd_p95,
               rsi_14, macd_histogram,
               bb_pct_b, zscore_20d, realized_vol_20d,
               COALESCE(store_width, NULL) AS store_width,
               COALESCE(store_height, NULL) AS store_height,
               COALESCE(store_depth, NULL) AS store_depth,
               COALESCE(store_glow, NULL) AS store_glow,
               COALESCE(agent_density, NULL) AS agent_density,
               COALESCE(speed_multiplier, NULL) AS speed_multiplier
        FROM sweetreturns.gold.golden_tickets
        WHERE date = %s
        ORDER BY sector, market_cap_pctile DESC
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
        mcp = _f(row.get("market_cap_pctile"), 0.5)

        # Direction bias: use pre-computed from gold table if available (includes simulation feedback)
        buy_pct = row.get("buy_pct")
        if buy_pct is not None:
            buy_bias = _f(buy_pct, 0.30)
            call_bias = _f(row.get("call_pct"), 0.25)
            put_bias = _f(row.get("put_pct"), 0.25)
            short_bias = _f(row.get("short_pct"), 0.20)
        else:
            # Fallback: derive from RSI/drawdown
            rsi = _f(row.get("rsi_14"), 50)
            buy_bias = 0.35 if rsi > 50 else 0.2
            short_bias = 0.15 if rsi > 50 else 0.3
            call_bias = 0.3 if dd < -0.1 else 0.25
            put_bias = max(1.0 - buy_bias - short_bias - call_bias, 0.05)

        # Store dimensions: use pre-computed if available
        sw = row.get("store_width")
        if sw is not None:
            s_width = _f(sw, 1.5)
            s_height = _f(row.get("store_height"), 2.0)
            s_depth = _f(row.get("store_depth"), 1.0)
            s_glow = _f(row.get("store_glow"), 0.0)
        else:
            s_width = round(1.0 + mcp * 2.0, 2)
            s_height = round(1.5 + mcp * 2.5, 2)
            s_depth = round(1.0 + mcp * 1.0, 2)
            s_glow = round(gs / 5.0, 2)

        # Agent density: use pre-computed if available
        ad = row.get("agent_density")
        agent_dens = int(_f(ad)) if ad is not None else max(50, int(200 + gs * 100))

        sm = row.get("speed_multiplier")
        spd_mult = _f(sm, 1.0) if sm is not None else round(1.0 + gs * 0.3, 2)

        # Forward return distribution: use pre-computed percentiles if available
        fwd_p5 = row.get("fwd_p5")
        if fwd_p5 is not None:
            frd = {
                "p5": round(_f(fwd_p5), 4),
                "p25": round(_f(row.get("fwd_p25")), 4),
                "median": round(_f(row.get("fwd_median")), 4),
                "p75": round(_f(row.get("fwd_p75")), 4),
                "p95": round(_f(row.get("fwd_p95")), 4),
                "skew": round(_f(row.get("fwd_skew")), 4),
            }
        else:
            frd = {
                "p5": round(fwd60 - vol * 1.6, 4) if vol else -0.08,
                "p25": round(fwd60 - vol * 0.7, 4) if vol else -0.02,
                "median": round(fwd60, 4),
                "p75": round(fwd60 + vol * 0.7, 4) if vol else 0.05,
                "p95": round(fwd60 + vol * 1.6, 4) if vol else 0.12,
                "skew": round(_f(row.get("fwd_skew")), 4),
            }

        stocks.append({
            "ticker": row["ticker"],
            "sector": row.get("sector") or "Unknown",
            "close": _f(row.get("close")),
            "daily_return": round(_f(row.get("daily_return")), 6),
            "drawdown_current": round(dd, 4),
            "volume_percentile": round(_f(row.get("volume_percentile")), 4),
            "volatility_percentile": round(_f(row.get("vol_percentile")), 4),
            "market_cap_rank": round(mcp, 4),
            "golden_score": gs,
            "ticket_levels": {
                "dip_ticket": _b(row.get("t1_dip")),
                "shock_ticket": _b(row.get("t2_shock")),
                "asymmetry_ticket": _b(row.get("t3_asymmetry")),
                "dislocation_ticket": _b(row.get("t4_dislocation")),
                "convexity_ticket": _b(row.get("t5_convexity")),
            },
            "is_platinum": _b(row.get("is_platinum")),
            "rarity_percentile": round(_f(row.get("rarity_percentile"), 0.5), 4),
            "direction_bias": {
                "buy": round(buy_bias, 2),
                "call": round(call_bias, 2),
                "put": round(max(put_bias, 0.05), 2),
                "short": round(short_bias, 2),
            },
            "forward_return_distribution": frd,
            "store_dimensions": {
                "width": round(s_width, 2),
                "height": round(s_height, 2),
                "depth": round(s_depth, 2),
                "glow": round(s_glow, 2),
            },
            "agent_density": agent_dens,
            "speed_multiplier": round(spd_mult, 2),
            "technicals": {
                "rsi_14": round(_f(row.get("rsi_14"), 50), 2),
                "macd_histogram": round(_f(row.get("macd_histogram")), 4),
                "bb_pct_b": round(_f(row.get("bb_pct_b"), 0.5), 4),
                "zscore_20d": round(_f(row.get("zscore_20d")), 4),
                "realized_vol_20d": round(vol, 4),
            },
            "volatility": round(vol, 4),
            "max_drawdown": round(dd, 4),
            "vol_spike": round(_f(row.get("volume_percentile")), 4),
            "skewness": round(_f(row.get("fwd_skew")), 4),
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
            # 60s cache for continuous loop (was 300s)
            self.send_header("Cache-Control", "s-maxage=60, stale-while-revalidate=30")
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
