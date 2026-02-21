# SweetReturns: Databricks Pipeline Tutorial

Complete guide to importing the Kaggle dataset and running the full medallion pipeline (Bronze -> Silver -> Gold -> Export) on Databricks.

---

## Table of Contents

1. [What is Databricks?](#1-what-is-databricks)
2. [Create a Free Databricks Account](#2-create-a-free-databricks-account)
3. [Create a Compute Cluster](#3-create-a-compute-cluster)
4. [Upload the Dataset to DBFS](#4-upload-the-dataset-to-dbfs)
5. [Create the Database Schema](#5-create-the-database-schema)
6. [Run the Pipeline: Bronze Ingestion](#6-run-the-pipeline-bronze-ingestion)
7. [Run the Pipeline: Silver Features](#7-run-the-pipeline-silver-features)
8. [Run the Pipeline: Gold Tickets](#8-run-the-pipeline-gold-tickets)
9. [Run the Pipeline: Export JSON](#9-run-the-pipeline-export-json)
10. [Download the Output](#10-download-the-output)
11. [Key Concepts Explained](#11-key-concepts-explained)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. What is Databricks?

Databricks is a cloud platform for big data processing built on top of **Apache Spark**. Here's why we use it:

| Concept | What it means for you |
|---|---|
| **Apache Spark** | Distributed computing engine. Instead of processing 600K rows on your laptop, Spark splits the work across multiple machines. Your scripts use `pyspark` — the Python API for Spark. |
| **Delta Lake** | An enhanced file format on top of Parquet. Adds transactions, schema enforcement, and time travel. When your scripts write `.saveAsTable("sweetreturns.bronze.raw_stock_data")`, they're writing Delta tables. |
| **DBFS** | Databricks File System — a virtual filesystem. When you upload the CSV, it goes to `dbfs:/FileStore/...`. Think of it like an S3 bucket built into Databricks. |
| **Notebooks** | Interactive code cells (like Jupyter) that run on a Spark cluster. Your `.py` files use `# COMMAND ----------` separators — Databricks treats each section as a cell. |
| **Medallion Architecture** | The Bronze -> Silver -> Gold pattern. Raw data (Bronze) gets progressively refined into features (Silver) then business logic (Gold). |

**Your pipeline:**
```
Kaggle CSV (602K rows, 491 tickers, 5 years)
    |
    v
[Bronze] Raw data + sector mapping -> Delta table
    |
    v
[Silver] 50+ technical indicators (RSI, MACD, Bollinger, etc.) -> Delta table
    |
    v
[Gold] 5 Golden Tickets + Platinum detection + store dimensions -> Delta table
    |
    v
[Export] frontend_payload.json (city positions, correlations, agent counts)
    |
    v
React frontend consumes the JSON
```

---

## 2. Create Your Databricks Account (14-Day Trial)

> **You are on the 14-day free trial.** This gives you a full multi-node cluster, Unity Catalog, and the complete Databricks platform — significantly more powerful than Community Edition.

### Already Signed Up?

Log in at your trial workspace URL (format: `https://<workspace-id>.azuredatabricks.net` or `https://<workspace-id>.cloud.databricks.com` depending on your cloud provider). Your workspace URL was emailed to you when you registered.

### Trial Limits to Be Aware Of

| Limit | Detail |
|---|---|
| **Duration** | 14 days from signup — **complete the pipeline before it expires** |
| **DBUs** | Limited compute credits — don't leave clusters running idle |
| **Auto-termination** | Always set clusters to auto-terminate (15-30 min) to conserve DBUs |
| **Storage** | DBFS and Delta tables persist for the trial duration |

> **Tip: Check your trial expiry date in Account Settings > Subscription.** You have ~14 days to run the full pipeline and download your JSON output.

---

## 3. Create a Compute Cluster

A cluster is the actual machine(s) that run your code. You need one before running anything.

> **Trial workspaces default to the SQL / Data Warehouse persona.** In this mode, clicking "Compute" in the sidebar opens SQL Warehouses (serverless SQL endpoints), NOT Spark clusters. You must switch personas first.

### Step 0: Switch to the Data Science & Engineering Persona

The sidebar has a **persona switcher** — look for an icon at the very top-left of the left sidebar (it may show a house icon, a grid, or your workspace name with a small dropdown arrow).

1. Click the persona switcher / top-left workspace menu
2. Select **"Data Science & Engineering"** (sometimes labeled **"Data Engineering"** or **"Machine Learning"**)
3. The sidebar will reload. You should now see **Workflows**, **Compute**, **Workspace**, etc.

**If you don't see a persona switcher**, navigate directly to clusters via URL:
```
https://<your-workspace-url>/#setting/clusters
```
Replace `<your-workspace-url>` with your actual workspace domain (e.g., `https://adb-123456789.12.azuredatabricks.net`).

Once you're in the right persona, Compute will show **"All-purpose clusters"** — that's what you want (not SQL Warehouses).

### Steps:

1. In the left sidebar (Data Science & Engineering persona), click **"Compute"**
2. Click **"Create Cluster"** (or **"Create compute"**)
3. Configure:
   - **Cluster Name:** `sweetreturns`
   - **Cluster Mode:** **Single Node** (simplest for this pipeline — avoids shuffle overhead on a 63MB dataset)
   - **Databricks Runtime:** Pick the latest **LTS** (Long Term Support) version, e.g., `14.3 LTS` or `15.x LTS`
     - Make sure it says **(includes Apache Spark X.X, Scala X.XX)**
     - Do NOT pick "ML" or "GPU" runtimes — you don't need them
   - **Node Type:** `Standard_DS3_v2` (Azure) or `i3.xlarge` (AWS) — any general-purpose instance with 14-28GB RAM works
   - **Auto-termination:** **15-30 minutes** of inactivity — critical on the trial to conserve DBU credits
4. Click **"Create Cluster"**
5. Wait 3-5 minutes for it to start (status turns green with a checkmark)

> **Important:** Your cluster auto-terminates to save trial DBUs. If it stops mid-pipeline, go to Compute > click your cluster > **Start**, then re-run the last notebook.

---

## 4. Upload the Dataset to DBFS

Your CSV was downloaded to:
```
C:\Users\16786\.cache\kagglehub\datasets\iveeaten3223times\massive-yahoo-finance-dataset\versions\2\stock_details_5_years.csv
```

You need to get it into Databricks at this exact path:
```
dbfs:/FileStore/sweetreturns/stock_details_5_years.csv
```

### Method 1: Databricks UI Upload (Easiest)

1. In the left sidebar, click **"Data"**
2. Click **"Create Table"** (or **"Add Data"** in newer UI)
3. Click **"Upload File"**
4. Drag and drop `stock_details_5_years.csv` from your local machine
5. **IMPORTANT:** By default, Databricks uploads to `dbfs:/FileStore/tables/`. You need to note the path it gives you.
6. After upload, it will show you the file location — something like:
   ```
   dbfs:/FileStore/tables/stock_details_5_years.csv
   ```

**Then move it to the expected path.** In a notebook cell, run:
```python
dbutils.fs.mkdirs("/FileStore/sweetreturns/")
dbutils.fs.cp(
    "dbfs:/FileStore/tables/stock_details_5_years.csv",
    "dbfs:/FileStore/sweetreturns/stock_details_5_years.csv"
)
print("Done! File is at dbfs:/FileStore/sweetreturns/stock_details_5_years.csv")
```

### Method 2: Databricks CLI (If You Want CLI Power)

Install the CLI locally:
```bash
pip install databricks-cli
```

Configure it:
```bash
databricks configure --token
# Enter your trial workspace URL (e.g., https://<id>.azuredatabricks.net)
# Enter your access token (generate one from User Settings > Developer > Access Tokens)
```

Upload:
```bash
databricks fs mkdirs dbfs:/FileStore/sweetreturns/
databricks fs cp "C:\Users\16786\.cache\kagglehub\datasets\iveeaten3223times\massive-yahoo-finance-dataset\versions\2\stock_details_5_years.csv" dbfs:/FileStore/sweetreturns/stock_details_5_years.csv
```

### Verify the Upload

In any notebook cell, run:
```python
display(dbutils.fs.ls("/FileStore/sweetreturns/"))
```

You should see:
```
path                                                    name                        size
dbfs:/FileStore/sweetreturns/stock_details_5_years.csv  stock_details_5_years.csv   ~63MB
```

---

## 5. Create the Database Schema

Before running the pipeline, you need to create the database and schemas. In a new notebook cell:

```python
spark.sql("CREATE DATABASE IF NOT EXISTS sweetreturns")
spark.sql("CREATE SCHEMA IF NOT EXISTS sweetreturns.bronze")
spark.sql("CREATE SCHEMA IF NOT EXISTS sweetreturns.silver")
spark.sql("CREATE SCHEMA IF NOT EXISTS sweetreturns.gold")
print("Database and schemas created!")
```

> **Note on Unity Catalog:** Your 14-day trial workspace **uses Unity Catalog by default**. If the schema creation above fails, you need to specify the catalog first:
> ```python
> spark.sql("USE CATALOG main")  # 'main' is the default catalog on trial workspaces
> spark.sql("CREATE DATABASE IF NOT EXISTS main.sweetreturns")
> spark.sql("CREATE SCHEMA IF NOT EXISTS main.sweetreturns.bronze")
> spark.sql("CREATE SCHEMA IF NOT EXISTS main.sweetreturns.silver")
> spark.sql("CREATE SCHEMA IF NOT EXISTS main.sweetreturns.gold")
> print("Done!")
> ```
> Check your catalog name in the left sidebar under **"Catalog"** — it's usually `main` or your org name.

---

## 6. Run the Pipeline: Bronze Ingestion

**What this step does:** Loads the raw CSV, renames columns, maps each of the 491 tickers to one of 11 GICS sectors, and writes to a Delta table.

### Import the Notebook

1. In the left sidebar, click **"Workspace"**
2. Navigate to your user folder (click your email/username)
3. Right-click > **"Import"**
4. Select **"File"** and upload `databricks/bronze_ingestion.py` from your project
5. Databricks will parse the `# COMMAND ----------` separators and create cells automatically

### Attach the Cluster

At the top of the notebook, you'll see a dropdown that says "Detached." Click it and select your `sweetreturns` cluster.

### Run It

- Click **"Run All"** at the top (or use `Ctrl+Shift+Enter`)
- Or run cells one at a time with `Shift+Enter`

### What to Expect

Cell 1 (Load CSV):
```
Rows: 602962, Tickers: 491
```

Cell 2 (Sector mapping): Maps tickers to sectors like:
- AAPL, MSFT, NVDA -> Technology
- UNH, JNJ, LLY -> Healthcare
- JPM, V, MA -> Financials
- etc.

Cell 3 (Write Delta): Writes `sweetreturns.bronze.raw_stock_data`

Cell 4 (Quality checks):
```
+----------+---------------+----------+----------+-----------+-----------------+
|total_rows|unique_tickers |start_date|end_date  |null_closes|unmapped_sectors |
+----------+---------------+----------+----------+-----------+-----------------+
|602962    |491            |2018-11-29|2023-11-29|0          |~some number     |
+----------+---------------+----------+----------+-----------+-----------------+
```

> **Note:** `unmapped_sectors` may be > 0 if some tickers in the CSV aren't in the SECTOR_MAP. That's fine — they get `null` sector and still flow through the pipeline.

**Time estimate:** ~30-60 seconds on a trial cluster (multi-core node is significantly faster than Community Edition's single-node 15GB).

---

## 7. Run the Pipeline: Silver Features

**What this step does:** Reads Bronze, computes 50+ technical indicators using PySpark Window functions, writes to Silver Delta table.

### Import & Run

Same process: Import `databricks/silver_features.py`, attach cluster, Run All.

### What Gets Computed

| Feature | Description | Window |
|---|---|---|
| `daily_return`, `log_return` | Basic returns | Lag-1 |
| `drawdown_pct` | Distance from all-time high | Expanding |
| `drawdown_percentile` | Rank of drawdown vs own history | Full history |
| `realized_vol_20d/60d` | Annualized rolling volatility | 20d/60d |
| `vol_percentile` | Rank of current vol vs history | Full history |
| `volume_percentile` | Rank of current volume vs history | Full history |
| `rsi_14` | Relative Strength Index | 14d |
| `macd_line/signal/histogram` | MACD (SMA approximation) | 12d/26d/9d |
| `bb_upper/lower/pct_b` | Bollinger Bands | 20d, 2 std |
| `atr_14` | Average True Range | 14d |
| `roc_5/20/60` | Rate of Change | 5d/20d/60d |
| `zscore_20d/60d` | Z-Score of price | 20d/60d |
| `relative_return_vs_spy` | Daily excess return vs S&P 500 | Daily |
| `relative_return_percentile` | Rank of underperformance vs SPY | Full history |
| `fwd_return_5d/20d/60d` | Forward-looking returns | 5d/20d/60d |
| `fwd_60d_skew` | Skewness of next 60 daily returns | Fwd 60d |
| `fwd_60d_p5/p25/median/p75/p95` | Distribution percentiles | Fwd 60d |
| `mean_reversion_score` | Lag-1 autocorrelation | 60d |
| `vol_regime` | "favorable" or "elevated" | SPY vol vs 80th pctl |
| `median_drawdown` | Typical drawdown per ticker | Full history |

### Important: Install scipy

The `fwd_60d_skew` computation uses a UDF that requires `scipy`. If you get an import error, run this in a cell **before** the silver notebook:

```python
%pip install scipy numpy
```

Then **restart the Python kernel** (Databricks will prompt you).

### What to Expect

Quality validation output:
```
+----------+---------------+----------+----------+------------------+
|total_rows|unique_tickers |start_date|end_date  |null_daily_return |
+----------+---------------+----------+----------+------------------+
|602962    |491            |2018-11-29|2023-11-29|491 (first row/ticker)|
+----------+---------------+----------+----------+------------------+
```

The AAPL spot-check should show reasonable values (RSI ~30-70, vol 15-40%, etc.).

**Time estimate:** ~3-8 minutes on the trial cluster. The scipy UDFs for `fwd_60d_skew` are the bottleneck — they run Python row-by-row and can't be parallelized further.

---

## 8. Run the Pipeline: Gold Tickets

**What this step does:** Evaluates each stock on each date against 5 Golden Ticket criteria, computes scores, detects Platinum stores, and calculates store dimensions + agent density.

### Import & Run

Import `databricks/gold_tickets.py`, attach cluster, Run All.

### The 5 Golden Tickets

| Ticket | Name | Key Criteria |
|---|---|---|
| **I** | Sour Candy Drop (Dip) | `drawdown_percentile > 0.80` |
| **II** | Jawbreaker (Shock) | Deep drawdown + extreme volume + high volatility |
| **III** | Fortune Cookie (Asymmetry) | Deep drawdown + positive skew + limited downside |
| **IV** | Taffy Pull (Dislocation) | Deep drawdown + extreme SPY underperformance + mean reversion signal |
| **V** | Golden Gummy Bear (Convexity) | Very deep drawdown + extreme volume + underperformance + strong positive skew + favorable regime |

### Platinum Detection (The Wonka Bar)
A stock must have:
- `golden_score >= 4` (holds 4+ tickets)
- `rarity_percentile > 0.98` (top 2% across all stocks that day)
- `fwd_60d_skew > 1.0` (extreme positive asymmetry)
- `relative_return_percentile < 0.05` (extreme underperformance)
- `vol_regime == "favorable"` (calm market)

### What to Expect

Golden score distribution:
```
+------------+---------+------------+------------+
|golden_score|row_count|ticker_count|pct_of_total|
+------------+---------+------------+------------+
|           0|  ~500K+ |        491 |      ~85%  |
|           1|   ~70K  |        ~400|      ~12%  |
|           2|   ~15K  |        ~200|       ~2%  |
|           3|    ~3K  |         ~80|      ~0.5% |
|           4|    ~500 |         ~30|      ~0.1% |
|           5|     ~50 |         ~10|      ~0.01%|
+------------+---------+------------+------------+
```

Platinum stores should be very rare (< 100 total across 5 years).

**Time estimate:** ~1-3 minutes on the trial cluster.

---

## 9. Run the Pipeline: Export JSON

**What this step does:** Takes the latest date snapshot, assigns city grid positions, computes stock-to-stock correlations, builds the complete JSON payload for the React frontend.

### Import & Run

Import `databricks/export_json.py`, attach cluster, Run All.

### Install pandas/numpy if needed

```python
%pip install pandas numpy
```

### What Gets Generated

**`frontend_payload.json`** — the master file your React app consumes:
```json
{
  "generated_at": "2024-01-15T12:00:00Z",
  "snapshot_date": "2023-11-29",
  "regime": "favorable",
  "stock_count": 491,
  "total_agents": 150000,
  "platinum_count": 0,
  "stocks": [
    {
      "ticker": "AAPL",
      "sector": "Technology",
      "close": 189.95,
      "golden_score": 0,
      "is_platinum": false,
      "city_position": { "x": 0.0, "y": 0.0, "z": 0.0 },
      "direction_bias": { "buy": 0.30, "call": 0.25, "put": 0.25, "short": 0.20 },
      "store_dimensions": { "width": 2.8, "height": 3.7, "depth": 1.9, "glow": 0.0 },
      "agent_density": 200,
      "technicals": { "rsi_14": 55.2, "macd_histogram": 0.45, ... }
    }
    // ... 490 more stocks
  ],
  "correlation_edges": [
    { "source": "AAPL", "target": "MSFT", "weight": 0.82 }
    // ... up to 2000 edges
  ],
  "sectors": [
    {
      "name": "Technology",
      "candy_district": "Pixel Candy Arcade",
      "grid_position": { "col": 0, "row": 0 },
      "stock_count": 44,
      "avg_golden_score": 0.15,
      "platinum_count": 0,
      "total_agents": 9800
    }
    // ... 10 more sectors
  ]
}
```

**`correlation_graph.json`** — separate file for the Graph Playground page.

### What to Expect

```
Payload assembled:
  Stocks: ~450-491
  Correlation edges: ~1000-2000
  Sectors: 11
  Total agents: ~100,000-200,000
  Platinum stores: 0-5
```

**Time estimate:** ~3-7 minutes on the trial cluster (correlation matrix pivot across 491 tickers is the bottleneck).

---

## 10. Download the Output

You need to get `frontend_payload.json` from Databricks to your local project's `public/` folder.

### Method 1: Direct Download URL (Easiest)

After running export, the files are at:
```
https://<your-trial-workspace-url>/files/sweetreturns/frontend_payload.json
https://<your-trial-workspace-url>/files/sweetreturns/correlation_graph.json
```

Your trial workspace URL was in the signup confirmation email (format: `https://<id>.azuredatabricks.net` or `https://<id>.cloud.databricks.com`).

Just open these URLs in your browser while logged in and save the files.

### Method 2: Download from Notebook

Add this cell at the end of the export notebook:
```python
# Display download link
displayHTML("""
<h3>Download Links:</h3>
<ul>
  <li><a href="/files/sweetreturns/frontend_payload.json" download>frontend_payload.json</a></li>
  <li><a href="/files/sweetreturns/frontend_payload.min.json" download>frontend_payload.min.json</a></li>
  <li><a href="/files/sweetreturns/correlation_graph.json" download>correlation_graph.json</a></li>
</ul>
""")
```

### Method 3: Databricks CLI

```bash
databricks fs cp dbfs:/FileStore/sweetreturns/frontend_payload.json ./public/frontend_payload.json
databricks fs cp dbfs:/FileStore/sweetreturns/correlation_graph.json ./public/correlation_graph.json
```

### Place the Files

Copy the downloaded files to your project:
```
wow-sweet/
  public/
    frontend_payload.json       <-- main payload
    correlation_graph.json      <-- for Graph Playground
```

Then your React frontend can fetch them at `/frontend_payload.json`.

---

## 11. Key Concepts Explained

### Spark vs. Pandas

| | Pandas | PySpark |
|---|---|---|
| Data size | Fits in RAM (< ~5GB) | Distributed, no limit |
| Syntax | `df["col"].rolling(20).mean()` | `F.avg("col").over(Window(...).rowsBetween(-19, 0))` |
| Execution | Immediate | Lazy (builds plan, executes on action like `.count()` or `.write`) |
| When to use | EDA, small data, prototyping | Production pipelines, large data |

Your scripts use PySpark because they're designed for Databricks, but our 63MB dataset could also run in pandas. The Spark approach means the same code scales to billions of rows if needed.

### Window Functions

Most of your pipeline uses **Window functions** — the core Spark tool for rolling calculations:

```python
# "For each ticker, ordered by date, look at the last 20 rows"
w_20d = Window.partitionBy("ticker").orderBy("Date").rowsBetween(-19, 0)

# Compute 20-day rolling average
df = df.withColumn("sma_20", F.avg("Close").over(w_20d))
```

Key patterns:
- `partitionBy("ticker")` = "reset for each stock"
- `orderBy("Date")` = "sort chronologically"
- `rowsBetween(-19, 0)` = "current row + 19 before it = 20 total"
- `rowsBetween(1, 60)` = "next 60 rows" (forward-looking)

### Delta Lake Tables

```python
df.write.format("delta").mode("overwrite").saveAsTable("sweetreturns.bronze.raw_stock_data")
```

This creates a managed Delta table. Think of it as a database table you can query with SQL:
```sql
SELECT * FROM sweetreturns.bronze.raw_stock_data WHERE ticker = 'AAPL' LIMIT 10
```

### UDFs (User-Defined Functions)

When Spark's built-in functions aren't enough (like computing skewness), you write a UDF:

```python
@F.udf(DoubleType())
def calc_skew(returns):
    return float(scipy_stats.skew(np.array(returns)))
```

UDFs are slower than native Spark functions because data gets serialized to Python. That's why the Silver step takes the longest.

### The `# MAGIC %md` Lines

These are Databricks-specific markdown cell markers. When you import a `.py` file:
- `# MAGIC %md` = renders as a formatted text cell
- `# COMMAND ----------` = cell separator

Your code runs exactly the same with or without these markers.

---

## 12. Troubleshooting

### "Compute" opens SQL Warehouses instead of Spark clusters
Your workspace is in the **SQL persona** (default for trial accounts). Switch to the **Data Science & Engineering** persona using the top-left persona switcher in the sidebar. Once switched, Compute will show all-purpose Spark clusters. Alternatively, go directly to `https://<your-workspace-url>/#setting/clusters` in your browser.

### "Table or view not found: sweetreturns.bronze.raw_stock_data"
You skipped Step 5 (creating the database schema) or ran Silver before Bronze finished. Run the schema creation SQL first, then Bronze, then Silver.

### "FileNotFoundException: dbfs:/FileStore/sweetreturns/stock_details_5_years.csv"
The CSV isn't uploaded to the right path. Run:
```python
dbutils.fs.ls("/FileStore/sweetreturns/")
```
to see what's there. Re-upload if needed.

### "ModuleNotFoundError: No module named 'scipy'"
Run `%pip install scipy numpy` in a cell before running Silver, then restart the Python interpreter when prompted.

### Cluster terminated / timed out
Go to Compute > click your cluster > Start. Wait for the green checkmark, then re-run.

### "AnalysisException: Cannot resolve column name"
You're running a notebook that depends on a table that hasn't been created yet. Run the pipeline in order: Bronze -> Silver -> Gold -> Export.

### Date column parsing issues
The raw CSV has timezone-aware dates like `2018-11-29 00:00:00-05:00`. The Bronze script's schema defines `DateType()` which may truncate the timezone. This is fine — we only need the date part.

### "java.lang.OutOfMemoryError"
Unlikely on the trial cluster, but if it happens:
1. Restart your cluster (clears cached data)
2. Add `.repartition(10)` before heavy operations
3. Run one notebook at a time, don't keep multiple notebooks attached
4. Consider upgrading the node type to one with more RAM (e.g., `Standard_DS4_v2` on Azure)

### Correlation step is very slow
The export notebook pivots all daily returns into a wide matrix and computes pairwise correlations. This takes 3-7 minutes even on the trial cluster — it's a 491×491 matrix computation. This is normal. The result is cached in the JSON, so it only runs once.

### Trial expired mid-pipeline
If your 14-day trial expires before you finish: download any already-exported JSON files immediately. For re-running, sign up for a new trial with a different email, or consider Databricks Community Edition (free forever, slower) at https://community.cloud.databricks.com.

---

## Quick Reference: Full Pipeline Commands

Run these in order, one notebook at a time:

```
1. Create schemas:
   CREATE DATABASE IF NOT EXISTS sweetreturns;
   CREATE SCHEMA IF NOT EXISTS sweetreturns.bronze;
   CREATE SCHEMA IF NOT EXISTS sweetreturns.silver;
   CREATE SCHEMA IF NOT EXISTS sweetreturns.gold;

2. Bronze: Import & run databricks/bronze_ingestion.py
   Output: sweetreturns.bronze.raw_stock_data (602K rows)

3. Silver: Import & run databricks/silver_features.py
   Output: sweetreturns.silver.daily_features (602K rows, 50+ columns)

4. Gold:   Import & run databricks/gold_tickets.py
   Output: sweetreturns.gold.golden_tickets (602K rows, tickets + scores)

5. Export: Import & run databricks/export_json.py
   Output: dbfs:/FileStore/sweetreturns/frontend_payload.json
           dbfs:/FileStore/sweetreturns/correlation_graph.json

6. Download JSONs to wow-sweet/public/
```

After this, run `npm run dev` locally and your React frontend will consume the payload.
