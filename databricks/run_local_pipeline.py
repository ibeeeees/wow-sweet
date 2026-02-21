#!/usr/bin/env python3
"""
SweetReturns — Local ETL Pipeline (Bronze → Silver → Gold → Export)
Runs the full Databricks pipeline locally using pandas.
Same computations as the Databricks notebooks, adapted for local execution.

Input:  stock_details_5_years.csv (Kaggle dataset)
Output: public/frontend_payload.json (consumed by the React frontend)
"""

import pandas as pd
import numpy as np
from scipy import stats as scipy_stats
import json
import math
import os
from datetime import datetime

# ── Paths ───────────────────────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)

CSV_PATH = os.path.join(
    os.path.expanduser("~"),
    ".cache", "kagglehub", "datasets",
    "iveeaten3223times", "massive-yahoo-finance-dataset",
    "versions", "2", "stock_details_5_years.csv"
)
OUTPUT_PATH = os.path.join(PROJECT_ROOT, "public", "frontend_payload.json")
OUTPUT_MIN_PATH = os.path.join(PROJECT_ROOT, "public", "frontend_payload.min.json")

# ── Sector Mapping ──────────────────────────────────────────────────────────
SECTOR_MAP = {
    "Technology": ["AAPL", "MSFT", "NVDA", "GOOGL", "META", "AVGO", "ORCL", "CRM", "AMD", "ADBE",
                   "ACN", "CSCO", "INTC", "TXN", "QCOM", "INTU", "AMAT", "NOW", "IBM", "MU",
                   "LRCX", "ADI", "SNPS", "CDNS", "KLAC", "MRVL", "FTNT", "PANW", "CRWD", "MSI",
                   "NXPI", "APH", "TEL", "ROP", "KEYS", "ANSS", "CDW", "ZBRA", "EPAM", "PAYC",
                   "GOOG", "PLTR", "NET", "DDOG"],
    "Healthcare": ["UNH", "JNJ", "LLY", "ABBV", "MRK", "PFE", "TMO", "ABT", "DHR", "BMY",
                   "AMGN", "MDT", "ELV", "ISRG", "GILD", "CI", "SYK", "CVS", "REGN", "VRTX",
                   "BSX", "ZTS", "BDX", "HUM", "MCK", "HCA", "IDXX", "IQV", "EW", "DXCM",
                   "MTD", "A", "BIIB", "ALGN", "HOLX", "BAX", "TECH", "HSIC", "VTRS", "OGN"],
    "Financials": ["BRK.B", "JPM", "V", "MA", "BAC", "WFC", "GS", "MS", "BLK", "SPGI",
                   "AXP", "C", "SCHW", "CB", "MMC", "PGR", "ICE", "CME", "AON", "USB",
                   "MCO", "PNC", "AIG", "MET", "TFC", "AMP", "AFL", "TRV", "ALL", "PRU",
                   "BK", "COF", "FIS", "MSCI", "FI", "RJF", "WRB", "HBAN", "NTRS", "STT"],
    "Consumer Discretionary": ["AMZN", "TSLA", "HD", "MCD", "NKE", "LOW", "SBUX", "TJX", "BKNG", "CMG",
                                "MAR", "ORLY", "AZO", "ROST", "DHI", "YUM", "DG", "LEN", "EBAY", "GPC",
                                "ULTA", "APTV", "BBY", "GRMN", "POOL", "MGM", "DRI", "HAS", "WHR", "NVR",
                                "TSCO", "KMX", "WYNN", "CZR", "LVS", "RCL", "CCL", "NCLH", "HLT", "EXPE"],
    "Communication Services": ["GOOG", "META", "DIS", "CMCSA", "NFLX", "VZ", "T", "TMUS", "CHTR", "ATVI",
                                "EA", "WBD", "PARA", "FOX", "FOXA", "OMC", "IPG", "TTWO", "MTCH", "LYV",
                                "RBLX", "ZM", "PINS", "SNAP", "ROKU"],
    "Industrials": ["GE", "CAT", "HON", "UNP", "RTX", "BA", "UPS", "DE", "LMT", "ADP",
                    "MMM", "GD", "NOC", "ITW", "EMR", "WM", "ETN", "PH", "CTAS", "FAST",
                    "CSX", "NSC", "TT", "CARR", "OTIS", "RSG", "VRSK", "CPRT", "ODFL", "URI",
                    "DAL", "LUV", "UAL", "AAL", "FDX", "CHRW", "JBHT", "XYL", "AME", "ROK"],
    "Consumer Staples": ["PG", "KO", "PEP", "COST", "WMT", "PM", "MO", "MDLZ", "CL", "EL",
                          "KMB", "GIS", "SYY", "KHC", "HSY", "MKC", "K", "CPB", "SJM", "HRL",
                          "CAG", "TSN", "ADM", "BG", "TAP", "STZ", "BF.B", "CLX", "CHD", "WBA"],
    "Energy": ["XOM", "CVX", "COP", "SLB", "EOG", "MPC", "PXD", "PSX", "VLO", "OXY",
               "WMB", "HES", "DVN", "HAL", "BKR", "FANG", "TRGP", "KMI", "OKE", "CTRA",
               "MRO", "APA", "DEN", "EQT", "AR"],
    "Utilities": ["NEE", "DUK", "SO", "AEP", "D", "SRE", "EXC", "XEL", "ED", "WEC",
                   "ES", "AWK", "DTE", "PPL", "FE", "AEE", "CMS", "CNP", "ATO", "EVRG",
                   "NI", "PNW", "NRG", "LNT", "OGE"],
    "Real Estate": ["PLD", "AMT", "CCI", "EQIX", "PSA", "SPG", "O", "DLR", "WELL", "AVB",
                     "EQR", "VTR", "ARE", "MAA", "UDR", "ESS", "HST", "KIM", "REG", "PEAK",
                     "CPT", "SUI", "BXP", "INVH", "CUBE"],
    "Materials": ["LIN", "APD", "SHW", "ECL", "FCX", "NEM", "NUE", "VMC", "MLM", "DOW",
                   "DD", "PPG", "CE", "EMN", "IP", "PKG", "AVY", "ALB", "CF", "MOS",
                   "FMC", "IFF", "CTVA", "SEE", "RPM"],
}

# Brand colors for known tickers
BRAND_COLORS = {
    "AAPL": "#A2AAAD", "MSFT": "#F25022", "NVDA": "#76B900", "GOOGL": "#4285F4",
    "GOOG": "#4285F4", "META": "#0668E1", "AMZN": "#FF9900", "TSLA": "#CC0000",
    "JPM": "#003B6F", "V": "#1A1F71", "MA": "#FF5F00", "HD": "#F96302",
    "DIS": "#003DA5", "NFLX": "#E50914", "KO": "#F40009", "PEP": "#004B93",
    "NKE": "#111111", "MCD": "#FFC72C", "SBUX": "#006241", "BA": "#003DA5",
    "GE": "#3B73B9", "XOM": "#D52B1E", "CVX": "#003DA5", "PG": "#003DA5",
    "JNJ": "#D51F26", "UNH": "#002677", "PFE": "#0093D0", "ABBV": "#071D49",
    "WMT": "#0071CE", "COST": "#E31837", "BAC": "#012169", "WFC": "#D71E28",
    "GS": "#6F9FD8", "BLK": "#000000", "CAT": "#FFCD11", "HON": "#D52B1E",
}

SECTOR_DISTRICT_NAMES = {
    "Technology": "Pixel Candy Arcade",
    "Healthcare": "Medicine Drop Apothecary",
    "Financials": "Chocolate Coin District",
    "Consumer Discretionary": "Candy Bar Boulevard",
    "Communication Services": "Bubblegum Broadcasting",
    "Industrials": "Gumball Factory Row",
    "Consumer Staples": "Sugar & Spice Market",
    "Energy": "Rock Candy Refinery",
    "Utilities": "Licorice Power Grid",
    "Real Estate": "Gingerbread Heights",
    "Materials": "Caramel Quarry",
}


def safe_float(val, default=0.0):
    if val is None or (isinstance(val, float) and (np.isnan(val) or np.isinf(val))):
        return default
    return float(val)


def ticker_to_color(ticker: str) -> str:
    """Generate a deterministic color from ticker string."""
    if ticker in BRAND_COLORS:
        return BRAND_COLORS[ticker]
    h = hash(ticker) % 360
    return f"hsl({h}, 70%, 50%)"


# ════════════════════════════════════════════════════════════════════════════
# BRONZE: Load raw CSV + sector mapping
# ════════════════════════════════════════════════════════════════════════════
def bronze_ingest(csv_path: str) -> pd.DataFrame:
    print("=" * 60)
    print("BRONZE: Raw Data Ingestion")
    print("=" * 60)

    df = pd.read_csv(csv_path, parse_dates=["Date"])
    df = df.rename(columns={"Company": "ticker", "Stock Splits": "stock_splits"})
    print(f"  Rows: {len(df):,}")
    print(f"  Tickers: {df['ticker'].nunique()}")
    print(f"  Date range: {df['Date'].min()} to {df['Date'].max()}")

    # Sector mapping
    ticker_sector = {}
    for sector, tickers in SECTOR_MAP.items():
        for t in tickers:
            ticker_sector[t] = sector
    df["sector"] = df["ticker"].map(ticker_sector)

    mapped = df["sector"].notna().sum()
    unmapped = df["sector"].isna().sum()
    print(f"  Mapped sectors: {mapped:,} rows ({df[df['sector'].notna()]['ticker'].nunique()} tickers)")
    print(f"  Unmapped: {unmapped:,} rows")

    # Drop rows without sector mapping (e.g., ETFs, foreign tickers)
    df = df[df["sector"].notna()].copy()
    df = df.sort_values(["ticker", "Date"]).reset_index(drop=True)
    print(f"  After filtering: {len(df):,} rows, {df['ticker'].nunique()} tickers")
    return df


# ════════════════════════════════════════════════════════════════════════════
# SILVER: Feature Engineering (technical indicators)
# ════════════════════════════════════════════════════════════════════════════
def silver_features(df: pd.DataFrame) -> pd.DataFrame:
    print("\n" + "=" * 60)
    print("SILVER: Feature Engineering")
    print("=" * 60)

    g = df.groupby("ticker")

    # Step 1: Daily returns
    df["prev_close"] = g["Close"].shift(1)
    df["daily_return"] = (df["Close"] - df["prev_close"]) / df["prev_close"]
    df["log_return"] = np.log(df["Close"] / df["prev_close"])
    print("  [1/15] Daily returns")

    # Step 2: Drawdown
    df["expanding_max_close"] = g["Close"].transform(lambda x: x.expanding().max())
    df["drawdown_pct"] = (df["Close"] - df["expanding_max_close"]) / df["expanding_max_close"]
    df["drawdown_percentile"] = g["drawdown_pct"].transform(lambda x: x.rank(pct=True))
    print("  [2/15] Drawdown")

    # Step 3: Realized Volatility
    SQRT_252 = math.sqrt(252)
    df["realized_vol_20d"] = g["daily_return"].transform(lambda x: x.rolling(20, min_periods=5).std() * SQRT_252)
    df["realized_vol_60d"] = g["daily_return"].transform(lambda x: x.rolling(60, min_periods=10).std() * SQRT_252)
    df["vol_percentile"] = g["realized_vol_20d"].transform(lambda x: x.rank(pct=True))
    print("  [3/15] Realized volatility")

    # Step 4: Volume percentile
    df["volume_percentile"] = g["Volume"].transform(lambda x: x.rank(pct=True))
    print("  [4/15] Volume percentile")

    # Step 5: RSI-14
    df["gain"] = df["daily_return"].clip(lower=0)
    df["loss"] = (-df["daily_return"]).clip(lower=0)
    df["avg_gain_14"] = g["gain"].transform(lambda x: x.rolling(14, min_periods=5).mean())
    df["avg_loss_14"] = g["loss"].transform(lambda x: x.rolling(14, min_periods=5).mean())
    df["rs_14"] = df["avg_gain_14"] / df["avg_loss_14"].replace(0, np.nan)
    df["rsi_14"] = 100 - (100 / (1 + df["rs_14"]))
    df["rsi_14"] = df["rsi_14"].fillna(50)
    print("  [5/15] RSI-14")

    # Step 6: MACD (SMA approximation)
    df["ema_12"] = g["Close"].transform(lambda x: x.rolling(12, min_periods=5).mean())
    df["ema_26"] = g["Close"].transform(lambda x: x.rolling(26, min_periods=10).mean())
    df["macd_line"] = df["ema_12"] - df["ema_26"]
    df["macd_signal"] = g["macd_line"].transform(lambda x: x.rolling(9, min_periods=3).mean())
    df["macd_histogram"] = df["macd_line"] - df["macd_signal"]
    print("  [6/15] MACD")

    # Step 7: Bollinger Bands
    df["bb_mid"] = g["Close"].transform(lambda x: x.rolling(20, min_periods=5).mean())
    df["bb_std"] = g["Close"].transform(lambda x: x.rolling(20, min_periods=5).std())
    df["bb_upper"] = df["bb_mid"] + 2 * df["bb_std"]
    df["bb_lower"] = df["bb_mid"] - 2 * df["bb_std"]
    denom = (df["bb_upper"] - df["bb_lower"]).replace(0, np.nan)
    df["bb_pct_b"] = (df["Close"] - df["bb_lower"]) / denom
    df["bb_pct_b"] = df["bb_pct_b"].fillna(0.5)
    print("  [7/15] Bollinger Bands")

    # Step 8: ATR-14
    df["prev_close_atr"] = g["Close"].shift(1)
    df["tr"] = np.maximum(
        df["High"] - df["Low"],
        np.maximum(
            (df["High"] - df["prev_close_atr"]).abs(),
            (df["Low"] - df["prev_close_atr"]).abs()
        )
    )
    df["atr_14"] = g["tr"].transform(lambda x: x.rolling(14, min_periods=5).mean())
    print("  [8/15] ATR-14")

    # Step 9: Rate of Change
    df["roc_5"] = g["Close"].transform(lambda x: x.pct_change(5))
    df["roc_20"] = g["Close"].transform(lambda x: x.pct_change(20))
    df["roc_60"] = g["Close"].transform(lambda x: x.pct_change(60))
    print("  [9/15] Rate of Change")

    # Step 10: Z-Scores
    df["mean_20d"] = g["Close"].transform(lambda x: x.rolling(20, min_periods=5).mean())
    df["std_20d"] = g["Close"].transform(lambda x: x.rolling(20, min_periods=5).std())
    df["zscore_20d"] = (df["Close"] - df["mean_20d"]) / df["std_20d"].replace(0, np.nan)
    df["zscore_20d"] = df["zscore_20d"].fillna(0)

    df["mean_60d"] = g["Close"].transform(lambda x: x.rolling(60, min_periods=10).mean())
    df["std_60d"] = g["Close"].transform(lambda x: x.rolling(60, min_periods=10).std())
    df["zscore_60d"] = (df["Close"] - df["mean_60d"]) / df["std_60d"].replace(0, np.nan)
    df["zscore_60d"] = df["zscore_60d"].fillna(0)
    print("  [10/15] Z-Scores")

    # Step 11: SPY Relative Return
    spy_df = df[df["ticker"] == "SPY"][["Date", "daily_return", "Close"]].copy()
    spy_df = spy_df.rename(columns={"daily_return": "spy_daily_return", "Close": "spy_close"})
    df = df.merge(spy_df[["Date", "spy_daily_return"]], on="Date", how="left")
    df["relative_return_vs_spy"] = df["daily_return"] - df["spy_daily_return"]
    g2 = df.groupby("ticker")
    df["relative_return_20d"] = g2["relative_return_vs_spy"].transform(
        lambda x: x.rolling(20, min_periods=5).sum()
    )
    df["relative_return_percentile"] = g2["relative_return_20d"].transform(lambda x: x.rank(pct=True))
    print("  [11/15] SPY relative returns")

    # Step 12: Forward Returns
    df["fwd_return_5d"] = g["Close"].transform(lambda x: x.shift(-5) / x - 1)
    df["fwd_return_20d"] = g["Close"].transform(lambda x: x.shift(-20) / x - 1)
    df["fwd_return_60d"] = g["Close"].transform(lambda x: x.shift(-60) / x - 1)
    print("  [12/15] Forward returns")

    # Step 13: Forward 60d distribution stats (skew, percentiles)
    def forward_stats(series):
        """Compute forward 60d return distribution stats per row."""
        result = pd.DataFrame(index=series.index, columns=[
            "fwd_60d_skew", "fwd_60d_p5", "fwd_60d_p25", "fwd_60d_median",
            "fwd_60d_p75", "fwd_60d_p95"
        ], dtype=float)

        vals = series.values
        n = len(vals)
        for i in range(n):
            end = min(i + 61, n)
            fwd = vals[i + 1:end]
            fwd = fwd[~np.isnan(fwd)]
            if len(fwd) >= 10:
                result.iloc[i] = [
                    float(scipy_stats.skew(fwd)),
                    float(np.percentile(fwd, 5)),
                    float(np.percentile(fwd, 25)),
                    float(np.percentile(fwd, 50)),
                    float(np.percentile(fwd, 75)),
                    float(np.percentile(fwd, 95)),
                ]
        return result

    print("  [13/15] Forward 60d distribution stats (this takes a minute)...")
    fwd_stats_list = []
    for ticker, group in df.groupby("ticker"):
        stats = forward_stats(group["daily_return"])
        stats.index = group.index
        fwd_stats_list.append(stats)

    fwd_stats_df = pd.concat(fwd_stats_list)
    for col in fwd_stats_df.columns:
        df[col] = fwd_stats_df[col].astype(float)

    # Step 14: Mean Reversion Score
    g3 = df.groupby("ticker")
    df["rolling_return_20d"] = g3["daily_return"].transform(lambda x: x.rolling(20, min_periods=5).sum())
    df["rolling_return_20d_lag1"] = df.groupby("ticker")["rolling_return_20d"].shift(1)
    # Approximate autocorrelation via rolling correlation
    df["mean_reversion_score"] = df.groupby("ticker").apply(
        lambda x: x["rolling_return_20d"].rolling(60, min_periods=20).corr(x["rolling_return_20d_lag1"]),
        include_groups=False
    ).reset_index(level=0, drop=True)
    print("  [14/15] Mean reversion score")

    # Step 15: Volatility Regime
    spy_vol = df[df["ticker"] == "SPY"][["Date", "realized_vol_20d"]].copy()
    spy_vol = spy_vol.rename(columns={"realized_vol_20d": "spy_vol_20d"})
    spy_vol_threshold = spy_vol["spy_vol_20d"].quantile(0.80) if len(spy_vol) > 0 else 0.20
    df = df.merge(spy_vol[["Date", "spy_vol_20d"]], on="Date", how="left")
    df["vol_regime"] = np.where(df["spy_vol_20d"] < spy_vol_threshold, "favorable", "elevated")
    print("  [15/15] Volatility regime")

    # Median drawdown per ticker
    median_dd = df.groupby("ticker")["drawdown_pct"].median().rename("median_drawdown")
    df = df.merge(median_dd, on="ticker", how="left")

    print(f"  Silver complete: {len(df):,} rows, {len(df.columns)} features")
    return df


# ════════════════════════════════════════════════════════════════════════════
# GOLD: Golden Ticket Computation
# ════════════════════════════════════════════════════════════════════════════
def gold_tickets(df: pd.DataFrame) -> pd.DataFrame:
    print("\n" + "=" * 60)
    print("GOLD: Golden Ticket Computation")
    print("=" * 60)

    # Ticket I: Dip Ticket
    df["ticket_1_dip"] = df["drawdown_percentile"] > 0.80
    t1 = df["ticket_1_dip"].sum()
    print(f"  Ticket I  (Sour Candy Drop):  {t1:,} activations")

    # Ticket II: Shock Ticket
    df["ticket_2_shock"] = (
        (df["drawdown_percentile"] > 0.85) &
        (df["volume_percentile"] > 0.90) &
        (df["vol_percentile"] > 0.85)
    )
    t2 = df["ticket_2_shock"].sum()
    print(f"  Ticket II (Jawbreaker):       {t2:,} activations")

    # Ticket III: Asymmetry Ticket
    df["ticket_3_asymmetry"] = (
        (df["drawdown_percentile"] > 0.85) &
        (df["fwd_60d_skew"] > 0.0) &
        (df["fwd_60d_p95"] > 2.0 * df["fwd_60d_median"]) &
        (df["fwd_60d_p5"] > df["median_drawdown"])
    )
    t3 = df["ticket_3_asymmetry"].sum()
    print(f"  Ticket III (Fortune Cookie):  {t3:,} activations")

    # Ticket IV: Dislocation Ticket
    df["ticket_4_dislocation"] = (
        (df["drawdown_percentile"] > 0.80) &
        (df["relative_return_percentile"] < 0.15) &
        (df["mean_reversion_score"] < -0.1)
    )
    t4 = df["ticket_4_dislocation"].sum()
    print(f"  Ticket IV (Taffy Pull):       {t4:,} activations")

    # Ticket V: Convexity Ticket
    df["ticket_5_convexity"] = (
        (df["drawdown_percentile"] > 0.90) &
        (df["volume_percentile"] > 0.90) &
        (df["relative_return_percentile"] < 0.15) &
        (df["fwd_60d_skew"] > 0.5) &
        (df["vol_regime"] == "favorable")
    )
    t5 = df["ticket_5_convexity"].sum()
    print(f"  Ticket V  (Golden Gummy Bear):{t5:,} activations")

    # Golden Score
    df["golden_score"] = (
        df["ticket_1_dip"].astype(int) +
        df["ticket_2_shock"].astype(int) +
        df["ticket_3_asymmetry"].astype(int) +
        df["ticket_4_dislocation"].astype(int) +
        df["ticket_5_convexity"].astype(int)
    )

    # Rarity percentile (cross-sectional per date)
    df["rarity_percentile"] = df.groupby("Date")["golden_score"].rank(pct=True)

    # Platinum detection
    df["is_platinum"] = (
        (df["golden_score"] >= 4) &
        (df["rarity_percentile"] > 0.98) &
        (df["fwd_60d_skew"] > 1.0) &
        (df["relative_return_percentile"] < 0.05) &
        (df["vol_regime"] == "favorable")
    )

    plat = df["is_platinum"].sum()
    print(f"\n  Golden Score Distribution:")
    for score in range(6):
        count = (df["golden_score"] == score).sum()
        pct = count / len(df) * 100
        print(f"    Score {score}: {count:>8,} ({pct:.1f}%)")
    print(f"  Platinum: {plat:,}")

    # Direction bias
    df["buy_pct"] = np.select(
        [(df["fwd_60d_skew"] > 0.5) & (df["fwd_60d_median"] > 0.02),
         (df["fwd_60d_skew"] > 0.3) & (df["fwd_60d_median"].abs() < 0.02),
         df["fwd_60d_skew"] < -0.3],
        [0.50, 0.20, 0.10], default=0.30
    )
    df["call_pct"] = np.select(
        [(df["fwd_60d_skew"] > 0.5) & (df["fwd_60d_median"] > 0.02),
         (df["fwd_60d_skew"] > 0.3) & (df["fwd_60d_median"].abs() < 0.02),
         df["fwd_60d_skew"] < -0.3],
        [0.30, 0.50, 0.10], default=0.25
    )
    df["put_pct"] = np.select(
        [(df["fwd_60d_skew"] > 0.5) & (df["fwd_60d_median"] > 0.02),
         (df["fwd_60d_skew"] > 0.3) & (df["fwd_60d_median"].abs() < 0.02),
         df["fwd_60d_skew"] < -0.3],
        [0.10, 0.20, 0.45], default=0.25
    )
    df["short_pct"] = np.select(
        [(df["fwd_60d_skew"] > 0.5) & (df["fwd_60d_median"] > 0.02),
         (df["fwd_60d_skew"] > 0.3) & (df["fwd_60d_median"].abs() < 0.02),
         df["fwd_60d_skew"] < -0.3],
        [0.10, 0.10, 0.35], default=0.20
    )

    # Market cap percentile (volume proxy)
    avg_vol = df.groupby("ticker")["Volume"].mean().rename("avg_volume")
    avg_vol_ranked = avg_vol.rank(pct=True).rename("market_cap_percentile")
    df = df.merge(avg_vol_ranked, on="ticker", how="left")

    # Store dimensions
    mcp = df["market_cap_percentile"]
    df["store_width"] = 1.0 + mcp * 2.0
    df["store_height"] = 1.5 + mcp * 2.5
    df["store_depth"] = 1.0 + mcp * 1.0
    df["store_glow"] = df["golden_score"] / 5.0

    # Agent density
    df["agent_density"] = 200 + np.floor(df["golden_score"].astype(float) ** 2.5 * 800).astype(int)
    df.loc[df["is_platinum"], "agent_density"] = (df.loc[df["is_platinum"], "agent_density"] * 3).astype(int)
    df["speed_multiplier"] = 1.0 + df["golden_score"] * 1.5

    print("  Gold layer complete")
    return df


# ════════════════════════════════════════════════════════════════════════════
# EXPORT: Build frontend_payload.json
# ════════════════════════════════════════════════════════════════════════════
def export_payload(df: pd.DataFrame, output_path: str) -> dict:
    print("\n" + "=" * 60)
    print("EXPORT: Building frontend_payload.json")
    print("=" * 60)

    # Use snapshot 90 days before dataset end so forward returns are populated
    max_date = df["Date"].max()
    target_date = max_date - pd.Timedelta(days=90)
    available_dates = df["Date"].unique()
    available_dates.sort()
    # Find closest date to target
    closest_idx = np.searchsorted(available_dates, target_date)
    closest_idx = min(closest_idx, len(available_dates) - 1)
    latest_date = available_dates[closest_idx]
    snapshot = df[df["Date"] == latest_date].copy()
    print(f"  Dataset end: {max_date}")
    print(f"  Snapshot date: {latest_date} (90 days before end for forward returns)")
    print(f"  Stocks on snapshot date: {len(snapshot)}")

    # Regime
    regime_counts = snapshot["vol_regime"].value_counts()
    current_regime = regime_counts.index[0] if len(regime_counts) > 0 else "unknown"
    print(f"  Market regime: {current_regime}")

    # Build stock records
    stocks_payload = []
    for _, row in snapshot.iterrows():
        ticker = row["ticker"]
        stocks_payload.append({
            "ticker": ticker,
            "company": ticker,  # Will be enriched by frontend
            "sector": row["sector"],
            "market_cap_rank": int(round(safe_float(row.get("market_cap_percentile", 0.5)) * len(snapshot))),
            "golden_score": int(safe_float(row["golden_score"], 0)),
            "ticket_levels": {
                "dip_ticket": bool(row["ticket_1_dip"]),
                "shock_ticket": bool(row["ticket_2_shock"]),
                "asymmetry_ticket": bool(row["ticket_3_asymmetry"]),
                "dislocation_ticket": bool(row["ticket_4_dislocation"]),
                "convexity_ticket": bool(row["ticket_5_convexity"]),
            },
            "is_platinum": bool(row["is_platinum"]),
            "rarity_percentile": round(safe_float(row["rarity_percentile"]), 4),
            "direction_bias": {
                "buy": round(safe_float(row["buy_pct"], 0.25), 2),
                "call": round(safe_float(row["call_pct"], 0.25), 2),
                "put": round(safe_float(row["put_pct"], 0.25), 2),
                "short": round(safe_float(row["short_pct"], 0.25), 2),
            },
            "forward_return_distribution": {
                "p5": round(safe_float(row.get("fwd_60d_p5", 0)), 4),
                "p25": round(safe_float(row.get("fwd_60d_p25", 0)), 4),
                "median": round(safe_float(row.get("fwd_60d_median", 0)), 4),
                "p75": round(safe_float(row.get("fwd_60d_p75", 0)), 4),
                "p95": round(safe_float(row.get("fwd_60d_p95", 0)), 4),
                "skew": round(safe_float(row.get("fwd_60d_skew", 0)), 4),
            },
            "drawdown_current": round(safe_float(row["drawdown_pct"]), 4),
            "volume_percentile": round(safe_float(row["volume_percentile"]), 4),
            "volatility_percentile": round(safe_float(row["vol_percentile"]), 4),
            "brand_color": ticker_to_color(ticker),
            "store_dimensions": {
                "width": round(safe_float(row["store_width"], 1.5), 2),
                "height": round(safe_float(row["store_height"], 2.0), 2),
                "depth": round(safe_float(row["store_depth"], 1.2), 2),
            },
            "agent_density": int(safe_float(row["agent_density"], 200)),
            "speed_multiplier": round(safe_float(row["speed_multiplier"], 1.0), 2),
            "technicals": {
                "rsi_14": round(safe_float(row.get("rsi_14", 50)), 2),
                "macd_histogram": round(safe_float(row.get("macd_histogram", 0)), 4),
                "bb_pct_b": round(safe_float(row.get("bb_pct_b", 0.5)), 4),
                "zscore_20d": round(safe_float(row.get("zscore_20d", 0)), 4),
                "realized_vol_20d": round(safe_float(row.get("realized_vol_20d", 0)), 4),
            },
        })

    print(f"  Built {len(stocks_payload)} stock records")

    # Correlation edges
    print("  Computing correlation matrix...")
    returns_pivot = df.pivot_table(index="Date", columns="ticker", values="daily_return")
    corr_matrix = returns_pivot.corr(method="pearson")

    CORRELATION_THRESHOLD = 0.5
    MAX_EDGES = 2000
    edges = []
    tickers_list = list(corr_matrix.columns)

    for i in range(len(tickers_list)):
        for j in range(i + 1, len(tickers_list)):
            corr_val = corr_matrix.iloc[i, j]
            if not np.isnan(corr_val) and abs(corr_val) >= CORRELATION_THRESHOLD:
                edges.append({
                    "source": tickers_list[i],
                    "target": tickers_list[j],
                    "weight": round(float(corr_val), 4),
                })
    edges.sort(key=lambda e: abs(e["weight"]), reverse=True)
    edges = edges[:MAX_EDGES]
    print(f"  Correlation edges (|r| >= {CORRELATION_THRESHOLD}): {len(edges)}")

    # Sector metadata
    sectors_payload = []
    sector_positions = {
        "Technology": (0, 0), "Healthcare": (1, 0), "Financials": (2, 0),
        "Consumer Discretionary": (0, 1), "Communication Services": (1, 1),
        "Industrials": (2, 1), "Consumer Staples": (0, 2), "Energy": (1, 2),
        "Utilities": (2, 2), "Real Estate": (0, 3), "Materials": (1, 3),
    }

    for sector_name, (gc, gr) in sector_positions.items():
        sector_stocks = [s for s in stocks_payload if s["sector"] == sector_name]
        sectors_payload.append({
            "name": sector_name,
            "candy_district": SECTOR_DISTRICT_NAMES.get(sector_name, sector_name),
            "grid_position": {"col": gc, "row": gr},
            "stock_count": len(sector_stocks),
            "avg_golden_score": round(
                sum(s["golden_score"] for s in sector_stocks) / max(len(sector_stocks), 1), 2
            ),
            "platinum_count": sum(1 for s in sector_stocks if s["is_platinum"]),
        })

    # ── Backtest Metrics ──
    print("  Computing backtest metrics...")
    backtest = {}
    try:
        # Group stocks by golden score tier
        gs_col = "golden_score"
        fwd_col = "fwd_60d_median"
        if fwd_col in snapshot.columns and gs_col in snapshot.columns:
            # Average forward return by golden score
            tier_returns = {}
            for score in range(6):
                tier = snapshot[snapshot[gs_col] == score]
                if len(tier) > 0:
                    med_ret = tier[fwd_col].median()
                    mean_ret = tier[fwd_col].mean()
                    tier_returns[str(score)] = {
                        "count": int(len(tier)),
                        "median_fwd_return": round(float(med_ret) if not np.isnan(med_ret) else 0, 4),
                        "mean_fwd_return": round(float(mean_ret) if not np.isnan(mean_ret) else 0, 4),
                    }
            backtest["returns_by_golden_score"] = tier_returns

            # Golden ticket (score >= 1) vs non-golden
            golden = snapshot[snapshot[gs_col] >= 1]
            non_golden = snapshot[snapshot[gs_col] == 0]
            golden_ret = golden[fwd_col].median() if len(golden) > 0 else 0
            non_golden_ret = non_golden[fwd_col].median() if len(non_golden) > 0 else 0
            golden_ret = float(golden_ret) if not np.isnan(golden_ret) else 0
            non_golden_ret = float(non_golden_ret) if not np.isnan(non_golden_ret) else 0

            backtest["golden_vs_baseline"] = {
                "golden_median_return": round(golden_ret, 4),
                "baseline_median_return": round(non_golden_ret, 4),
                "alpha": round(golden_ret - non_golden_ret, 4),
                "golden_count": int(len(golden)),
                "baseline_count": int(len(non_golden)),
            }

            # Per-ticket precision (% of stocks with that ticket that had positive forward return)
            ticket_metrics = {}
            for ticket_name, col_name in [
                ("dip", "ticket_1_dip"), ("shock", "ticket_2_shock"),
                ("asymmetry", "ticket_3_asymmetry"), ("dislocation", "ticket_4_dislocation"),
                ("convexity", "ticket_5_convexity"),
            ]:
                if col_name in snapshot.columns:
                    holders = snapshot[snapshot[col_name] == True]
                    if len(holders) > 0:
                        positive = holders[holders[fwd_col] > 0]
                        avg_ret = holders[fwd_col].mean()
                        avg_ret = float(avg_ret) if not np.isnan(avg_ret) else 0
                        ticket_metrics[ticket_name] = {
                            "holders": int(len(holders)),
                            "precision": round(len(positive) / len(holders), 4) if len(holders) > 0 else 0,
                            "avg_forward_return": round(avg_ret, 4),
                        }
            backtest["ticket_precision"] = ticket_metrics

            # SPY comparison (if SPY is in the dataset)
            spy_data = snapshot[snapshot["ticker"] == "SPY"]
            if len(spy_data) > 0:
                spy_ret = float(spy_data[fwd_col].iloc[0])
                spy_ret = spy_ret if not np.isnan(spy_ret) else 0
            else:
                spy_ret = non_golden_ret  # Use baseline as proxy
            backtest["spy_comparison"] = {
                "spy_60d_return": round(spy_ret, 4),
                "golden_outperformance": round(golden_ret - spy_ret, 4),
            }

            # Drawdown analysis: stocks in deep drawdown with golden tickets
            deep_dd = snapshot[(snapshot["drawdown_pct"] < -0.15) & (snapshot[gs_col] >= 1)]
            backtest["dip_buying_signal"] = {
                "deep_drawdown_golden_count": int(len(deep_dd)),
                "avg_forward_return_deep_dd_golden": round(
                    float(deep_dd[fwd_col].mean()) if len(deep_dd) > 0 and not np.isnan(deep_dd[fwd_col].mean()) else 0, 4
                ),
            }

        print(f"  Backtest metrics computed")
    except Exception as e:
        print(f"  Warning: Backtest metrics failed: {e}")
        backtest = {"error": str(e)}

    # Assemble payload
    payload = {
        "generated_at": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "snapshot_date": str(latest_date.date()) if hasattr(latest_date, "date") else str(latest_date),
        "dataset_end_date": str(max_date.date()) if hasattr(max_date, "date") else str(max_date),
        "regime": current_regime,
        "stock_count": len(stocks_payload),
        "total_agents": sum(s["agent_density"] for s in stocks_payload),
        "platinum_count": sum(1 for s in stocks_payload if s["is_platinum"]),
        "golden_score_distribution": {
            str(score): sum(1 for s in stocks_payload if s["golden_score"] == score)
            for score in range(6)
        },
        "backtest": backtest,
        "stocks": stocks_payload,
        "correlation_edges": edges,
        "sectors": sectors_payload,
    }

    # Write output
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    with open(output_path, "w") as f:
        json.dump(payload, f, indent=2)
    print(f"  Written: {output_path} ({os.path.getsize(output_path) / 1024:.1f} KB)")

    output_min = output_path.replace(".json", ".min.json")
    with open(output_min, "w") as f:
        json.dump(payload, f, separators=(",", ":"))
    print(f"  Written: {output_min} ({os.path.getsize(output_min) / 1024:.1f} KB)")

    # Summary
    print(f"\n  === Summary ===")
    print(f"  Stocks: {payload['stock_count']}")
    print(f"  Correlation edges: {len(payload['correlation_edges'])}")
    print(f"  Total agents: {payload['total_agents']:,}")
    print(f"  Platinum stores: {payload['platinum_count']}")
    print(f"  Golden Score Distribution:")
    for score, count in sorted(payload["golden_score_distribution"].items()):
        bar = "#" * (int(count) // 3)
        print(f"    Score {score}: {count:>4} {bar}")

    return payload


# ════════════════════════════════════════════════════════════════════════════
# MAIN
# ════════════════════════════════════════════════════════════════════════════
if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("SweetReturns — Local ETL Pipeline")
    print("=" * 60)
    print(f"CSV: {CSV_PATH}")
    print(f"Output: {OUTPUT_PATH}")

    if not os.path.exists(CSV_PATH):
        print(f"\nERROR: CSV not found at {CSV_PATH}")
        print("Run: python -c \"import kagglehub; kagglehub.dataset_download('iveeaten3223times/massive-yahoo-finance-dataset')\"")
        exit(1)

    start = datetime.now()

    df = bronze_ingest(CSV_PATH)
    df = silver_features(df)
    df = gold_tickets(df)
    payload = export_payload(df, OUTPUT_PATH)

    elapsed = (datetime.now() - start).total_seconds()
    print(f"\n{'=' * 60}")
    print(f"Pipeline complete in {elapsed:.1f}s")
    print(f"{'=' * 60}")
