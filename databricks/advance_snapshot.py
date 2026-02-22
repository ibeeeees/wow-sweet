# Databricks notebook source
# MAGIC %md
# MAGIC # Advance Snapshot — Incremental Pipeline Step
# MAGIC Processes the NEXT trading day incrementally:
# MAGIC 1. Reads current MAX(Date) from golden_tickets
# MAGIC 2. Finds next available date in bronze.raw_stock_data
# MAGIC 3. Computes silver features for that date (using lookback from existing silver)
# MAGIC 4. Computes gold tickets for that date
# MAGIC 5. Appends to golden_tickets (no overwrite)
# MAGIC 6. Optionally reads simulation_results to adjust direction biases
# MAGIC
# MAGIC This script is designed to run on a schedule (every 5 min = 1 trading day).

# COMMAND ----------

from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.window import Window
from pyspark.sql.types import DoubleType, IntegerType
import math

spark = SparkSession.builder.getOrCreate()

# COMMAND ----------

# MAGIC %md
# MAGIC ## 1. Determine Current and Next Date

# COMMAND ----------

# Get current latest date in gold
gold_exists = True
try:
    current_max_row = spark.sql(
        "SELECT MAX(Date) AS max_date FROM sweetreturns.gold.golden_tickets"
    ).collect()
    current_max_date = current_max_row[0]["max_date"]
    print(f"Current latest date in golden_tickets: {current_max_date}")
except Exception:
    gold_exists = False
    current_max_date = None
    print("No golden_tickets table found — will process from earliest available date")

# COMMAND ----------

# Find the next trading day in bronze
if current_max_date:
    next_dates = (
        spark.table("sweetreturns.bronze.raw_stock_data")
        .filter(F.col("Date") > F.lit(current_max_date))
        .select("Date")
        .distinct()
        .orderBy("Date")
        .limit(1)
        .collect()
    )
else:
    # Start from the beginning — pick the first date with enough lookback
    next_dates = (
        spark.table("sweetreturns.bronze.raw_stock_data")
        .select("Date")
        .distinct()
        .orderBy("Date")
        .collect()
    )
    # Skip first 252 rows to ensure enough lookback for all windows
    if len(next_dates) > 252:
        next_dates = [next_dates[252]]
    else:
        next_dates = [next_dates[-1]] if next_dates else []

if not next_dates:
    print("NO MORE DATES TO PROCESS — dataset fully consumed. Wrapping around to start.")
    # Wrap around: reset to earliest date with enough lookback
    all_dates = (
        spark.table("sweetreturns.bronze.raw_stock_data")
        .select("Date")
        .distinct()
        .orderBy("Date")
        .collect()
    )
    if len(all_dates) > 252:
        target_date = all_dates[252]["Date"]
        # Clear gold table to restart
        spark.sql("DELETE FROM sweetreturns.gold.golden_tickets")
        print(f"Reset golden_tickets — restarting from {target_date}")
    else:
        dbutils.notebook.exit("No dates available in bronze table")  # noqa: F821
        import sys; sys.exit(0)
else:
    target_date = next_dates[0]["Date"]

print(f"Processing next trading day: {target_date}")

# COMMAND ----------

# MAGIC %md
# MAGIC ## 2. Compute Silver Features for Target Date
# MAGIC We need lookback data for window functions, so we read a range from bronze
# MAGIC and compute features, then filter to just the target date.

# COMMAND ----------

SQRT_252 = math.sqrt(252)

# Read bronze data up to and including target date (need 252 days of lookback)
bronze_df = (
    spark.table("sweetreturns.bronze.raw_stock_data")
    .filter(F.col("Date") <= F.lit(target_date))
)

# Base windows
w_ticker = Window.partitionBy("ticker").orderBy("Date")
w_ticker_all = Window.partitionBy("ticker").orderBy("Date").rowsBetween(
    Window.unboundedPreceding, Window.currentRow
)

w_5d = Window.partitionBy("ticker").orderBy("Date").rowsBetween(-4, 0)
w_14d = Window.partitionBy("ticker").orderBy("Date").rowsBetween(-13, 0)
w_20d = Window.partitionBy("ticker").orderBy("Date").rowsBetween(-19, 0)
w_26d = Window.partitionBy("ticker").orderBy("Date").rowsBetween(-25, 0)
w_60d = Window.partitionBy("ticker").orderBy("Date").rowsBetween(-59, 0)

# Forward windows — we also need a small window ahead for forward returns
# Read a bit of future data for forward return computation
bronze_with_future = (
    spark.table("sweetreturns.bronze.raw_stock_data")
    .filter(F.col("Date") <= F.date_add(F.lit(target_date), 60))
)

# Daily returns
df = bronze_with_future.withColumn(
    "prev_close", F.lag("Close", 1).over(w_ticker)
).withColumn(
    "daily_return", (F.col("Close") - F.col("prev_close")) / F.col("prev_close")
).withColumn(
    "log_return", F.log(F.col("Close") / F.col("prev_close"))
)

# Drawdown
df = df.withColumn(
    "expanding_max_close", F.max("Close").over(w_ticker_all)
).withColumn(
    "drawdown_pct",
    (F.col("Close") - F.col("expanding_max_close")) / F.col("expanding_max_close"),
)

w_drawdown_rank = Window.partitionBy("ticker").orderBy(F.col("drawdown_pct").asc())
df = df.withColumn("drawdown_percentile", F.percent_rank().over(w_drawdown_rank))

# Volatility
df = df.withColumn(
    "realized_vol_20d", F.stddev("daily_return").over(w_20d) * F.lit(SQRT_252)
).withColumn(
    "realized_vol_60d", F.stddev("daily_return").over(w_60d) * F.lit(SQRT_252)
)

w_vol_rank = Window.partitionBy("ticker").orderBy(F.col("realized_vol_20d").asc())
df = df.withColumn("vol_percentile", F.percent_rank().over(w_vol_rank))

# Volume percentile
w_vol_pctile_rank = Window.partitionBy("ticker").orderBy(F.col("Volume").asc())
df = df.withColumn("volume_percentile", F.percent_rank().over(w_vol_pctile_rank))

# RSI-14
df = df.withColumn(
    "gain", F.when(F.col("daily_return") > 0, F.col("daily_return")).otherwise(0.0)
).withColumn(
    "loss", F.when(F.col("daily_return") < 0, -F.col("daily_return")).otherwise(0.0)
).withColumn(
    "avg_gain_14", F.avg("gain").over(w_14d)
).withColumn(
    "avg_loss_14", F.avg("loss").over(w_14d)
).withColumn(
    "rs_14",
    F.when(F.col("avg_loss_14") > 0, F.col("avg_gain_14") / F.col("avg_loss_14")).otherwise(100.0),
).withColumn(
    "rsi_14", F.lit(100.0) - (F.lit(100.0) / (F.lit(1.0) + F.col("rs_14")))
)

# MACD (SMA approximation)
w_12d = Window.partitionBy("ticker").orderBy("Date").rowsBetween(-11, 0)
w_9d = Window.partitionBy("ticker").orderBy("Date").rowsBetween(-8, 0)

df = df.withColumn("ema_12", F.avg("Close").over(w_12d)).withColumn(
    "ema_26", F.avg("Close").over(w_26d)
).withColumn(
    "macd_line", F.col("ema_12") - F.col("ema_26")
).withColumn(
    "macd_signal", F.avg("macd_line").over(w_9d)
).withColumn(
    "macd_histogram", F.col("macd_line") - F.col("macd_signal")
)

# Bollinger Bands
df = df.withColumn("bb_mid", F.avg("Close").over(w_20d)).withColumn(
    "bb_std", F.stddev("Close").over(w_20d)
).withColumn(
    "bb_upper", F.col("bb_mid") + F.lit(2.0) * F.col("bb_std")
).withColumn(
    "bb_lower", F.col("bb_mid") - F.lit(2.0) * F.col("bb_std")
).withColumn(
    "bb_pct_b",
    F.when(
        F.col("bb_std") > 0,
        (F.col("Close") - F.col("bb_lower")) / (F.col("bb_upper") - F.col("bb_lower")),
    ).otherwise(0.5),
)

# Z-scores
df = df.withColumn("mean_20d", F.avg("Close").over(w_20d)).withColumn(
    "std_20d", F.stddev("Close").over(w_20d)
).withColumn(
    "zscore_20d",
    F.when(F.col("std_20d") > 0, (F.col("Close") - F.col("mean_20d")) / F.col("std_20d")).otherwise(
        0.0
    ),
)

# SPY relative
spy_df = (
    df.filter(F.col("ticker") == "SPY")
    .select(
        F.col("Date").alias("spy_date"),
        F.col("daily_return").alias("spy_daily_return"),
        F.col("realized_vol_20d").alias("spy_vol_20d"),
    )
)

df = df.join(spy_df, df["Date"] == spy_df["spy_date"], "left").drop("spy_date")

df = df.withColumn(
    "relative_return_vs_spy", F.col("daily_return") - F.col("spy_daily_return")
)

w_20d_rel = Window.partitionBy("ticker").orderBy("Date").rowsBetween(-19, 0)
df = df.withColumn("relative_return_20d", F.sum("relative_return_vs_spy").over(w_20d_rel))

w_rel_rank = Window.partitionBy("ticker").orderBy(F.col("relative_return_20d").asc())
df = df.withColumn("relative_return_percentile", F.percent_rank().over(w_rel_rank))

# Forward returns
df = df.withColumn(
    "close_fwd_5d", F.lead("Close", 5).over(w_ticker)
).withColumn(
    "close_fwd_20d", F.lead("Close", 20).over(w_ticker)
).withColumn(
    "close_fwd_60d", F.lead("Close", 60).over(w_ticker)
).withColumn(
    "fwd_return_5d", (F.col("close_fwd_5d") - F.col("Close")) / F.col("Close")
).withColumn(
    "fwd_return_20d", (F.col("close_fwd_20d") - F.col("Close")) / F.col("Close")
).withColumn(
    "fwd_return_60d", (F.col("close_fwd_60d") - F.col("Close")) / F.col("Close")
)

# Forward 60d skew & distribution
w_fwd_60d = Window.partitionBy("ticker").orderBy("Date").rowsBetween(1, 60)
df = df.withColumn("fwd_60d_returns", F.collect_list("daily_return").over(w_fwd_60d))

from scipy import stats as scipy_stats
import numpy as np


@F.udf(DoubleType())
def calc_skew(returns):
    if returns is None or len(returns) < 10:
        return None
    arr = np.array([r for r in returns if r is not None])
    if len(arr) < 10:
        return None
    return float(scipy_stats.skew(arr))


@F.udf(DoubleType())
def calc_percentile(returns, pct):
    if returns is None or len(returns) < 10:
        return None
    arr = np.array([r for r in returns if r is not None])
    if len(arr) < 10:
        return None
    return float(np.percentile(arr, pct))


df = (
    df.withColumn("fwd_60d_skew", calc_skew(F.col("fwd_60d_returns")))
    .withColumn("fwd_60d_p5", calc_percentile(F.col("fwd_60d_returns"), F.lit(5.0)))
    .withColumn("fwd_60d_p25", calc_percentile(F.col("fwd_60d_returns"), F.lit(25.0)))
    .withColumn("fwd_60d_median", calc_percentile(F.col("fwd_60d_returns"), F.lit(50.0)))
    .withColumn("fwd_60d_p75", calc_percentile(F.col("fwd_60d_returns"), F.lit(75.0)))
    .withColumn("fwd_60d_p95", calc_percentile(F.col("fwd_60d_returns"), F.lit(95.0)))
)

# Mean reversion score
df = df.withColumn(
    "rolling_return_20d", F.sum("daily_return").over(w_20d)
).withColumn(
    "rolling_return_20d_lag1", F.lag("rolling_return_20d", 1).over(w_ticker)
)

w_60d_corr = Window.partitionBy("ticker").orderBy("Date").rowsBetween(-59, 0)
df = df.withColumn(
    "mean_reversion_score",
    F.corr("rolling_return_20d", "rolling_return_20d_lag1").over(w_60d_corr),
)

# Volatility regime
spy_vol_stats = (
    df.filter(F.col("ticker") == "SPY")
    .select(F.percentile_approx("spy_vol_20d", 0.80).alias("spy_vol_p80"))
    .collect()
)
spy_vol_threshold = spy_vol_stats[0]["spy_vol_p80"] if spy_vol_stats else 0.20

df = df.withColumn(
    "vol_regime",
    F.when(F.col("spy_vol_20d") < F.lit(spy_vol_threshold), F.lit("favorable")).otherwise(
        F.lit("elevated")
    ),
)

# Median drawdown per ticker
median_dd_df = df.groupBy("ticker").agg(
    F.percentile_approx("drawdown_pct", 0.50).alias("median_drawdown")
)
df = df.join(median_dd_df, on="ticker", how="left")

# COMMAND ----------

# MAGIC %md
# MAGIC ## 3. Filter to Target Date Only & Compute Gold Tickets

# COMMAND ----------

# Filter to just the target date
target_df = df.filter(F.col("Date") == F.lit(target_date))

print(f"Rows for {target_date}: {target_df.count()}")

# COMMAND ----------

# Golden tickets
target_df = target_df.withColumn(
    "ticket_1_dip",
    F.when(F.col("drawdown_percentile") > 0.80, F.lit(True)).otherwise(F.lit(False)),
).withColumn(
    "ticket_2_shock",
    F.when(
        (F.col("drawdown_percentile") > 0.85)
        & (F.col("volume_percentile") > 0.90)
        & (F.col("vol_percentile") > 0.85),
        F.lit(True),
    ).otherwise(F.lit(False)),
).withColumn(
    "ticket_3_asymmetry",
    F.when(
        (F.col("drawdown_percentile") > 0.85)
        & (F.col("fwd_60d_skew") > 0.0)
        & (F.col("fwd_60d_p95") > F.lit(2.0) * F.col("fwd_60d_median"))
        & (F.col("fwd_60d_p5") > F.col("median_drawdown")),
        F.lit(True),
    ).otherwise(F.lit(False)),
).withColumn(
    "ticket_4_dislocation",
    F.when(
        (F.col("drawdown_percentile") > 0.80)
        & (F.col("relative_return_percentile") < 0.15)
        & (F.col("mean_reversion_score") < -0.1),
        F.lit(True),
    ).otherwise(F.lit(False)),
).withColumn(
    "ticket_5_convexity",
    F.when(
        (F.col("drawdown_percentile") > 0.90)
        & (F.col("volume_percentile") > 0.90)
        & (F.col("relative_return_percentile") < 0.15)
        & (F.col("fwd_60d_skew") > 0.5)
        & (F.col("vol_regime") == "favorable"),
        F.lit(True),
    ).otherwise(F.lit(False)),
)

# Golden score
target_df = target_df.withColumn(
    "golden_score",
    F.col("ticket_1_dip").cast(IntegerType())
    + F.col("ticket_2_shock").cast(IntegerType())
    + F.col("ticket_3_asymmetry").cast(IntegerType())
    + F.col("ticket_4_dislocation").cast(IntegerType())
    + F.col("ticket_5_convexity").cast(IntegerType()),
)

# Rarity percentile (cross-sectional on this date)
w_date_rank = Window.partitionBy("Date").orderBy(
    F.col("golden_score").asc(), F.col("drawdown_percentile").asc()
)
target_df = target_df.withColumn("rarity_percentile", F.percent_rank().over(w_date_rank))

# Platinum detection
target_df = target_df.withColumn(
    "is_platinum",
    F.when(
        (F.col("golden_score") >= 4)
        & (F.col("rarity_percentile") > 0.98)
        & (F.col("fwd_60d_skew") > 1.0)
        & (F.col("relative_return_percentile") < 0.05)
        & (F.col("vol_regime") == "favorable"),
        F.lit(True),
    ).otherwise(F.lit(False)),
)

# COMMAND ----------

# MAGIC %md
# MAGIC ## 4. Direction Bias (with Simulation Feedback)

# COMMAND ----------

# Check if simulation results exist for the previous date to influence biases
sim_adjustment = None
try:
    if current_max_date:
        sim_df = spark.sql(f"""
            SELECT ticker,
                   AVG(buy_crowd) as avg_buy_crowd,
                   AVG(call_crowd) as avg_call_crowd,
                   AVG(put_crowd) as avg_put_crowd,
                   AVG(short_crowd) as avg_short_crowd,
                   COUNT(*) as trade_count,
                   AVG(profit) as avg_profit
            FROM sweetreturns.gold.simulation_results
            WHERE snapshot_date = '{current_max_date}'
            GROUP BY ticker
        """)
        if sim_df.count() > 0:
            sim_adjustment = sim_df
            print(f"Found {sim_df.count()} simulation records for {current_max_date} — applying crowd feedback")
        else:
            print("No simulation results for previous date — using default biases")
except Exception as e:
    print(f"No simulation feedback available: {e}")

# COMMAND ----------

# Base direction bias from forward skew (same logic as gold_tickets.py)
target_df = target_df.withColumn(
    "buy_pct",
    F.when(
        (F.col("fwd_60d_skew") > 0.5) & (F.col("fwd_60d_median") > 0.02), F.lit(0.50)
    )
    .when(
        (F.col("fwd_60d_skew") > 0.3) & (F.abs(F.col("fwd_60d_median")) < 0.02),
        F.lit(0.20),
    )
    .when(F.col("fwd_60d_skew") < -0.3, F.lit(0.10))
    .otherwise(F.lit(0.30)),
).withColumn(
    "call_pct",
    F.when(
        (F.col("fwd_60d_skew") > 0.5) & (F.col("fwd_60d_median") > 0.02), F.lit(0.30)
    )
    .when(
        (F.col("fwd_60d_skew") > 0.3) & (F.abs(F.col("fwd_60d_median")) < 0.02),
        F.lit(0.50),
    )
    .when(F.col("fwd_60d_skew") < -0.3, F.lit(0.10))
    .otherwise(F.lit(0.25)),
).withColumn(
    "put_pct",
    F.when(
        (F.col("fwd_60d_skew") > 0.5) & (F.col("fwd_60d_median") > 0.02), F.lit(0.10)
    )
    .when(
        (F.col("fwd_60d_skew") > 0.3) & (F.abs(F.col("fwd_60d_median")) < 0.02),
        F.lit(0.20),
    )
    .when(F.col("fwd_60d_skew") < -0.3, F.lit(0.45))
    .otherwise(F.lit(0.25)),
).withColumn(
    "short_pct",
    F.when(
        (F.col("fwd_60d_skew") > 0.5) & (F.col("fwd_60d_median") > 0.02), F.lit(0.10)
    )
    .when(
        (F.col("fwd_60d_skew") > 0.3) & (F.abs(F.col("fwd_60d_median")) < 0.02),
        F.lit(0.10),
    )
    .when(F.col("fwd_60d_skew") < -0.3, F.lit(0.35))
    .otherwise(F.lit(0.20)),
)

# Apply simulation crowd feedback: blend 80% base + 20% crowd sentiment
if sim_adjustment is not None:
    sim_renamed = sim_adjustment.select(
        F.col("ticker").alias("sim_ticker"),
        F.col("avg_buy_crowd"),
        F.col("avg_call_crowd"),
        F.col("avg_put_crowd"),
        F.col("avg_short_crowd"),
    )
    target_df = target_df.join(
        sim_renamed, target_df["ticker"] == sim_renamed["sim_ticker"], "left"
    ).drop("sim_ticker")

    # Compute crowd-based bias (normalize crowd counts to proportions)
    total_crowd = (
        F.coalesce(F.col("avg_buy_crowd"), F.lit(1))
        + F.coalesce(F.col("avg_call_crowd"), F.lit(1))
        + F.coalesce(F.col("avg_put_crowd"), F.lit(1))
        + F.coalesce(F.col("avg_short_crowd"), F.lit(1))
    )

    # Blend: 80% base bias + 20% crowd sentiment
    BLEND = 0.2
    for col_name, crowd_col in [
        ("buy_pct", "avg_buy_crowd"),
        ("call_pct", "avg_call_crowd"),
        ("put_pct", "avg_put_crowd"),
        ("short_pct", "avg_short_crowd"),
    ]:
        target_df = target_df.withColumn(
            col_name,
            F.when(
                F.col(crowd_col).isNotNull(),
                F.col(col_name) * (1 - BLEND)
                + (F.coalesce(F.col(crowd_col), F.lit(1)) / total_crowd) * BLEND,
            ).otherwise(F.col(col_name)),
        )

    # Drop temporary columns
    target_df = target_df.drop(
        "avg_buy_crowd", "avg_call_crowd", "avg_put_crowd", "avg_short_crowd"
    )

# COMMAND ----------

# MAGIC %md
# MAGIC ## 5. Store Dimensions & Agent Density

# COMMAND ----------

# Market cap percentile (volume proxy)
avg_vol_df = target_df.groupBy("ticker").agg(F.avg("Volume").alias("avg_volume"))
w_vol_rank_global = Window.orderBy(F.col("avg_volume").asc())
avg_vol_df = avg_vol_df.withColumn(
    "market_cap_percentile", F.percent_rank().over(w_vol_rank_global)
)

target_df = target_df.join(
    avg_vol_df.select("ticker", "market_cap_percentile"), on="ticker", how="left"
)

# Store dimensions
target_df = (
    target_df.withColumn(
        "store_width", F.lit(1.0) + F.col("market_cap_percentile") * F.lit(2.0)
    )
    .withColumn(
        "store_height", F.lit(1.5) + F.col("market_cap_percentile") * F.lit(2.5)
    )
    .withColumn(
        "store_depth", F.lit(1.0) + F.col("market_cap_percentile") * F.lit(1.0)
    )
    .withColumn("store_glow", F.col("golden_score").cast(DoubleType()) / F.lit(5.0))
)

# Platinum scale
target_df = (
    target_df.withColumn(
        "store_width",
        F.when(F.col("is_platinum"), F.col("store_width") * 2.5).otherwise(
            F.col("store_width")
        ),
    )
    .withColumn(
        "store_height",
        F.when(F.col("is_platinum"), F.col("store_height") * 2.5).otherwise(
            F.col("store_height")
        ),
    )
    .withColumn(
        "store_depth",
        F.when(F.col("is_platinum"), F.col("store_depth") * 2.5).otherwise(
            F.col("store_depth")
        ),
    )
)

# Agent density
target_df = target_df.withColumn(
    "agent_density",
    F.lit(200) + F.floor(F.pow(F.col("golden_score").cast(DoubleType()), 2.5) * F.lit(800)),
).withColumn(
    "agent_density",
    F.when(F.col("is_platinum"), (F.col("agent_density") * 3).cast("long")).otherwise(
        F.col("agent_density")
    ),
).withColumn(
    "speed_multiplier",
    F.lit(1.0) + F.col("golden_score").cast(DoubleType()) * F.lit(1.5),
)

# COMMAND ----------

# MAGIC %md
# MAGIC ## 6. Select Columns & Append to Gold Table

# COMMAND ----------

gold_cols = [
    "ticker", "Date", "sector",
    "Close", "Volume", "daily_return",
    "drawdown_pct", "drawdown_percentile",
    "realized_vol_20d", "vol_percentile", "volume_percentile",
    "rsi_14", "macd_histogram", "bb_pct_b", "zscore_20d",
    "relative_return_vs_spy", "relative_return_percentile",
    "fwd_return_5d", "fwd_return_20d", "fwd_return_60d",
    "fwd_60d_skew", "fwd_60d_p5", "fwd_60d_p25", "fwd_60d_median", "fwd_60d_p75", "fwd_60d_p95",
    "mean_reversion_score",
    "vol_regime",
    "ticket_1_dip", "ticket_2_shock", "ticket_3_asymmetry",
    "ticket_4_dislocation", "ticket_5_convexity",
    "golden_score", "rarity_percentile", "is_platinum",
    "buy_pct", "call_pct", "put_pct", "short_pct",
    "market_cap_percentile",
    "store_width", "store_height", "store_depth", "store_glow",
    "agent_density", "speed_multiplier",
]

# Only select columns that exist (some may be missing if data is sparse)
available_cols = set(target_df.columns)
select_cols = [c for c in gold_cols if c in available_cols]
gold_new = target_df.select(*select_cols)

row_count = gold_new.count()
print(f"Appending {row_count} rows for {target_date}")

# COMMAND ----------

# Append (not overwrite!) to golden_tickets
# mergeSchema handles column differences between old (full pipeline) and new (incremental) runs
(
    gold_new.write.format("delta")
    .mode("append")
    .option("mergeSchema", "true")
    .saveAsTable("sweetreturns.gold.golden_tickets")
)

print(f"✓ Appended {row_count} rows for {target_date} to sweetreturns.gold.golden_tickets")

# COMMAND ----------

# Verify
latest = spark.sql(
    "SELECT MAX(Date) as latest, COUNT(*) as total FROM sweetreturns.gold.golden_tickets"
).collect()[0]
print(f"Golden tickets now: {latest['total']} rows, latest date: {latest['latest']}")
