# SweetReturns — Golden City

### A Candy-Themed AI Agent Stock Market Simulation with Autonomous Trading Intelligence

### **Hacklytics 2026** — 36-Hour Hackathon Build

> **TL;DR:** 500 publicly traded companies rendered as candy-themed storefronts in a zoomable 3D isometric city. Each building's color matches its **ticker symbol color as candy**. **500,000 autonomous AI agents** (powered by **Gemini API**, newest model) — men in **suits**, women in **business attire** — whose sole goal is to read live market data & news, then **race to the candy stores/tickers** that will generate the most profit. Agents **physically collide, bump, shove, grab and throw** each other out of the way (full physics via **WebGPU compute shaders**). When you click inside a store, it splits into **4 sections: BUY, SHORT, CALL, PUT** showing where agents are flowing. Agents **receive candy when leaving a store** (profit visualization). **Platinum stores** trigger visual chaos — agents stampede, fight at doorways, and pile up trying to get in. Stocks are interconnected via **candy canes interlocking each other**, colored to match each stock's ticker color. **Sector filtering** lets you isolate any sector. **Time slider** scrubs 5 years of history + future predictions. Agents compete to see **who can make the most profit**. **Separate pages:** (1) **Stock Network Page** — how the model (Databricks/Colab/Kaggle) computes stock correlations and the candy cane network reacts, (2) **Agent Reactions Page** — how 500K agents react to model signals in real-time, with leaderboard, heatmaps, and decision breakdowns. Integrated with **Alpaca** (live), **Webull API** (in progress). Powered by **Gemini API** for all agents, **Claude Max**, **4 Copilot accounts**, **$300/student Google credits**. **Replit Animation** for demo video + web app demo recording + IRL footage. Built with React + Three.js + **WebGPU** + Geist UI + D3.js, powered by Databricks + Google Colab on 5 years of Kaggle daily stock data.

---

## Prototype Reference

> The Golden City looks like a vibrant candy metropolis: **candy-colored buildings** on a structured grid, each labeled with a company name (NVDA, Apple, Tesla, Pfizer, Starbucks, J.P. Morgan, etc.) with building colors matching the **ticker symbol's brand color rendered as candy**. Each building is distinctly candy-like — rounded edges, frosting details, sprinkle textures, gummy surfaces. **AI agents in business attire** (men in suits, women in professional wear) race between stores — they are autonomous intelligence units reading real-time market data and news via **Gemini API** to decide which candy store will yield the most profit. Agents **physically interact** — bumping, shoving, grabbing and throwing rivals who block their path. They **crowd at doorways** fighting to enter high-opportunity stores. **Candy canes interlock** between buildings showing stock correlations, colored to match each ticker. When agents exit a store, they carry **candy representing their profit**. **Platinum stores** trigger absolute chaos — stampedes, door-jamming, agents climbing over each other. The city is alive, competitive, and visceral.

---

## Table of Contents

1. [Open Questions — MUST ANSWER BEFORE BUILD](#open-questions)
2. [Architecture Overview](#architecture)
3. [Candy-lism System — Brand-Colored Candy Buildings](#cndy-branding)
4. [Data Pipeline](#data-pipeline)
5. [Golden Ticket Mathematics](#golden-ticket-math)
6. [3D Scene Graph & Visual System](#scene-graph)
7. [AI Agent Intelligence System — Gemini-Powered Autonomous Traders](#ai-agents)
8. [Crowd Simulation Physics — Bumping, Grabbing, Throwing](#crowd-physics)
9. [Time Slider System — Historical & Future Crowd Traffic](#time-slider)
10. [Future Prediction Engine — Quarterly Reports & Dividends](#future-prediction)
11. [Navigation & Camera System](#navigation)
12. [Store Interior System — BUY/SHORT/CALL/PUT Sections](#store-interiors)
13. [Sector Filtering System](#sector-filtering)
14. [Candy Cane Correlation Network — Interlocking Stock Connections](#candy-cane-network)
15. [Geist UI Stock Graph System](#geist-graph)
16. [Graph Playground Page](#graph-playground)
17. [API Schema](#api-schema)
18. [Performance Optimization](#performance)
19. [Candy Theming Spec](#candy-theming)
20. [Integration & Resources — Alpaca, Webull, Gemini, Claude, Copilot](#integrations)
21. [Demo Pipeline — Replit Animation + Web App + IRL Video](#demo-pipeline)
22. [Deployment Plan](#deployment)
23. [Hacklytics 2026 — 36-Hour MVP Roadmap](#mvp-roadmap)
24. [Future Scaling](#future-scaling)
25. [Stock Network Page — How Model Reacts (Databricks/Colab/Kaggle)](#stock-network-page)
26. [Agent Reactions Page — How 500K Agents React to Model Signals](#agent-reactions-page)

---

<a name="open-questions"></a>

## 1. Open Questions — MUST ANSWER BEFORE BUILD

### 1.1 Data Source & Scope

1. **Which exact Kaggle dataset?** There are multiple "top 500 stocks" datasets. Need the exact URL/name so schema is locked.
2. **Is the dataset already downloaded, or do we fetch it live at build time?** If downloaded, where is the CSV/parquet located?
3. **Date range confirmation:** The spec says "5 years of daily data." What is the exact start/end date range in the dataset?
4. **Stock Splits & Dividends columns:** Are these populated for all 500 tickers, or sparse? Do we need adjusted close calculations ourselves, or is the Close column already split-adjusted?
5. **Ticker-to-sector mapping:** Does the Kaggle dataset include sector/industry classification, or do we need a separate mapping file (e.g., from Wikipedia S&P 500 list, or a GICS lookup)?
6. **Market cap data:** The spec says "store sized by market cap." Is market cap in the dataset, or do we need an external source (Alpha Vantage, Yahoo Finance, etc.)?
7. **SPY benchmark data:** For Ticket IV (Relative Dislocation), we need SPY daily returns. Is this in the Kaggle dataset, or do we pull from Alpha Vantage? Do we need an API key? What's the rate limit?
8. **VIX / Volatility regime data:** Ticket V requires "favorable volatility regime." Do we use VIX? A custom regime classifier? Where does this data come from?
9. **Forward return windows:** The spec references "forward 60-day" returns for skew. Are we computing forward returns from historical data (backtesting), or is this meant to be a live signal? If backtesting, the most recent ~60 trading days won't have forward data — how do we handle the edge?
10. **How frequently does the data update?** Is this a static snapshot (compute once, serve forever), or do we need a refresh pipeline?

### 1.2 Golden Ticket Computation

1. **Drawdown definition:** Is drawdown measured as peak-to-trough from rolling ATH? Or from a specific lookback window (e.g., 52-week high)?
2. **Percentile base:** When we say "80th percentile drawdown relative to stock's own 5-year history," is that the percentile of *all daily drawdowns* for that stock, or *all drawdown events* (peak-to-trough episodes)?
3. **Volume percentile:** 90th percentile of what? Daily volume vs. its own 5-year history? Or vs. all 500 stocks on that day?
4. **Volatility percentile:** Measured how? Rolling 20-day realized vol? 60-day? Annualized? Percentile vs. own history or cross-sectional?
5. **Forward 60-day skew calculation:** Scipy `skew()` on the distribution of daily returns over the next 60 trading days from each observation point? Or skew of the cumulative return distribution?
6. **"95th percentile forward return significantly exceeds median"** — What threshold defines "significantly"? 2x? 3x? A fixed basis point spread?
7. **"5th percentile downside limited"** — Limited relative to what? Less than the median drawdown? Less than -X%?
8. **Ticket IV — "Historical mean reversion behavior":** How is this quantified? Half-life of mean reversion? Hurst exponent? Autocorrelation of returns at lag N?
9. **Ticket V — "Occurs in favorable volatility regime":** Is this VIX < some threshold? A regime-switching model (HMM)? Manually defined buckets (low/mid/high)?
10. **Platinum Ticket — "Top 1-2% rarity across all 500 stocks":** Is this the top 1-2% of all (stock, date) pairs across the full dataset? Or the top 1-2% of stocks *on a given date*?
11. **Golden Score:** How do the five tickets combine into a single "Golden Score"? Additive (0-5)? Weighted? Is it the count of tickets held, or a continuous composite score?
12. **Temporal aggregation:** Each (stock, date) pair gets a ticket assessment. For the 3D city, do we show the *most recent date's* tickets? Or the *current active* signal (most recent qualifying event within N days)?

### 1.3 Visual & 3D System

1. **City layout algorithm:** The spec says "structured grid grouped by sector." Strict rectangular grid? Or organic clustering (force-directed within sectors)? How many sectors are there (GICS has 11)?
2. **Store visual style:** What does a "candy store" look like at the mesh level? Stylized storefronts? Gingerbread houses? Candy-colored cubes? Do we need 3D models or are procedural shapes sufficient?
3. **Platinum store "architecturally distinct":** Distinct how? Different geometry (cathedral vs. shop)? Particle effects? Animated elements? Need specifics for modeling.
4. **Color coding by ticket tier:** What's the exact color palette? Tier I = ?, Tier II = ?, etc. Candy-themed colors (pastel pinks, mint greens, caramel golds)?
5. **Glow intensity mapping:** Linear or exponential mapping from Golden Score to glow intensity? What's the visual range (subtle rim light to full bloom)?
6. **Sector labels/boundaries:** How are sectors visually delineated in the city? Roads between sectors? Color-coded ground planes? Floating labels?
7. **Skybox / environment:** What does the world look like beyond the city? Candy-colored sky? Chocolate mountains? Or minimal/dark background?

### 1.4 Crowd Simulation

1. **Agent count budget:** Spec targets **500,000 concurrent agents** using WebGPU compute shaders. What's the minimum viable count for fallback (WebGL2-only devices)?
2. **Agent visual:** "Instanced capsule meshes" — are these abstract capsules, or do they have any humanoid features (head, limbs)? Candy-themed (gumdrops, gummy bears)?
3. **Outgoing runners with "glowing candy bars":** Is the candy bar a separate instanced mesh attached to the agent? Or a color/shader effect on the agent itself?
4. **"Historical payoff asymmetry" for candy bars:** How does this map visually? Bigger candy bar = higher payoff? Brighter glow? Different candy type?
5. **Interior lanes (BUY/CALL/PUT/SHORT):** How deep is the interior simulation? Full 3D room? Or a 2D overlay/panel that appears on click?
6. **"Directional bias derived from skew and downside distribution":** What's the exact formula for splitting crowd into BUY/CALL/PUT/SHORT lanes? Is positive skew = more BUY/CALL, negative skew = more PUT/SHORT?
7. **Lane crowd proportions:** If 70% flows to BUY lane, do we literally route 70% of agents? Or is it a visual indicator (wider lane, brighter)?

### 1.5 Navigation & UX

1. **Zoom levels:** How many discrete zoom levels? Continuous smooth zoom, or snapping to Macro -> Sector -> Store?
2. **Click-to-enter store:** Does clicking a store trigger a camera fly-in animation? Or a modal/overlay? Or a full scene transition?
3. **Store interior detail level:** Full 3D interior room with shelves, counters, lane dividers? Or a simplified data panel with charts overlaid on a basic room?
4. **Minimap interaction:** Click-to-zoom on minimap — does it smooth-animate the main camera, or hard-cut?
5. **Histogram of forward return distribution:** Rendered in Three.js inside the store? Or a 2D React overlay (Chart.js/D3)?
6. **Mobile support:** Is this desktop-only? Or do we need responsive/touch controls?

### 1.6 Graph Playground Page

1. **Correlation computation:** Pearson correlation on daily returns? What lookback window? Full 5-year history?
2. **"Adjustable threshold slider":** Threshold for what? Minimum correlation to draw an edge? Default value?
3. **Graph layout algorithm:** Force-directed (d3-force)? Or Three.js-based 3D force graph? 2D or 3D?
4. **"Regime toggle":** What regimes? High vol / low vol? Bull / bear? How are they defined?
5. **"Simulate shock propagation":** What does this mean mechanically? Select a node, apply a -X% shock, propagate through correlation edges? What's the propagation model?
6. **Node count:** All 500 stocks = 500 nodes. With correlation edges, that's up to 124,750 edges. Performance concern — what's the edge density target?

### 1.7 Candy Theming

1. **Candy store archetypes:** Should different sectors have different candy store styles? (e.g., Tech = neon candy arcade, Healthcare = apothecary candy shop, Finance = golden chocolate boutique, Energy = rock candy factory)
2. **Naming convention:** Do we refer to stocks as "sweets"? Sectors as "candy districts"? The city as "Candyville" / "Sugar City" / "Sweet Street"?
3. **Crowd agents as candy characters?** Gummy bears? Gingerbread people? Jawbreaker-headed figures?
4. **Golden Ticket visual:** Physical golden ticket floating above qualifying stores? Or embedded in the store facade?
5. **Platinum chaos effect:** Candy explosion? Chocolate river flooding? Sprinkle storms? What does "all hell breaks loose" look like in candy terms?
6. **Sound design:** Any audio? Candy-themed ambient sounds? Or silent visualization?
7. **Candy bar payoff visualization:** Different candy types for different return magnitudes? (e.g., small return = lollipop, large return = king-size chocolate bar)

### 1.8 Infrastructure & Deployment

1. **Databricks workspace:** Already provisioned? Community edition? Or paid tier? What cluster specs are available?
2. **Databricks <-> Colab workflow:** Do we run feature engineering in Databricks and model experimentation in Colab? Or everything in one place?
3. **API hosting:** FastAPI (Python) or Node.js? The spec lists both as options. Which one?
4. **Static vs. dynamic API:** Is the JSON served from a static file (pre-computed), or a live API endpoint that recomputes?
5. **Authentication:** Does the visualization require login? Or is it public?
6. **Vercel deployment:** Is this the confirmed host? Any constraints (team plan, bandwidth limits)?
7. **CDN for 3D assets:** Are we using custom 3D models (GLTF/GLB) that need CDN hosting? Or all procedural geometry?

### 1.9 Team & Timeline

1. **Team size:** The original plan references 4 people. Is that still the team? Same role split?
2. **Hacklytics 2026 — 36-hour constraint:** Hard hackathon deadline. Hacklytics 2026.
3. **MVP scope:** If we can't finish everything in 36 hours, what's the priority order? (Suggested: Static city + crowd sim + time slider > Golden Ticket computation > Geist UI graphs > Store interiors > Graph Playground > Future prediction)
4. **Demo format:** Candy-themed Rork Max demo video + live demo walkthrough at Hacklytics 2026.

---

<a name="architecture"></a>

## 2. Architecture Overview

```
+------------------------------------------------------------------+
|                        BROWSER (Client)                          |
|                                                                  |
|  +--------------+  +---------------+  +------------------------+ |
|  | React App    |  | Three.js      |  | Graph Playground       | |
|  | (UI/Nav)     |  | (3D Engine)   |  | (Force Graph)          | |
|  +------+-------+  +------+--------+  +------------+-----------+ |
|         |                 |                         |             |
|  +------+-----------------+-------------------------+-----------+ |
|  |              State Manager (Zustand / Context)               | |
|  +-----------------------------+--------------------------------+ |
|                                | fetch on load                    |
+--------------------------------+----------------------------------+
                                 |
                        +--------v---------+
                        |  API / CDN       |
                        |  (JSON endpoint) |
                        +--------+---------+
                                 |
                  +--------------+--------------+
                  |                             |
        +---------v----------+       +----------v-----------+
        |  Static JSON       |       |  FastAPI / Node      |
        |  (Vercel/CDN)      |       |  (if dynamic)        |
        +--------------------+       +----------+-----------+
                                                |
                                 +--------------+--------------+
                                 |                             |
                       +---------v----------+       +----------v-----------+
                       |  Databricks        |       |  Google Colab        |
                       |  (Delta Lake,      |       |  (Prototyping,       |
                       |   Feature Eng,     |       |   Visualization,     |
                       |   Spark Jobs)      |       |   Model Experiments) |
                       +--------------------+       +----------------------+
```

### Data Flow

1. **Kaggle CSV** -> Google Colab (EDA, prototyping) -> Databricks (production pipeline)
2. **Databricks** -> Feature engineering (Spark) -> Golden Ticket computation -> Delta Lake
3. **Delta Lake** -> Export JSON -> API endpoint / static CDN file
4. **Browser** -> Fetch JSON on load -> Build 3D scene -> Run crowd simulation

---

<a name="cndy-branding"></a>

## 3. Candy-lism System — Brand-Colored Candy Icons per Company

### 3.1 The Candy-lism Concept

**Candy-lism** is the core visual identity. Instead of text-based "CNDY" branding, every store displays a **unique candy symbol/icon** colored to match the company's brand palette. The candy icon IS the branding — it's how you identify the candy-store nature of each building at a glance.

```
EVERY STORE DISPLAYS:
  1. {COMPANY_NAME} — primary label (e.g., "NVDA", "Apple", "Tesla")
  2. 🍬 Brand-colored candy icon — on the store facade AND floating above
     (NOT text "CNDY" — an actual candy shape in company colors)

The candy icon type is assigned by sector, colored by brand.
This creates a unified visual language where the entire city
reads as a candy marketplace for stocks.
```

### 3.2 Store Facade with Candy Icon (Matches Prototype)

```
+---------------------------+
|      [🍫 Candy Icon]      |   <- Brand-colored candy shape floating above
|                           |
|   +----- NVDA -----+     |   <- Company/Ticker name (large, bold)
|   |                 |     |
|   |  [candy symbol] |     |   <- Small candy icon on facade (company brand color)
|   |                 |     |
|   +-----------------+     |
|                           |
+---------------------------+
```

### 3.3 Company-to-Candy Icon Mapping

Each company gets a **unique candy shape** determined by its sector, colored by its brand palette:

| Company | Ticker | Candy Shape | Brand Color | Visual Description |
|---------|--------|------------|-------------|-------------------|
| Nvidia | NVDA | Glowing candy bar | `#76B900` (green) | Bright green candy bar, tech-forward |
| Apple | AAPL | Sleek wrapped mint | `#A2AAAD` (silver) | Silver-white wrapped candy, premium |
| Tesla | TSLA | Bold candy wrapper | `#CC0000` (red) | Red wrapped candy, electric feel |
| Pfizer | PFE | Jelly bean capsule | `#0093D0` (blue) | Blue pill-shaped jelly bean |
| Starbucks | SBUX | Coffee candy drop | `#006241` (green) | Dark green candy drop |
| J.P. Morgan | JPM | Chocolate gold coin | `#003B6F` (navy) | Deep blue chocolate coin |
| Microsoft | MSFT | Multi-color candy square | `#F25022`/`#7FBA00`/`#00A4EF`/`#FFB900` | Four-color layered candy |
| Amazon | AMZN | Candy box (open) | `#FF9900` (orange) | Orange candy box |
| Meta | META | Round hard candy | `#0668E1` (blue) | Clean blue sphere candy |
| Google | GOOGL | Candy assortment | `#4285F4`/`#EA4335`/`#FBBC04`/`#34A853` | Multi-color candy drops |
| Netflix | NFLX | Candy ribbon | `#E50914` (red) | Red candy ribbon/wrapper |
| Coca-Cola | KO | Candy bottle | `#F40009` (red) | Iconic red candy bottle shape |

### 3.4 Candy Icon by Sector (20 Base Shapes)

```python
# Each sector maps to 2-3 candy shapes.
# Each stock gets a deterministic candy from its sector pool.
# The candy is COLORED with the company's brand hex.

SECTOR_CANDY_ICONS = {
    "Technology":        ["candy_bar", "ring_candy", "pixel_cube"],
    "Healthcare":        ["jelly_bean", "capsule_candy", "gummy_drop"],
    "Financials":        ["chocolate_coin", "gold_square", "hard_candy"],
    "Consumer Disc":     ["candy_heart", "lollipop", "wrapped_candy"],
    "Communication":     ["bubblegum_sphere", "ring_candy", "candy_ribbon"],
    "Industrials":       ["jawbreaker", "candy_bolt", "candy_bar"],
    "Consumer Staples":  ["wrapped_mint", "candy_cane", "candy_box"],
    "Energy":            ["rock_candy", "candy_crystal", "candy_gem"],
    "Utilities":         ["candy_cane", "hard_candy", "mint_tin"],
    "Real Estate":       ["candy_house", "mint_tin", "candy_block"],
    "Materials":         ["rock_candy", "candy_gem", "candy_crystal"],
}

def assign_candy_icon(ticker: str, sector: str, brand_color: str) -> dict:
    pool = SECTOR_CANDY_ICONS[sector]
    candy_shape = pool[hash(ticker) % len(pool)]  # deterministic per ticker
    return {
        "shape": candy_shape,
        "color": brand_color,
        "emissive_intensity": 0.3  # base glow, increases with golden_score
    }
```

### 3.5 Candy Icon Implementation (Three.js)

```typescript
// Each candy icon is a procedural Three.js geometry colored with brand hex
const CANDY_GEOMETRIES: Record<string, BufferGeometry> = {
  candy_bar:       new RoundedBoxGeometry(0.3, 0.1, 0.15, 2, 4),
  chocolate_coin:  new CylinderGeometry(0.15, 0.15, 0.04, 16),
  jelly_bean:      new CapsuleGeometry(0.08, 0.15, 4, 8),
  lollipop:        mergeMeshes(new SphereGeometry(0.12), stick),
  hard_candy:      new SphereGeometry(0.1, 8, 8),
  wrapped_mint:    new CylinderGeometry(0.06, 0.06, 0.2, 8), // + twist ends
  candy_heart:     extrudeFromSVG(heartPath),
  rock_candy:      new OctahedronGeometry(0.12),
  candy_gem:       new DodecahedronGeometry(0.1),
  ring_candy:      new TorusGeometry(0.1, 0.03, 8, 16),
  candy_cane:      new TubeGeometry(caneCurve, 20, 0.03, 8),
  bubblegum_sphere: new SphereGeometry(0.12, 12, 12),
  // ... 20 total shapes
};

function createCandyIcon(stock: StockData): Mesh {
  const geom = CANDY_GEOMETRIES[stock.candy_type];
  const mat = new MeshStandardMaterial({
    color: new Color(stock.brand_color),
    emissive: new Color(stock.brand_color),
    emissiveIntensity: 0.3 + (stock.golden_score / 5) * 0.7,
    metalness: 0.1,
    roughness: 0.5,
  });
  const mesh = new Mesh(geom, mat);
  mesh.position.set(0, storeHeight + 0.3, 0); // float above store
  return mesh;
}
```

### 3.6 Candy-lism Visual Rules

| Element | Candy-lism Treatment |
|---------|---------------------|
| Store exterior | White box + ticker label + candy icon on facade |
| Candy icon above | Brand-colored 3D candy shape floating above store |
| People/agents | Carry small candy-colored items matching target store's candy |
| Store interior | Candy-themed lanes with matching candy decorations |
| Golden Tickets | Physical golden ticket overlay + enhanced candy icon glow |
| Platinum stores | Oversized, gold-tinted, candy icon pulses, particle effects |
| Roads between sectors | Clean white with subtle candy-themed lane markings |
| Sector districts | Named as candy districts (Pixel Candy Arcade, etc.) |

---

<a name="data-pipeline"></a>

## 4. Data Pipeline

### 4.0 Data Source: Massive Yahoo Finance Dataset

**Dataset:** [Massive Yahoo Finance Dataset](https://www.kaggle.com/datasets/iveeaten3223times/massive-yahoo-finance-dataset)
**File:** `stock_details_5_years.csv` (65.58 MB, Apache 2.0 license)
**Coverage:** Top 500 companies by market cap, daily OHLCV, Nov 29 2018 -- Nov 29 2023 (~1,260 trading days per ticker)

**Raw Schema (9 columns):**

| Column | Type | Description | Maps To |
|--------|------|-------------|---------|
| `Date` | date | Trading day | Time slider axis, x-axis for all charts |
| `Open` | float | Opening price | Gap analysis, pre-market momentum signals |
| `High` | float | Daily high | Intraday range, volatility calc, ATH detection |
| `Low` | float | Daily low | Drawdown calc, support level identification |
| `Close` | float | Closing price | Primary price signal for all Golden Ticket calcs |
| `Volume` | int | Shares traded | Volume percentile calc, liquidity scoring |
| `Dividends` | float | Dividend payout | Future return prediction, income-vs-growth split |
| `Stock Splits` | float | Split ratio | Price adjustment, share count normalization |
| `Company` | string | Ticker symbol | Store ID (1:1 map to candy store buildings) |

**Derived Features (computed in Colab/Databricks from raw columns):**

- `daily_return` = Close pct_change -- drives agent decision confidence
- `drawdown_pct` = (Close - expanding max Close) / max Close -- Ticket #2 input
- `realized_vol_20d` = 20-day rolling std of daily_return * sqrt(252) -- Ticket #3 input
- `volume_percentile` = 252-day rolling percentile of Volume -- Ticket #4 input
- `fwd_60d_return` = Close[t+60] / Close[t] - 1 -- forward-looking validation
- `fwd_60d_skew` = skewness of next 60 daily returns -- asymmetry scoring
- `correlation_matrix` = 500x500 pairwise Pearson on daily_return -- candy cane connections
- `golden_score` = composite of Tickets 1-5 (0-5 scale) -- building height + glow + agent density
- `direction_bias` = {buy_pct, call_pct, put_pct, short_pct} -- store interior section distribution

**Data Quality Notes:**

- 500 tickers x ~1,260 days = ~630,000 rows total
- Dividends and Stock Splits are sparse (mostly 0.0) but critical for adjusted price accuracy
- Company column contains ticker symbols matching the 500 candy store IDs
- Missing data: weekends/holidays excluded, some tickers may have fewer rows (IPO after 2018)

### 4.1 Google Colab Phase (Prototyping & EDA)

**Purpose:** Rapid iteration on ticket logic before scaling to Databricks.

```python
# Colab Notebook Structure (using stock_details_5_years.csv directly)
notebooks/
  01_eda.ipynb                  # Load stock_details_5_years.csv, profile 500 tickers, check nulls
  02_feature_engineering.ipynb  # Drawdown from High/Low/Close, volume percentiles, volatility
  03_golden_tickets.ipynb       # Implement all 5 ticket formulas using OHLCV + Dividends
  04_forward_returns.ipynb      # Skew, asymmetry, forward return distributions
  05_export_json.ipynb          # Final JSON for frontend consumption
```

**Libraries:**

- `pandas` — data manipulation
- `numpy` — numerical computation
- `scipy.stats` — skewness, percentiles
- `matplotlib` / `seaborn` — validation plots
- `yfinance` (optional) — SPY/VIX data pull

### 3.2 Databricks Phase (Production Pipeline)

**Purpose:** Scalable, versioned, reproducible feature engineering.

```
Databricks Workspace/
  bronze/
    raw_stock_data           # Kaggle CSV ingested as Delta table
    raw_spy_data             # SPY benchmark (Alpha Vantage or Yahoo)
  silver/
    daily_returns            # (ticker, date, return, log_return)
    rolling_features         # (ticker, date, drawdown_pct, vol_20d, vol_60d, volume_pctile)
    forward_returns          # (ticker, date, fwd_5d, fwd_20d, fwd_60d, fwd_skew_60d)
    relative_features        # (ticker, date, return_vs_spy, beta, alpha)
  gold/
    golden_tickets           # (ticker, date, ticket_1..5, golden_score, is_platinum)
    direction_bias           # (ticker, date, buy_pct, call_pct, put_pct, short_pct)
    correlation_matrix       # (500x500 pairwise correlations)
  export/
    frontend_payload.json    # Final JSON for API
```

**Databricks Cluster Config (Suggested):**

- Runtime: DBR 14.x LTS with ML
- Driver: Standard_DS3_v2 (or equivalent)
- Workers: 2-4 nodes for Spark parallelism on 500 tickers x 1,260 trading days
- Delta Lake for ACID transactions and time travel
- MLflow for experiment tracking (optional but nice)

### 4.3 Feature Engineering Detail

```python
# Per ticker, per date:

# --- Drawdown ---
rolling_max = close.expanding().max()       # or rolling(252) for 1-year ATH
drawdown = (close - rolling_max) / rolling_max  # negative values
drawdown_percentile = drawdown.rank(pct=True)   # within stock's own history

# --- Volume ---
volume_percentile = volume.rolling(252).apply(
    lambda x: percentileofscore(x, x.iloc[-1])
)

# --- Volatility ---
daily_returns = close.pct_change()
realized_vol_20d = daily_returns.rolling(20).std() * np.sqrt(252)  # annualized
vol_percentile = realized_vol_20d.rolling(1260).apply(
    lambda x: percentileofscore(x, x.iloc[-1])
)

# --- Forward Returns ---
fwd_60d_returns = close.shift(-60) / close - 1
# For skew: collect daily returns over next 60 days from each point
fwd_60d_skew = daily_returns.rolling(60).apply(skew).shift(-60)

# --- Relative to SPY ---
stock_return_20d = close.pct_change(20)
spy_return_20d = spy_close.pct_change(20)
relative_return = stock_return_20d - spy_return_20d
```

### 4.4 Momentum and Technical Indicator Pipeline

```python
# --- Momentum Indicators (from OHLCV) ---

# RSI (Relative Strength Index) — 14-day
delta = close.diff()
gain = delta.where(delta > 0, 0).rolling(14).mean()
loss = (-delta.where(delta < 0, 0)).rolling(14).mean()
rs = gain / loss
rsi_14 = 100 - (100 / (1 + rs))

# MACD — (12, 26, 9) EMA crossover
ema_12 = close.ewm(span=12, adjust=False).mean()
ema_26 = close.ewm(span=26, adjust=False).mean()
macd_line = ema_12 - ema_26
macd_signal = macd_line.ewm(span=9, adjust=False).mean()
macd_histogram = macd_line - macd_signal

# Bollinger Band Width — 20-day, 2 std
bb_mid = close.rolling(20).mean()
bb_std = close.rolling(20).std()
bb_upper = bb_mid + 2 * bb_std
bb_lower = bb_mid - 2 * bb_std
bb_width = (bb_upper - bb_lower) / bb_mid  # normalized width
bb_pctb = (close - bb_lower) / (bb_upper - bb_lower)  # %B position

# On-Balance Volume (OBV)
obv = (np.sign(close.diff()) * volume).cumsum()
obv_slope_20d = obv.rolling(20).apply(lambda x: np.polyfit(range(len(x)), x, 1)[0])

# Average True Range (ATR) — 14-day, uses High/Low/Close
tr = pd.concat([
    high - low,
    (high - close.shift(1)).abs(),
    (low - close.shift(1)).abs()
], axis=1).max(axis=1)
atr_14 = tr.rolling(14).mean()
atr_percentile = atr_14.rolling(252).apply(lambda x: percentileofscore(x, x.iloc[-1]))

# Money Flow Index (MFI) — 14-day, volume-weighted RSI
typical_price = (high + low + close) / 3
raw_money_flow = typical_price * volume
pos_flow = raw_money_flow.where(typical_price > typical_price.shift(1), 0).rolling(14).sum()
neg_flow = raw_money_flow.where(typical_price < typical_price.shift(1), 0).rolling(14).sum()
mfi_14 = 100 - (100 / (1 + pos_flow / neg_flow))

# Stochastic Oscillator — (14, 3)
low_14 = low.rolling(14).min()
high_14 = high.rolling(14).max()
stoch_k = 100 * (close - low_14) / (high_14 - low_14)
stoch_d = stoch_k.rolling(3).mean()

# Rate of Change (ROC) — multi-period
roc_5 = close.pct_change(5) * 100
roc_20 = close.pct_change(20) * 100
roc_60 = close.pct_change(60) * 100

# --- Mean Reversion Indicators ---
zscore_20d = (close - close.rolling(20).mean()) / close.rolling(20).std()
zscore_60d = (close - close.rolling(60).mean()) / close.rolling(60).std()
autocorrelation_lag1 = daily_returns.rolling(60).apply(
    lambda x: x.autocorr(lag=1)
)
hurst_exponent = daily_returns.rolling(252).apply(compute_hurst)  # custom function
```

### 4.5 Sentiment Analysis Pipeline (NLP)

**Data Sources:**

- **News API** — real-time financial headlines for all 500 tickers
- **Alpha Vantage News Sentiment** — pre-scored news with relevance/sentiment per ticker
- **SEC EDGAR 8-K filings** — event-driven signals (earnings, guidance changes)

```python
# --- Sentiment NLP Pipeline ---
# Run in Colab/Databricks, results cached as Delta tables

from transformers import pipeline
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

# Dual-model sentiment scoring for robustness
finbert = pipeline("sentiment-analysis", model="ProsusAI/finbert")
vader = SentimentIntensityAnalyzer()

def score_headline(text: str, ticker: str) -> dict:
    """Score a single news headline with both models."""
    # FinBERT — fine-tuned on financial text
    fb_result = finbert(text[:512])[0]
    fb_score = fb_result['score'] * (1 if fb_result['label'] == 'positive' else -1)

    # VADER — lexicon-based, fast, good for social media
    vader_scores = vader.polarity_scores(text)

    return {
        'ticker': ticker,
        'finbert_score': fb_score,           # [-1, 1]
        'vader_compound': vader_scores['compound'],  # [-1, 1]
        'ensemble_sentiment': 0.6 * fb_score + 0.4 * vader_scores['compound'],
        'relevance': compute_relevance(text, ticker),  # keyword/entity match
    }

# --- Aggregated Sentiment Features (per ticker, per date) ---
sentiment_features = {
    'sentiment_mean_24h':    '24-hour rolling mean of ensemble_sentiment',
    'sentiment_std_24h':     '24-hour rolling std — measures controversy',
    'sentiment_delta_3d':    'sentiment change over 3 days — momentum',
    'news_count_24h':        'article count — attention proxy',
    'news_count_zscore':     'z-score vs 30-day avg — unusual attention',
    'positive_ratio_24h':    'fraction of positive articles',
    'sentiment_dispersion':  'std across articles — disagreement',
    'earning_surprise_flag': 'binary: 1 if 8-K filing in last 24h',
}
```

**Sentiment to Agent Behavior Mapping:**

| Sentiment Signal | Agent Reaction | Visual Effect |
|-----------------|----------------|---------------|
| Sudden positive spike | Agents sprint to store, high urgency | Green pulse on store |
| Sustained negative | Agents rush to SHORT/PUT sections | Red glow, agitated crowd |
| High dispersion (disagreement) | Mixed crowd, some BUY some SHORT | Store flickers between colors |
| News count spike | All agents pause, analyze, then rush | Brief freeze, then stampede |
| Earnings surprise | Platinum store upgrade, chaos at door | Store grows, golden particles |

### 4.6 Market Regime Detection Pipeline

```python
# --- Hidden Markov Model for Market Regime Classification ---
from hmmlearn.hmm import GaussianHMM

# Fit 4-state HMM on SPY daily returns + VIX
# States: Bull Quiet, Bull Volatile, Bear Quiet, Bear Volatile
features_for_hmm = np.column_stack([
    spy_returns,               # SPY daily returns
    spy_vol_20d,               # 20-day realized vol
    vix_level,                 # VIX index
    breadth_indicator,         # % stocks above 50-day MA
])

hmm_model = GaussianHMM(n_components=4, covariance_type='full', n_iter=200)
hmm_model.fit(features_for_hmm)
regime_labels = hmm_model.predict(features_for_hmm)

# --- Regime-Dependent Feature Adjustments ---
regime_config = {
    'bull_quiet':    {'agent_base_urgency': 1.0, 'buy_bias': 0.60, 'vol_threshold': 0.15},
    'bull_volatile': {'agent_base_urgency': 1.5, 'buy_bias': 0.45, 'vol_threshold': 0.25},
    'bear_quiet':    {'agent_base_urgency': 1.2, 'buy_bias': 0.30, 'vol_threshold': 0.20},
    'bear_volatile': {'agent_base_urgency': 2.5, 'buy_bias': 0.20, 'vol_threshold': 0.35},
}

# --- Additional Regime Indicators ---
# Yield curve slope (10Y - 2Y Treasury)
# Credit spread (BAA - AAA)
# Put/call ratio from CBOE
# Advance/decline line breadth
# Sector rotation heatmap (rolling 20d sector returns)
```

**Regime to City Visual Mapping:**

| Regime | City Skybox | Agent Behavior | Store Effects |
|--------|------------|----------------|---------------|
| Bull Quiet | Bright cotton candy sky, warm lighting | Calm walking, orderly queues | Stores glow softly |
| Bull Volatile | Dynamic sunset with racing clouds | Fast walking, occasional shoving | Stores pulse with energy |
| Bear Quiet | Overcast gray-purple, muted tones | Cautious movement, more SHORT lanes | Stores dim slightly |
| Bear Volatile | Stormy dark sky, lightning flashes | Full sprint, maximum aggression | Stores shake, red particles |

### 4.7 Cross-Sectional and Relative Value Features

```python
# --- Cross-Sectional Features (comparing stocks vs peers) ---

# Sector-relative Z-score
for sector in gics_sectors:
    mask = tickers_in_sector[sector]
    sector_mean = close[mask].pct_change(20).mean(axis=1)
    sector_std = close[mask].pct_change(20).std(axis=1)
    for ticker in tickers_in_sector[sector]:
        sector_zscore[ticker] = (
            close[ticker].pct_change(20) - sector_mean
        ) / sector_std

# Market-cap weighted momentum (factor exposure)
size_quintile = market_cap.rank(pct=True, axis=1).apply(lambda x: pd.qcut(x, 5, labels=False))
momentum_quintile = roc_60.rank(pct=True, axis=1).apply(lambda x: pd.qcut(x, 5, labels=False))
value_quintile = (1 / pe_ratio).rank(pct=True, axis=1).apply(lambda x: pd.qcut(x, 5, labels=False))

# Pair correlation change detection
# Flag when rolling correlation between stocks breaks from historical norm
for pair in top_200_corr_pairs:
    corr_60d = returns[pair[0]].rolling(60).corr(returns[pair[1]])
    corr_252d = returns[pair[0]].rolling(252).corr(returns[pair[1]])
    corr_break = (corr_60d - corr_252d).abs() > 0.3  # structural break

# --- Factor Decomposition ---
# Fama-French 3-factor alpha for each ticker
# alpha_i = return_i - (beta_mkt * MKT + beta_smb * SMB + beta_hml * HML)
# Residual alpha feeds into ticket scoring
```

### 4.8 Options-Derived Features (Synthetic from Historical)

```python
# Since Yahoo Finance data includes Stock Splits + price history,
# we can construct options-derived proxies without real options data:

# Implied Volatility Proxy (from realized vol regime)
iv_proxy = realized_vol_20d * np.where(regime == 'bull_quiet', 0.85, 1.15)

# Put/Call Ratio Proxy
# Higher drawdown + higher vol = proxy for elevated put buying
put_call_proxy = (
    0.4 * drawdown_percentile +
    0.3 * vol_percentile +
    0.2 * (1 - rsi_14 / 100) +
    0.1 * (1 - sentiment_mean_24h)
)

# Skew Proxy (deep OTM puts vs ATM)
skew_proxy = fwd_60d_skew * vol_percentile  # combines realized skew with vol regime

# Gamma Exposure Proxy
# Concentrated volume near round numbers suggests dealer hedging
round_number_proximity = 1 - (close % 10) / 10
volume_at_round = volume * round_number_proximity
gamma_proxy = volume_at_round.rolling(5).mean() / volume.rolling(20).mean()

# Term Structure Proxy (short vol vs long vol)
vol_term_structure = realized_vol_20d / realized_vol_60d  # <1 = inverted = bearish
```

### 4.9 Graph-Based Features (Network Analysis)

```python
import networkx as nx
from sklearn.cluster import SpectralClustering

# --- Correlation Network Graph ---
# 500 tickers as nodes, correlation > 0.5 as edges
corr_matrix = daily_returns.corr()
G = nx.Graph()
for i, ticker_i in enumerate(tickers):
    for j, ticker_j in enumerate(tickers):
        if i < j and corr_matrix.iloc[i, j] > 0.5:
            G.add_edge(ticker_i, ticker_j, weight=corr_matrix.iloc[i, j])

# Network centrality features
degree_centrality = nx.degree_centrality(G)
betweenness_centrality = nx.betweenness_centrality(G, weight='weight')
eigenvector_centrality = nx.eigenvector_centrality_numpy(G, weight='weight')
pagerank = nx.pagerank(G, weight='weight')

# Community detection (Louvain)
from community import community_louvain
communities = community_louvain.best_partition(G)

# Spectral clustering for sector-like groupings
spectral = SpectralClustering(n_clusters=11, affinity='precomputed')
spectral_labels = spectral.fit_predict(corr_matrix.clip(0, 1).values)

# --- Graph Features per Ticker ---
graph_features = {
    'degree_centrality':     'How connected (correlated) is this stock?',
    'betweenness_centrality':'Does this stock bridge different sectors?',
    'eigenvector_centrality':'Is this stock connected to other important stocks?',
    'pagerank':              'Network importance score (like Google PageRank)',
    'community_id':          'Which cluster does this stock belong to?',
    'community_size':        'How big is its community? Large = systemic risk',
    'cross_community_edges': 'Connections outside own community = diversification',
}

# --- These features feed the candy cane correlation visualization ---
# edge weight = correlation -> candy cane thickness
# node centrality = store glow intensity
# community = candy district (sector zone on the map)
```

### 4.10 Expanded Databricks Medallion Architecture

```text
Databricks Workspace/
  bronze/
    raw_stock_data               # stock_details_5_years.csv -> Delta table
    raw_spy_data                 # SPY benchmark (Yahoo Finance)
    raw_vix_data                 # VIX index for regime detection
    raw_news_sentiment           # News API + Alpha Vantage sentiment
    raw_sec_filings              # SEC EDGAR 8-K events

  silver/
    daily_returns                # (ticker, date, return, log_return, adj_close)
    rolling_features             # (ticker, date, drawdown_pct, vol_20d, vol_60d, volume_pctile)
    momentum_features            # (ticker, date, rsi_14, macd_hist, bb_pctb, obv_slope, mfi_14)
    technical_features           # (ticker, date, atr_14, stoch_k, stoch_d, roc_5/20/60, zscore_20/60)
    forward_returns              # (ticker, date, fwd_5d, fwd_20d, fwd_60d, fwd_skew_60d)
    relative_features            # (ticker, date, return_vs_spy, beta, alpha, sector_zscore)
    sentiment_features           # (ticker, date, sentiment_mean, sentiment_std, news_count)
    regime_features              # (date, regime_label, vix, breadth, credit_spread)
    options_proxy_features       # (ticker, date, iv_proxy, put_call_proxy, skew_proxy, gamma_proxy)
    graph_features               # (ticker, date, centrality, pagerank, community_id)
    cross_sectional_features     # (ticker, date, size_quintile, momentum_quintile, factor_alpha)

  gold/
    golden_tickets               # (ticker, date, ticket_1..5, golden_score, is_platinum)
    direction_bias               # (ticker, date, buy_pct, call_pct, put_pct, short_pct)
    correlation_matrix           # (500x500 pairwise correlations, updated daily)
    agent_decision_context       # (ticker, date, all features merged for Gemini prompt)
    regime_state                 # (date, current_regime, transition_probability)
    network_graph                # (nodes + edges + communities as JSON)

  platinum/
    ensemble_model_scores        # (ticker, date, lgbm_score, xgb_score, ensemble_score)
    model_metadata               # (model_version, features_used, train_period, metrics)
    backtesting_results          # (ticker, strategy, sharpe, max_dd, win_rate)

  export/
    frontend_payload.json        # Merged features + scores for API
    agent_context.json           # Pre-computed Gemini prompt context per ticker
    graph_payload.json           # Network graph data for D3 visualization
```

### 4.11 Ensemble Modeling Pipeline

```python
# --- LightGBM + XGBoost Ensemble for Golden Score Prediction ---
import lightgbm as lgb
import xgboost as xgb
from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import roc_auc_score, precision_recall_curve

# Feature matrix: 80+ features per (ticker, date) observation
feature_cols = [
    # Price-based (8)
    'drawdown_pct', 'drawdown_percentile', 'roc_5', 'roc_20', 'roc_60',
    'zscore_20d', 'zscore_60d', 'hurst_exponent',
    # Volume-based (4)
    'volume_percentile', 'obv_slope_20d', 'mfi_14', 'gamma_proxy',
    # Volatility-based (6)
    'realized_vol_20d', 'vol_percentile', 'atr_14', 'atr_percentile',
    'bb_width', 'vol_term_structure',
    # Momentum-based (8)
    'rsi_14', 'macd_histogram', 'bb_pctb', 'stoch_k', 'stoch_d',
    'autocorrelation_lag1', 'roc_20', 'roc_60',
    # Relative (4)
    'return_vs_spy', 'beta', 'sector_zscore', 'factor_alpha',
    # Sentiment (6)
    'sentiment_mean_24h', 'sentiment_std_24h', 'sentiment_delta_3d',
    'news_count_zscore', 'positive_ratio_24h', 'earning_surprise_flag',
    # Regime (4)
    'regime_label', 'vix_level', 'breadth_indicator', 'credit_spread',
    # Options-derived (4)
    'iv_proxy', 'put_call_proxy', 'skew_proxy', 'gamma_proxy',
    # Graph-based (5)
    'degree_centrality', 'betweenness_centrality', 'pagerank',
    'community_size', 'cross_community_edges',
    # Forward-looking targets
    'fwd_5d_return', 'fwd_20d_return',
]

# Target: binary — does this stock outperform SPY in next 20 days?
target = (fwd_20d_return > spy_fwd_20d_return).astype(int)

# Time-series walk-forward validation (no data leakage)
tscv = TimeSeriesSplit(n_splits=5, test_size=63)  # 63 trading days per fold

# LightGBM
lgb_model = lgb.LGBMClassifier(
    n_estimators=500, max_depth=6, learning_rate=0.05,
    subsample=0.8, colsample_bytree=0.7,
    min_child_samples=50, reg_alpha=0.1, reg_lambda=0.1,
)

# XGBoost
xgb_model = xgb.XGBClassifier(
    n_estimators=500, max_depth=5, learning_rate=0.05,
    subsample=0.8, colsample_bytree=0.7,
    min_child_weight=50, reg_alpha=0.1, reg_lambda=0.1,
    tree_method='hist',
)

# Ensemble: weighted average of probabilities
# Weights tuned via validation set AUC
ensemble_score = 0.55 * lgb_model.predict_proba(X)[:, 1] + \
                 0.45 * xgb_model.predict_proba(X)[:, 1]

# ensemble_score correlates with golden_score but adds ML prediction power
# High ensemble_score + high golden_score = PLATINUM store
```

**Model Performance Targets (walk-forward):**

| Metric | Target | Description |
|--------|--------|-------------|
| AUC-ROC | > 0.62 | Discriminative power for outperformance |
| Precision@10% | > 0.55 | Top decile stock selection accuracy |
| Sharpe Ratio (long-only top quintile) | > 1.2 | Risk-adjusted return |
| Max Drawdown (backtested) | < -25% | Downside risk control |
| Feature Importance Stability | > 0.7 rank correlation | Features not just noise |

### 4.12 Real-Time Streaming Pipeline

```text
Live Data Flow (during hackathon demo):

Alpaca WebSocket ──────────────────────────────────────────────────────────────
  |                                                                           |
  |  quote/trade events for 500 tickers                                       |
  |  ~2,000-5,000 ticks/second during market hours                            |
  |                                                                           |
  v                                                                           |
Rust/WASM MarketDataParser ─────────────────────────────────────────────────   |
  |  simd-json parse, <0.1ms per tick                                         |
  |  Write to SharedArrayBuffer                                               |
  |                                                                           |
  v                                                                           |
Feature Store (in-memory, Rust/WASM) ──────────────────────────────────────   |
  |  Rolling windows maintained per ticker:                                   |
  |    last_price, vwap_5min, volume_1min,                                    |
  |    rsi_14 (incremental), macd (incremental),                              |
  |    spread, bid_ask_imbalance                                              |
  |                                                                           |
  v                                                                           |
Decision Engine ───────────────────────────────────────────────────────────   |
  |  Every 60s: merge historical features + live features                     |
  |  Pack into batch of 1,000 agents                                          |
  |  Send to Gemini API with full context                                     |
  |                                                                           |
  v                                                                           |
GPU Staging Buffer ────────────────────────────────────────────────────────   |
  |  Agent decisions -> target store, urgency, lane                           |
  |  WebGPU compute shader reads next frame                                   |
  |                                                                           |
  v                                                                           |
 Three.js Render ──────────────────────────────────────────────────────────
```

**Streaming Feature Computation (incremental, no full recompute):**

```python
# Rust/WASM maintains these in O(1) per tick:
class IncrementalFeatureStore:
    """Maintains live features per ticker with O(1) update."""

    def on_tick(self, ticker: str, price: float, volume: int):
        # VWAP — incremental: sum(price * vol) / sum(vol)
        self.vwap_num[ticker] += price * volume
        self.vwap_den[ticker] += volume
        self.vwap[ticker] = self.vwap_num[ticker] / self.vwap_den[ticker]

        # RSI — Wilder's smoothing (no full window recompute)
        change = price - self.last_price[ticker]
        if change > 0:
            self.avg_gain[ticker] = (self.avg_gain[ticker] * 13 + change) / 14
            self.avg_loss[ticker] = (self.avg_loss[ticker] * 13) / 14
        else:
            self.avg_gain[ticker] = (self.avg_gain[ticker] * 13) / 14
            self.avg_loss[ticker] = (self.avg_loss[ticker] * 13 + abs(change)) / 14

        # Bid-ask spread (from quote data)
        self.spread[ticker] = self.ask[ticker] - self.bid[ticker]
        self.imbalance[ticker] = (
            (self.bid_size[ticker] - self.ask_size[ticker]) /
            (self.bid_size[ticker] + self.ask_size[ticker])
        )

        self.last_price[ticker] = price
```

### 4.13 Backtesting and Validation Framework

```python
# --- Walk-Forward Backtesting ---
# Train on 3 years, validate on 6 months, test on 6 months
# Slide window forward by 3 months, repeat

backtest_config = {
    'train_period': 756,      # 3 years of trading days
    'validation_period': 126, # 6 months
    'test_period': 126,       # 6 months
    'step_size': 63,          # slide 3 months
    'n_folds': 5,             # 5 walk-forward folds
    'universe': 500,          # all tickers
    'rebalance_freq': 'daily', # daily portfolio update
}

# Per-fold metrics tracked:
fold_metrics = {
    'auc_roc': 'Classification power of ensemble model',
    'precision_at_k': 'How good are top picks? k=10%, 20%',
    'long_short_sharpe': 'Long top quintile, short bottom quintile',
    'long_only_sharpe': 'Long top quintile only',
    'max_drawdown': 'Worst peak-to-trough in test',
    'calmar_ratio': 'Annual return / max drawdown',
    'turnover': 'Daily portfolio churn — affects transaction costs',
    'factor_exposure': 'Correlation with MKT, SMB, HML — is alpha unique?',
}

# --- Strategy Variants Tested ---
strategies = [
    'golden_ticket_only',          # Pure ticket score ranking
    'ensemble_ml_only',            # Pure LightGBM/XGBoost ranking
    'ticket_x_ensemble',           # Multiplicative combination
    'sentiment_overlay',           # Ticket + sentiment boost/penalty
    'regime_conditional',          # Switch strategy weights by regime
    'full_stack',                  # All features, all models, regime-aware
]
```

### 4.14 Model Monitoring and Drift Detection

```python
# --- Production Model Health Checks ---
# Run daily after market close in Databricks

monitoring_checks = {
    'feature_drift': {
        'method': 'PSI (Population Stability Index)',
        'threshold': 0.2,  # PSI > 0.2 = significant drift
        'action': 'alert + retrain trigger',
        'features_monitored': 'all 80+ features',
    },
    'prediction_calibration': {
        'method': 'Brier score on rolling 60-day window',
        'threshold': 0.3,  # if Brier > 0.3, predictions are unreliable
        'action': 'reduce ensemble weight, fall back to ticket-only',
    },
    'regime_transition': {
        'method': 'HMM transition probability monitoring',
        'threshold': 0.6,  # high probability of regime change
        'action': 'alert agents, increase base urgency, adjust direction bias',
    },
    'data_freshness': {
        'method': 'lag between market close and feature computation',
        'threshold': '5 minutes',
        'action': 'stale data warning on /agents page',
    },
}
```

---

<a name="golden-ticket-math"></a>

## 4. Golden Ticket Mathematical Definitions

### Ticket I — Dip Ticket (The Sour Candy Drop)

```
QUALIFIES IF:
  drawdown_percentile(ticker, date) > 0.80

  where drawdown_percentile = rank of current drawdown vs.
  all drawdowns for this ticker over its full 5-year history
```

**Candy Theme:** A sour candy that makes you pucker — the drop is painful but it's a signal.

### Ticket II — Shock Ticket (The Jawbreaker)

```
QUALIFIES IF:
  drawdown_percentile(ticker, date) > 0.85
  AND volume_percentile(ticker, date) > 0.90
  AND volatility_percentile(ticker, date) > 0.85
```

**Candy Theme:** A jawbreaker — hard hitting, multi-layered shock to the system.

### Ticket III — Asymmetry Ticket (The Fortune Cookie)

```
QUALIFIES IF:
  drawdown_percentile(ticker, date) > 0.85
  AND forward_60d_skew(ticker, date) > 0   (positive skew)
  AND p95_forward_return(ticker, date) > 2 * median_forward_return(ticker, date)
  AND p5_forward_return(ticker, date) > -median_drawdown(ticker)  (limited downside)
```

**Candy Theme:** A fortune cookie — crack it open and the upside surprise is much bigger than the downside.

### Ticket IV — Relative Dislocation Ticket (The Taffy Pull)

```
QUALIFIES IF:
  drawdown_percentile(ticker, date) > 0.80
  AND relative_return_vs_spy(ticker, date) < percentile_15(relative_return_history)
  AND mean_reversion_score(ticker) > threshold

  where mean_reversion_score = autocorrelation of 20-day returns at lag 1 < -0.1
  (negative autocorrelation suggests mean-reverting behavior)
```

**Candy Theme:** Taffy getting pulled too far — it snaps back.

### Ticket V — Structural Convexity Ticket (The Golden Gummy Bear)

```
QUALIFIES IF:
  drawdown_percentile(ticker, date) > 0.90
  AND volume_percentile(ticker, date) > 0.90
  AND relative_return_vs_spy < percentile_15
  AND forward_60d_skew > 0.5 (strongly positive)
  AND volatility_regime == "favorable" (VIX < 20 or below its own 80th percentile)
```

**Candy Theme:** The golden gummy bear — rare, structurally perfect, chewy upside.

### Platinum Ticket (The Wonka Bar)

```
QUALIFIES IF:
  golden_score(ticker, date) >= 4  (holds at least 4 of 5 tickets)
  AND rarity_percentile(ticker, date) > 0.98  (top 2% across all 500 stocks on that date)
  AND forward_60d_skew > 1.0  (extreme asymmetry)
  AND relative_return_vs_spy < percentile_5  (extreme divergence)
  AND volatility_regime == "favorable"
```

**Candy Theme:** The actual Wonka Bar with the golden ticket inside — once in a generation, unmistakable.

### Golden Score Computation

```python
golden_score = sum([ticket_1, ticket_2, ticket_3, ticket_4, ticket_5])  # 0 to 5
is_platinum = (golden_score >= 4) & (rarity_percentile > 0.98) & (extreme conditions)
```

---

<a name="scene-graph"></a>

## 5. 3D Scene Graph & Visual System

### 5.1 Scene Hierarchy

```
Scene
  AmbientLight (warm candy glow, 0xFFE4B5)
  DirectionalLight (soft top-down, no shadows)
  CandyCitySkybox (gradient: cotton candy pink -> twilight purple)

  CityGroup (all stores)
    SectorGroup_Technology ("Pixel Candy Arcade")
      Store_AAPL (InstancedMesh reference)
      Store_MSFT
      ...
    SectorGroup_Healthcare ("Medicine Drop Lane")
      ...
    SectorGroup_Financials ("Chocolate Coin Plaza")
      ...
    ... (11 GICS sectors)

  CrowdSystem
    InstancedMesh_Agents (single draw call, 500,000 instances via WebGPU)
    InstancedMesh_CandyBars (outgoing runner payloads)
    ParticleSystem_Chaos (GPU particles for Platinum stores)

  WebGPUComputePipeline
    SpatialHashPass  (@compute, 500K agents -> grid cells, workgroup 256)
    ForceComputePass (@compute, neighbor lookup + steering forces)
    IntegrationPass  (@compute, velocity + position update, collision resolve)
    MatrixWritePass  (@compute, write InstancedMesh matrices from positions)
    BufferReadbackFence (async GPU -> CPU for leaderboard + UI state)

  RustWASMDataLayer
    MarketDataParser  (Rust/WASM, sub-ms JSON decode of Alpaca WebSocket feed)
    OrderBookEngine   (Rust/WASM, per-ticker bid/ask aggregation + spread calc)
    PortfolioLedger   (Rust/WASM, 500K agent profit tracking, O(1) rank lookup)
    CorrelationEngine (Rust/WASM, rolling Pearson on 500x500 matrix, SIMD-accelerated)
    SignalRouter      (Rust/WASM, routes model updates to GPU buffers via SharedArrayBuffer)

  GroundPlane
    SectorZones (color-coded candy-district ground tiles)
    Roads (candy-stripe pathways between sectors)

  UIOverlays
    Minimap (React overlay, right side)
    SectorLabels (HTML overlay via CSS2DRenderer)
    StoreTooltip (hover info)

  StoreInterior (loaded on click, replaces city view or overlays)
    BuyLane
    CallLane
    PutLane
    ShortLane
    HistogramDisplay
    TicketBreakdownPanel
```

### 5.2 Store Geometry

**Standard Store (Candy Shop):**

```
- Base: BoxGeometry(width, height, depth) scaled by market_cap
  - width = lerp(1.0, 3.0, market_cap_percentile)
  - height = lerp(1.5, 4.0, market_cap_percentile)
  - depth = lerp(1.0, 2.0, market_cap_percentile)
- Roof: ConeGeometry or custom shape (candy-themed)
- Facade: Emissive material, glow intensity = golden_score / 5.0
- Sign: TextGeometry or SDF text with ticker name
- Color: Mapped by ticket tier (see Candy Theming section)
```

**Platinum Store (The Wonka Factory):**

```
- 2.5x scale multiplier on all dimensions
- Additional geometry: smokestacks, candy cane pillars, animated door
- Particle emitter: sprinkle/confetti burst (GPU particles)
- Pulsing glow shader (sinusoidal emissive oscillation)
- Custom material with animated candy-stripe pattern
```

### 5.3 City Layout Algorithm

```python
# Grid layout with sector clustering
SECTOR_POSITIONS = {
    "Technology":        (0, 0),      # "Pixel Candy Arcade"
    "Healthcare":        (1, 0),      # "Medicine Drop Apothecary"
    "Financials":        (2, 0),      # "Chocolate Coin District"
    "Consumer Disc":     (0, 1),      # "Candy Bar Boulevard"
    "Communication":     (1, 1),      # "Bubblegum Broadcasting"
    "Industrials":       (2, 1),      # "Gumball Factory Row"
    "Consumer Staples":  (0, 2),      # "Sugar & Spice Market"
    "Energy":            (1, 2),      # "Rock Candy Refinery"
    "Utilities":         (2, 2),      # "Licorice Power Grid"
    "Real Estate":       (0, 3),      # "Gingerbread Heights"
    "Materials":         (1, 3),      # "Caramel Quarry"
}

SECTOR_SIZE = 50  # world units per sector block
STORE_SPACING = 2.5  # minimum gap between stores

# Within each sector: sort by market cap, place in a grid
for sector in sectors:
    stocks = get_stocks_by_sector(sector)
    stocks.sort(by='market_cap', descending=True)
    cols = ceil(sqrt(len(stocks)))
    for i, stock in enumerate(stocks):
        row, col = divmod(i, cols)
        x = sector_origin.x + col * STORE_SPACING
        z = sector_origin.z + row * STORE_SPACING
        place_store(stock, x, 0, z)
```

### 5.4 Materials & Shaders

```glsl
// Candy Glow Shader (fragment)
uniform float u_goldenScore;  // 0.0 - 1.0 (normalized)
uniform float u_time;
uniform vec3 u_tierColor;
uniform bool u_isPlatinum;

void main() {
    vec3 baseColor = u_tierColor;

    // Glow intensity scales with golden score
    float glow = u_goldenScore * 0.8;

    // Platinum: pulsing effect
    if (u_isPlatinum) {
        glow += sin(u_time * 3.0) * 0.3 + 0.3;
        // Candy stripe pattern
        float stripe = step(0.5, fract(vUv.y * 10.0 + u_time * 0.5));
        baseColor = mix(baseColor, vec3(1.0, 0.84, 0.0), stripe * 0.3);
    }

    vec3 emissive = baseColor * glow;
    gl_FragColor = vec4(baseColor + emissive, 1.0);
}
```

---

<a name="crowd-physics"></a>

## 6. Crowd Simulation Physics

### 6.1 Agent Model — Autonomous AI Traders

Every agent in Golden City is an **autonomous AI agent** powered by **Gemini API** (newest model). They are NOT decorative — they read real market data, analyze news, and make independent trading decisions.

**Visual Appearance:**

- **Male agents:** Dark suits, ties, briefcases — Wall Street style
- **Female agents:** Professional blazers, pencil skirts or pantsuits — business executive style
- Both genders: hurried posture, running animations, determined expressions
- NOT gummy bears or candy characters — these are **people in business attire**

```typescript
interface AIAgent {
    // --- Identity ---
    id: string;                    // unique agent ID
    name: string;                  // generated name for leaderboard
    gender: 'male' | 'female';    // determines suit vs business attire mesh
    
    // --- Physics ---
    position: Vector3;             // current world position
    velocity: Vector3;             // current velocity
    mass: number;                  // for collision physics (1.0 = standard)
    radius: number;                // collision radius (0.3 world units)
    
    // --- AI Decision State ---
    targetStore: number;           // index of target store (decided by Gemini)
    targetLane: 'BUY' | 'SHORT' | 'CALL' | 'PUT' | null;
    confidence: number;            // 0-1, how sure the agent is (affects urgency)
    reasoning: string;             // text explanation of why targeting this stock
    lastNewsDigest: string[];      // recent news headlines consumed
    
    // --- Behavior State ---
    state: 'analyzing' | 'rushing' | 'door_fighting' | 'inside' | 'exiting' | 'throwing';
    carriesCandy: CandyReward | null;  // candy received when leaving store
    totalProfit: number;           // cumulative profit (competition metric)
    tradesCompleted: number;       // number of store visits completed
    
    // --- Physics Interaction ---
    isGrabbing: AIAgent | null;    // currently grabbing another agent
    isBeingGrabbed: boolean;       // being held by another agent
    throwCooldown: number;         // frames until can throw again
    staggerTimer: number;          // frames remaining in stagger animation after being bumped
    speed: number;                 // base speed, scales with urgency
    urgency: number;               // 1.0 normal, 3.0+ for platinum targets = chaotic rushing
}

interface CandyReward {
    type: string;                  // candy type matching store's ticker color
    color: string;                 // hex color matching ticker  
    size: 'small' | 'medium' | 'large' | 'king_size';  // based on predicted profit
    profitAmount: number;          // dollar value of the trade
}
```

### 6.2 Force Model — Full Contact Physics (Per Frame)

Agents don't politely walk around each other. They **collide, bump, shove, grab, and throw**.

```
F_total = F_goal + F_separation + F_collision + F_grab + F_throw + F_door_fight + F_turbulence

F_goal        = normalize(target_store - position) * goal_weight * urgency
                (higher urgency for platinum targets = agents SPRINT)

F_separation  = SUM over neighbors within r_sep: (position - neighbor.pos) / dist^2
                (basic crowd avoidance — but agents override this when urgent)

F_collision   = HARD ELASTIC COLLISION when dist(a, b) < (a.radius + b.radius)
                - Both agents bounce off each other (conservation of momentum)
                - Heavier/faster agent knocks lighter one sideways
                - Knocked agent enters 'stagger' state for 15-30 frames
                - Staggered agents veer off course, stumble animation plays

F_grab        = IF agent.urgency > 2.0 AND nearby_agent blocks path to target:
                - Grabbing agent latches onto blocker (isGrabbing = blocker)
                - Blocker's velocity reduced to 0 (held in place)
                - After 10-20 frames: THROW or RELEASE

F_throw       = IF agent.isGrabbing AND throwCooldown == 0:
                - Grabbed agent launched perpendicular to thrower's heading
                - throw_velocity = normalize(perpendicular) * throw_force * urgency
                - Thrown agent ragdolls for 30 frames, can knock over OTHER agents
                - Thrower gets brief speed boost (cleared the path)

F_door_fight  = AT STORE ENTRANCE (within 2 units of door):
                - All agents targeting same store COMPRESS toward door
                - Agents physically jam against each other at bottleneck
                - Higher urgency agents push to front (shoving force)
                - Visual: agents piling up, arms flailing, animated struggle
                - Agents enter store one at a time (queue with physics fighting)

F_turbulence  = random_jitter * turbulence_weight * (1 + urgency)
                (more erratic movement = more chaos, especially near platinum stores)
```

### 6.3 Speed & Density Scaling

```python
# Speed scales with Golden Score of target store
base_speed = 2.0  # world units per second
speed_multiplier = 1.0 + golden_score * 1.5  # score 0 -> 1x, score 5 -> 8.5x

# 500,000 TOTAL AGENTS distributed across 500 stores (1,000 avg per store)
# Density scales nonlinearly with Golden Score
base_agents_per_store = 200
agent_count = base_agents_per_store + floor(golden_score^2.5 * 800)
# Score 0: 200 agents
# Score 1: 200 + 800 = 1,000
# Score 3: 200 + 12,470 = 12,670
# Score 5: 200 + 44,721 = 44,921  (Platinum: absolute insanity)

# Platinum stores: additional stampede burst
if is_platinum:
    agent_count *= 3.0
    turbulence_weight *= 5.0
    spawn_chaos_particles(store)
```

### 6.4 Spatial Hashing Grid

```typescript
class SpatialGrid {
    cellSize: number = 4.0;  // world units
    cells: Map<string, number[]>;  // cell key -> agent indices

    getKey(x: number, z: number): string {
        return `${Math.floor(x / this.cellSize)},${Math.floor(z / this.cellSize)}`;
    }

    getNeighbors(agentIdx: number): number[] {
        const pos = agents[agentIdx].position;
        const cx = Math.floor(pos.x / this.cellSize);
        const cz = Math.floor(pos.z / this.cellSize);
        const result: number[] = [];
        for (let dx = -1; dx <= 1; dx++) {
            for (let dz = -1; dz <= 1; dz++) {
                const key = `${cx + dx},${cz + dz}`;
                if (this.cells.has(key)) {
                    result.push(...this.cells.get(key)!);
                }
            }
        }
        return result;
    }
}
// O(n) rebuild per frame, O(1) neighbor lookup
```

### 6.5 Simulation Loop Pseudocode

```
EACH FRAME (target 60fps -> 16.67ms budget):
  1. Upload agent state to GPU storage buffer       (~0.5ms)
  2. Dispatch WebGPU compute shader:                (~4ms for 500K agents)
     - 500,000 agents / 256 workgroup size = 1,954 dispatches
     a. Find neighbors from GPU spatial grid
     b. Compute F_goal (attraction to target store)
     c. Compute F_separation (push away from nearby agents)
     d. Compute F_alignment (match neighbor velocity)
     e. Compute F_turbulence (random jitter, higher near Platinum)
     f. Compute F_overlap (hard collision correction)
     g. Sum forces -> acceleration -> update velocity (with damping)
     h. Update position
     i. Check arrival: if within store radius, transition to 'inside' or 'outgoing'
  3. Update InstancedMesh matrices                  (~1ms)
  4. Update particle systems for Platinum stores    (~1ms)
```

### 6.6 Direction Bias -> Lane Assignment

```python
# Derived from forward return distribution skew and downside risk

def compute_direction_bias(ticker_data):
    fwd_skew = ticker_data['forward_60d_skew']
    fwd_median = ticker_data['forward_60d_median_return']
    downside_5th = ticker_data['forward_60d_p5_return']

    # Positive skew + positive median -> bullish
    if fwd_skew > 0.5 and fwd_median > 0.02:
        return {'BUY': 0.50, 'CALL': 0.30, 'PUT': 0.10, 'SHORT': 0.10}

    # Positive skew but near-zero median -> options play
    elif fwd_skew > 0.3 and abs(fwd_median) < 0.02:
        return {'BUY': 0.20, 'CALL': 0.50, 'PUT': 0.20, 'SHORT': 0.10}

    # Negative skew -> bearish bias
    elif fwd_skew < -0.3:
        return {'BUY': 0.10, 'CALL': 0.10, 'PUT': 0.45, 'SHORT': 0.35}

    # Neutral
    else:
        return {'BUY': 0.30, 'CALL': 0.25, 'PUT': 0.25, 'SHORT': 0.20}
```

---

<a name="time-slider"></a>

## 7. Time Slider System — Historical & Future Crowd Traffic

### 7.1 Core Concept

A **scrubable timeline slider** at the bottom of the Golden City view. Dragging it changes the date displayed, and the entire city's crowd density, store glow, and agent behavior updates to reflect that date's data.

```
+================================================================+
|  [<<]  [<]  |----o------------------------------------|  [>]  [>>]  |
|              2021-01        2023-06          2026-02           |
|              Past           ↑ Selected       Present/Future    |
|                           2024-03-15                          |
+================================================================+
   TRAFFIC: 🔴 Earnings Week    🟡 Dividend Date    🟢 Normal
```

### 7.2 Time Modes

| Mode | Description | Data Source |
|------|-------------|-------------|
| **Historical (Past)** | Show actual crowd traffic based on real volume/volatility data | Kaggle 5-year daily dataset |
| **Present** | Today's live or most-recent data snapshot | Latest dataset export |
| **Future (Prediction)** | Predicted crowd traffic based on upcoming earnings, dividends, historical patterns | Prediction engine (Section 8) |

### 7.3 Slider Implementation

```typescript
interface TimeSliderState {
  currentDate: Date;
  minDate: Date;          // earliest date in dataset (e.g., 2021-01-04)
  maxDate: Date;          // latest date or future prediction horizon (e.g., 2026-12-31)
  mode: 'historical' | 'present' | 'future';
  isPlaying: boolean;     // auto-advance animation
  playbackSpeed: number;  // 1x, 2x, 5x, 10x
}

// Geist UI Slider Component
import { Slider } from '@geist-ui/core';

function TimeSlider({ state, onChange }: TimeSliderProps) {
  const totalDays = daysBetween(state.minDate, state.maxDate);

  return (
    <div className="time-slider-container">
      <Slider
        min={0}
        max={totalDays}
        value={daysBetween(state.minDate, state.currentDate)}
        onChange={(val) => onChange(addDays(state.minDate, val))}
        step={1}
      />
      <div className="time-labels">
        <span>{formatDate(state.minDate)}</span>
        <span className="current-date">{formatDate(state.currentDate)}</span>
        <span>{formatDate(state.maxDate)}</span>
      </div>
      <div className="playback-controls">
        <button onClick={skipBack}>⏪</button>
        <button onClick={stepBack}>◀</button>
        <button onClick={togglePlay}>{state.isPlaying ? '⏸' : '▶'}</button>
        <button onClick={stepForward}>▶</button>
        <button onClick={skipForward}>⏩</button>
        <select onChange={setSpeed}>
          <option value={1}>1x</option>
          <option value={5}>5x</option>
          <option value={10}>10x</option>
        </select>
      </div>
    </div>
  );
}
```

### 7.4 What Changes When the Date Changes

| City Element | Historical Date | Future Date |
|-------------|----------------|-------------|
| **Crowd density per store** | Based on actual volume + volatility percentile | Predicted from seasonal patterns + upcoming events |
| **Store glow intensity** | Based on actual Golden Score for that date | Based on predicted Golden Score |
| **Agent count per store** | `f(golden_score_on_date)` | `f(predicted_score)` |
| **Agent speed** | Based on actual volatility | Based on predicted volatility |
| **Direction bias** | Actual BUY/CALL/PUT/SHORT split | Predicted split from historical earnings patterns |
| **Platinum status** | Whether store qualified on that date | Prediction probability indicator |
| **Event markers** | Show earnings releases, dividend dates | Upcoming scheduled events highlighted |

### 7.5 Timeline Event Markers

```typescript
// Overlay event markers on the timeline
interface TimelineEvent {
  date: Date;
  type: 'earnings' | 'dividend' | 'split' | 'crash' | 'rally';
  ticker: string;
  description: string;
  impactScore: number;  // -1 to +1
}

// Visual markers on the slider track
// 🔴 = Earnings week (high volatility expected)
// 🟡 = Ex-dividend date
// 🔵 = Stock split
// ⚡ = Market-wide event (crash, rally)
```

### 7.6 Playback Animation Mode

```
When user hits ▶ (Play):
  1. Auto-advance date by 1 trading day per tick
  2. Crowd smoothly transitions between states (GSAP/lerp)
  3. Agents redistribute over ~500ms per date change
  4. Speed controls: 1x (1 day/sec), 5x, 10x
  5. Events flash on the timeline as they pass
  6. User can pause, scrub, resume at any point
```

### 7.7 Data Structure for Time-Series Crowd Data

```json
// Pre-computed per (ticker, date) pair:
{
  "AAPL": {
    "2024-03-15": {
      "golden_score": 3,
      "crowd_density": 127,
      "agent_speed_mult": 5.5,
      "direction_bias": { "buy": 0.45, "call": 0.30, "put": 0.15, "short": 0.10 },
      "is_platinum": false,
      "volume_percentile": 0.88,
      "events": [{ "type": "earnings", "days_until": 5 }]
    }
  }
}
```

---

<a name="future-prediction"></a>

## 8. Future Prediction Engine — Quarterly Reports & Dividends

### 8.1 Core Concept

Users can **drag the time slider past the present date** into the future. The prediction engine estimates what crowd traffic would look like based on:

1. **Scheduled quarterly earnings reports** — historically, stocks see volume/volatility spikes around earnings
2. **Dividend ex-dates** — dividend dates create predictable crowd patterns (buy before, sell after)
3. **Historical seasonality** — stocks often follow seasonal patterns (e.g., retail stocks surge Q4)
4. **Sector-wide patterns** — when one tech stock reports, the whole sector often moves

### 8.2 Prediction Inputs

| Input | Source | Update Frequency |
|-------|--------|-----------------|
| Earnings calendar | Yahoo Finance / Alpha Vantage | Weekly |
| Dividend schedule | Kaggle dataset + external API | Monthly |
| Historical earnings reactions | Computed from 5-year dataset | Static (pre-computed) |
| Seasonal volume patterns | Rolling average by month/week | Static |
| Sector correlation | Correlation matrix from pipeline | Static |

### 8.3 Earnings Impact Model

```python
def predict_earnings_crowd(ticker: str, days_until_earnings: int) -> dict:
    """
    Predict crowd density around a stock based on proximity to earnings.
    Uses historical earnings reaction data.
    """
    # Historical pattern: volume ramps up 5 days before, spikes on day, fades 3 days after
    historical_reactions = get_historical_earnings_reactions(ticker)

    # Average volume multiplier by days_from_earnings
    avg_volume_mult = historical_reactions.groupby('days_from_earnings')['volume_mult'].mean()

    # Average post-earnings move magnitude
    avg_abs_move = historical_reactions['post_earnings_return'].abs().mean()

    # Direction: what % of past earnings were positive?
    positive_pct = (historical_reactions['post_earnings_return'] > 0).mean()

    # Predict crowd density
    predicted_density = base_density * avg_volume_mult.get(days_until_earnings, 1.0)

    # Predict direction bias
    if positive_pct > 0.65:
        bias = {"buy": 0.45, "call": 0.35, "put": 0.12, "short": 0.08}
    elif positive_pct < 0.35:
        bias = {"buy": 0.10, "call": 0.12, "put": 0.43, "short": 0.35}
    else:
        bias = {"buy": 0.25, "call": 0.30, "put": 0.25, "short": 0.20}

    return {
        "predicted_density": predicted_density,
        "direction_bias": bias,
        "confidence": compute_confidence(historical_reactions),
        "avg_move": avg_abs_move,
        "beat_rate": positive_pct
    }
```

### 8.4 Dividend Impact Model

```python
def predict_dividend_crowd(ticker: str, days_until_exdate: int) -> dict:
    """
    Predict crowd behavior around ex-dividend dates.
    Pattern: accumulation before, distribution after.
    """
    dividend_yield = get_annual_dividend_yield(ticker)
    historical_div_reactions = get_historical_dividend_reactions(ticker)

    # Pre-ex-date: buyers accumulate (5-10 days before)
    # Ex-date: price drops by ~dividend amount
    # Post-ex-date: normalizes within 3-5 days

    if days_until_exdate > 0 and days_until_exdate <= 10:
        # Pre-dividend accumulation
        density_mult = 1.0 + (dividend_yield * 10) * (1 - days_until_exdate / 10)
        bias = {"buy": 0.55, "call": 0.20, "put": 0.15, "short": 0.10}
    elif days_until_exdate == 0:
        # Ex-date: mixed signals
        density_mult = 1.5
        bias = {"buy": 0.20, "call": 0.15, "put": 0.35, "short": 0.30}
    else:
        # Post-ex-date recovery
        density_mult = 1.0 + max(0, (3 + days_until_exdate) / 3) * 0.3
        bias = {"buy": 0.30, "call": 0.25, "put": 0.25, "short": 0.20}

    return {
        "predicted_density": base_density * density_mult,
        "direction_bias": bias,
        "dividend_yield": dividend_yield,
        "confidence": 0.7  # dividend patterns are more predictable
    }
```

### 8.5 "Did They Do Good?" — Retrospective Analysis

When users scrub to **past earnings dates**, the system shows:

```
+-----------------------------------------------+
|  AAPL — Q3 2024 Earnings (2024-10-31)         |
|                                                 |
|  PREDICTED:  Crowd density +45% | BUY bias 55% |
|  ACTUAL:     Crowd density +62% | Price +3.2%   |
|                                                 |
|  VERDICT:  ✅ BEAT expectations                  |
|            Revenue: $94.9B vs $89.5B est         |
|            EPS: $1.64 vs $1.60 est               |
|                                                 |
|  CROWD ACCURACY: 78% (model predicted well)     |
+-----------------------------------------------+
```

### 8.6 Future Date Confidence Indicator

```typescript
// When viewing future dates, show a confidence band
interface FuturePrediction {
  date: Date;
  ticker: string;
  predicted_crowd_density: number;
  confidence: number;           // 0 to 1
  confidence_band: {
    low: number;                // 20th percentile prediction
    mid: number;                // median prediction
    high: number;               // 80th percentile prediction
  };
  upcoming_events: ScheduledEvent[];
  prediction_basis: string;     // "earnings_proximity" | "dividend" | "seasonal" | "baseline"
}

// Visual: future stores have a translucent/ghosted appearance
// Opacity = confidence level
// Fully opaque = high confidence (upcoming earnings with strong historical pattern)
// Semi-transparent = low confidence (no scheduled events, baseline prediction)
```

### 8.7 Prediction Data Pipeline

```
Databricks Pipeline (extended):
  gold/
    earnings_calendar          # (ticker, date, type=quarterly/annual, consensus_est)
    earnings_reactions         # (ticker, date, pre_volume_mult, post_return, beat_flag)
    dividend_calendar          # (ticker, ex_date, pay_date, amount, yield)
    dividend_reactions         # (ticker, ex_date, pre_accumulation, post_recovery)
    seasonal_patterns          # (ticker, month, avg_volume_mult, avg_return)
    future_predictions         # (ticker, future_date, predicted_score, confidence)

  export/
    predictions.json           # Future crowd predictions for frontend
    earnings_calendar.json     # Upcoming earnings dates
    dividends_calendar.json    # Upcoming dividend dates
```

---

<a name="navigation"></a>

## 9. Navigation & Camera System

### 7.1 Zoom Levels

```typescript
enum ZoomLevel {
    MACRO    = 0,  // See all 500 stores, city overview — camera Y=200, looking down
    SECTOR   = 1,  // See one sector cluster ~50 stores — camera Y=80
    STORE    = 2,  // See individual store exterior — camera Y=20
    INTERIOR = 3,  // Inside store — camera Y=5, looking at lanes
}
```

### 7.2 Camera Controller

```typescript
// Extended OrbitControls with snap zones
class CandyCityCamera {
    controls: OrbitControls;
    currentZoom: ZoomLevel;
    targetPosition: Vector3;
    transitionDuration: number = 1.2; // seconds

    // Smooth interpolation between zoom levels
    zoomTo(level: ZoomLevel, target?: Vector3) {
        const from = { pos: camera.position.clone(), lookAt: controls.target.clone() };
        const to = computeZoomTarget(level, target);
        animateCamera(from, to, this.transitionDuration, easeInOutCubic);
    }

    // Minimap click handler
    onMinimapClick(sectorOrStore: string) {
        const target = getWorldPosition(sectorOrStore);
        this.zoomTo(ZoomLevel.SECTOR, target);
    }

    // Store click handler
    onStoreClick(storeId: string) {
        this.zoomTo(ZoomLevel.INTERIOR, getStorePosition(storeId));
        showStoreInteriorUI(storeId);
    }
}
```

### 7.3 LOD System

```
Distance from camera -> Detail level:
  > 150 units:  LOD0 — colored box, no text, no glow (macro view)
  > 50 units:   LOD1 — textured box + ticker label + faint glow
  > 15 units:   LOD2 — full store geometry + sign + glow shader + door
  < 15 units:   LOD3 — interior detail visible, individual agent meshes
```

### 7.4 Minimap (React Component)

```
+--------------------+
|  CANDY CITY MAP    |
|  +--+--+--+       |
|  |TC|HC|FI|       |  TC = Tech Candy Arcade
|  +--+--+--+       |  HC = Health Drop Apothecary
|  |CD|CM|IN|       |  FI = Chocolate Coin District
|  +--+--+--+       |  ...
|  |CS|EN|UT|       |
|  +--+--+  |       |  * = Platinum store
|  |RE|MA|  |       |
|  +--+--+  |       |
|  * AAPL  * TSLA   |
|  * NVDA            |
+--------------------+
Position: fixed right, 200x300px
```

---

<a name="store-interiors"></a>

## 8. Store Interior System — BUY/SHORT/CALL/PUT

When a user clicks a store, the camera transitions inside and a detailed view appears. The interior splits into **4 distinct sections** showing where agents are going and what decisions they're making.

### 8.1 Interior Layout — 4 Trading Sections

```
+---------------------------------------------------+
|                 [TICKER] CANDY SHOP                |
|              Sector: Technology                     |
|           Golden Score: ****- (4/5)                |
|                                                     |
|  +===== ENTRANCE (agents cramming at door) =====+  |
|  |  👔👗👔👗👗👔👔👗👔👗  FIGHTING TO GET IN  |  |
|  +===============================================+  |
|                                                     |
|  +----------+----------+----------+----------+     |
|  |   BUY    |  SHORT   |   CALL   |   PUT    |     |
|  |  Section |  Section |  Section |  Section |     |
|  |          |          |          |          |     |
|  | 👔👔👔  | 👗👔    | 👔👔👗  | 👗       |     |
|  | 👗👔👔  |          | 👔      |          |     |
|  | 👔👗    |          |          |          |     |
|  | 45%      | 20%      | 25%     |  10%     |     |
|  | agents   | agents   | agents  |  agents  |     |
|  +----------+----------+----------+----------+     |
|                                                     |
|  +===== EXIT (agents leave WITH CANDY) =========+  |
|  |  🍬🍫🍭 Agents carry candy = profit 🍬🍫🍭 |  |
|  +===============================================+  |
|                                                     |
|  FORWARD RETURN DISTRIBUTION (60-day):             |
|  [histogram visualization]                         |
|  p5=-8%  median=+3%  p95=+28%  skew=+1.2         |
|                                                     |
|  TICKETS: I [x]  II [x]  III [x]  IV [x]  V [ ]  |
+---------------------------------------------------+
```

### 8.2 Key Interior Behaviors

| Behavior | Description |
|----------|-------------|
| **Door cramming** | Agents physically pile up at the entrance fighting to get in. Higher urgency agents push to front. Visual of bodies compressed at doorway. |
| **Section routing** | Once inside, agents walk to their chosen section (BUY/SHORT/CALL/PUT) based on their AI analysis via Gemini |
| **Section crowds** | Real-time count of agents in each section. More agents = stronger signal in that direction |
| **Candy reward on exit** | When agents finish their "trade" and leave, they receive candy matching the store's ticker color. Candy size = profit size |
| **Agent info on hover** | Hover over any agent inside to see: their name, their reasoning, their profit so far |

### 8.3 Candy Reward System

```typescript
// When an agent exits a store, they receive candy
function awardCandyOnExit(agent: AIAgent, store: StoreData): CandyReward {
    const predictedProfit = agent.confidence * store.golden_score * baseMultiplier;
    
    return {
        type: SECTOR_CANDY_ICONS[store.sector][0],
        color: store.brand_color,  // candy matches ticker color
        size: predictedProfit > 1000 ? 'king_size' 
            : predictedProfit > 500 ? 'large'
            : predictedProfit > 100 ? 'medium' 
            : 'small',
        profitAmount: predictedProfit,
    };
}

// Agents visually carry their candy above their head as they walk away
// Bigger candy = more profit = more visible success
// Other agents SEE the candy size and may change their target store
```

### 8.4 Implementation

- **3D elements:** Four section corridors with crowd agents flowing, rendered in Three.js. Door entrance with physical bottleneck geometry.
- **2D overlays:** Histogram, ticket breakdown, stats — rendered as React components overlaid via CSS2DRenderer or absolute-positioned HTML
- **Agent meshes inside:** Individual agent meshes visible (suits/business attire), not instanced — allows hover interaction
- **Candy exit particles:** Confetti burst when agent receives candy reward

---

<a name="geist-graph"></a>

## 11. Candy Cane Correlation Network — Interlocking Stock Connections

### 11.1 Core Concept

Stocks that interact with one another are connected by **candy canes interlocking each other**. When two stocks are correlated, a pair of candy canes — each colored to match its respective stock's **ticker color** — twist and interlock between the two buildings.

- **Positive correlation:** Candy canes twist together harmoniously (smooth interlock)
- **Negative correlation:** Candy canes clash/cross (jagged interlock pattern)
- **Strength:** More candy canes = stronger correlation
- **Color:** Each candy cane matches the brand/ticker color of the stock it represents

### 11.2 Why Geist UI

| Reason | Detail |
|--------|--------|
| **Clean minimal aesthetic** | Geist's design language matches the Golden City's structured vibe |
| **React-native components** | Slider, Toggle, Card, Tooltip, Modal — all needed for controls |
| **Typography** | Geist font family for clean labels |
| **Dark/light mode** | Built-in theme system for day/night city views |

### 11.3 Candy Cane Implementation (Three.js)

```typescript
// Candy canes interlock between correlated stores
// Each stock's candy cane is colored to match its ticker color

interface CandyCaneConnection {
  sourceStore: StoreData;       // first stock
  targetStore: StoreData;       // second stock
  weight: number;               // correlation coefficient (-1 to 1)
  sourceCaneColor: string;      // hex color matching source ticker (e.g., NVDA green)
  targetCaneColor: string;      // hex color matching target ticker (e.g., AAPL silver)
}

function createInterlockingCandyCanes(
  connection: CandyCaneConnection
): Group {
  const group = new Group();
  const sourcePos = getStorePosition(connection.sourceStore.ticker);
  const targetPos = getStorePosition(connection.targetStore.ticker);
  
  // Two candy cane curves that twist around each other
  const midPoint = new Vector3(
    (sourcePos.x + targetPos.x) / 2,
    Math.abs(connection.weight) * 12,  // height = correlation strength
    (sourcePos.z + targetPos.z) / 2,
  );

  // Source stock's candy cane (colored to match source ticker)
  const sourceCane = createCandyCaneMesh(
    sourcePos, midPoint, targetPos,
    connection.sourceCaneColor,
    0.0  // phase offset for interlock
  );

  // Target stock's candy cane (colored to match target ticker)
  const targetCane = createCandyCaneMesh(
    sourcePos, midPoint, targetPos,
    connection.targetCaneColor,
    Math.PI  // 180-degree phase offset = interlock twist
  );

  group.add(sourceCane, targetCane);
  
  // Candy stripe pattern on each cane (white stripes over ticker color)
  applyStripeShader(sourceCane, connection.sourceCaneColor);
  applyStripeShader(targetCane, connection.targetCaneColor);
  
  return group;
}

function createCandyCaneMesh(
  start: Vector3, mid: Vector3, end: Vector3,
  color: string, phaseOffset: number
): Mesh {
  // Helical path that twists around the main curve
  const mainCurve = new CatmullRomCurve3([start, mid, end]);
  const points: Vector3[] = [];
  const twists = 6;  // number of full twists along the path
  
  for (let t = 0; t <= 1; t += 0.01) {
    const point = mainCurve.getPoint(t);
    const radius = 0.3;  // helix radius
    point.x += Math.cos(t * twists * Math.PI * 2 + phaseOffset) * radius;
    point.z += Math.sin(t * twists * Math.PI * 2 + phaseOffset) * radius;
    points.push(point);
  }
  
  const helixCurve = new CatmullRomCurve3(points);
  const geometry = new TubeGeometry(helixCurve, 64, 0.06, 8);
  const material = new MeshStandardMaterial({
    color: new Color(color),
    metalness: 0.2,
    roughness: 0.4,
  });
  
  return new Mesh(geometry, material);
}
```

### 11.5 Geist UI Graph Controls Panel

```
+------------------------------------------+
|  📊 Stock Connections                     |
|  AAPL — Apple Inc.                       |
|  Sector: Technology                       |
|                                          |
|  Correlation Threshold: [====o====] 0.60 |
|                                          |
|  [x] Show positive    [ ] Show inverse   |
|                                          |
|  TOP CONNECTIONS:                         |
|  +92% MSFT   Technology      ═══════     |
|  +87% GOOGL  Communication   ══════      |
|  +81% AMZN   Consumer Disc   ═════       |
|  +76% META   Communication   ════        |
|  -45% XOM    Energy          ════ (inv)  |
|                                          |
|  [View in Full Graph →]                  |
+------------------------------------------+
```

### 11.6 Interactive Features

| Feature | Implementation |
|---------|---------------|
| **Hover store** | Show top 3 correlation threads as glowing arcs |
| **Click store** | Open full Geist Card panel with all correlations + threshold slider |
| **Sector mode** | Toggle to show sector-level correlations (aggregate) |
| **Thread particles** | Tiny glowing particles flow along correlation arcs (direction = causality hint) |
| **Strength indicator** | Thread thickness = correlation strength |
| **Time-aware** | Correlations update when time slider moves (correlations shift over time) |

---

<a name="graph-playground"></a>

## 12. Graph Playground Page

### 9.1 Specification

Separate route (`/graph`) with its own React page. Not inside the 3D city.

### 9.2 Graph Construction

```python
# In Databricks/Colab:
correlation_matrix = daily_returns.corr()  # 500x500 Pearson correlation

# Export edges above threshold
edges = []
for i in range(500):
    for j in range(i+1, 500):
        if abs(correlation_matrix.iloc[i, j]) > threshold:
            edges.append({
                'source': tickers[i],
                'target': tickers[j],
                'weight': correlation_matrix.iloc[i, j]
            })
```

### 9.3 Frontend Implementation

```typescript
// Options:
// A) react-force-graph-2d (easy, performant for 500 nodes)
// B) react-force-graph-3d (Three.js-based, matches project aesthetic)
// C) Custom Three.js force simulation (most control, most work)

// Recommendation: react-force-graph-3d for candy-themed 3D graph

interface GraphNode {
    id: string;           // ticker
    sector: string;
    goldenScore: number;
    isPlatinum: boolean;
    size: number;         // market cap mapped
    color: string;        // sector or ticket tier color
}

interface GraphEdge {
    source: string;
    target: string;
    weight: number;       // correlation coefficient
}
```

### 9.4 Features

| Feature | Implementation |
|---------|---------------|
| Sector clustering | Force simulation with sector-based grouping force |
| Threshold slider | Filter edges in real-time, re-layout |
| Regime toggle | Swap correlation matrix (e.g., high-vol vs low-vol periods) |
| Shock propagation | Click node -> animate cascade through edges, attenuating by (1 - correlation) |
| Golden Ticket highlight | Node glow/size by golden_score, Platinum nodes pulsate |
| Drag & zoom | Built into react-force-graph |

### 9.5 Shock Propagation Model

```python
def simulate_shock(source_ticker, shock_magnitude, correlation_matrix, decay=0.7):
    """
    BFS propagation through correlation graph.
    Each hop: impact = parent_impact * correlation(parent, child) * decay
    """
    impacts = {source_ticker: shock_magnitude}
    queue = [(source_ticker, shock_magnitude)]
    visited = {source_ticker}

    while queue:
        current, current_impact = queue.pop(0)
        for neighbor in get_neighbors(current, threshold):
            if neighbor not in visited:
                corr = correlation_matrix[current][neighbor]
                neighbor_impact = current_impact * corr * decay
                if abs(neighbor_impact) > 0.001:  # significance threshold
                    impacts[neighbor] = neighbor_impact
                    queue.append((neighbor, neighbor_impact))
                    visited.add(neighbor)

    return impacts
```

---

<a name="api-schema"></a>

## 10. API Schema

### 10.1 Main Endpoint: `GET /api/stocks`

```json
{
  "generated_at": "2025-01-15T00:00:00Z",
  "regime": "low_volatility",
  "stocks": [
    {
      "ticker": "AAPL",
      "company": "Apple Inc.",
      "sector": "Technology",
      "market_cap_rank": 1,
      "golden_score": 3,
      "ticket_levels": {
        "dip_ticket": true,
        "shock_ticket": true,
        "asymmetry_ticket": true,
        "dislocation_ticket": false,
        "convexity_ticket": false
      },
      "is_platinum": false,
      "rarity_percentile": 0.87,
      "direction_bias": {
        "buy": 0.45,
        "call": 0.30,
        "put": 0.15,
        "short": 0.10
      },
      "forward_return_distribution": {
        "p5": -0.08,
        "p25": -0.02,
        "median": 0.03,
        "p75": 0.09,
        "p95": 0.22,
        "skew": 0.85
      },
      "drawdown_current": -0.12,
      "volume_percentile": 0.92,
      "volatility_percentile": 0.78
    }
  ]
}
```

### 10.2 Graph Endpoint: `GET /api/correlations`

```json
{
  "threshold": 0.5,
  "regime": "all",
  "nodes": [
    { "id": "AAPL", "sector": "Technology", "golden_score": 3 }
  ],
  "edges": [
    { "source": "AAPL", "target": "MSFT", "weight": 0.72 }
  ]
}
```

### 10.3 Static vs Dynamic

**Recommended for MVP:** Pre-compute everything in Databricks/Colab, export as static JSON, serve from Vercel/CDN. No live API server needed.

**If dynamic is needed later:** FastAPI server with:

- `/api/stocks?date=2024-01-15` — historical Golden Ticket state
- `/api/correlations?threshold=0.5&regime=high_vol` — filtered graph
- `/api/stock/{ticker}` — detailed single-stock data

---

<a name="performance"></a>

## 11. Performance Optimization Strategy — 500,000 Agents

### 11.1 Why 500,000 Agents Requires WebGPU

Rendering and simulating 500,000 agents at 60fps is **impossible with CPU-only** JavaScript. The solution: **WebGPU compute shaders** run the entire simulation on the GPU.

```
CPU (JavaScript):      ~5,000 agents max at 60fps
WebGL2 (instancing):   ~50,000 agents (render only, no physics)
WebGPU (compute):      ~500,000+ agents with FULL physics at 60fps ✅
```

### 11.2 WebGPU Compute Pipeline Architecture

```
FRAME PIPELINE (16.67ms budget):

  GPU COMPUTE PASS (parallel across all 500K agents):
  ┌──────────────────────────────────────────────────┐
  │  1. Spatial Hash Build          (~0.5ms)         │
  │     - Each agent writes to GPU grid buffer       │
  │     - Atomic operations for cell insertion        │
  │                                                    │
  │  2. Agent AI + Physics          (~4ms)            │
  │     - Read neighbor list from spatial grid        │
  │     - Compute all forces (goal, collision, grab,  │
  │       throw, door_fight, turbulence)              │
  │     - Update velocity + position                  │
  │     - Handle state transitions                    │
  │                                                    │
  │  3. Instance Matrix Write       (~1ms)            │
  │     - Write 4x4 transform matrix per agent        │
  │     - Write per-instance color/state attributes    │
  └──────────────────────────────────────────────────┘

  GPU RENDER PASS:
  ┌──────────────────────────────────────────────────┐
  │  4. Draw 500 stores (InstancedMesh)   (~2ms)     │
  │  5. Draw 500K agents (InstancedMesh)  (~3ms)     │
  │  6. Draw candy canes (InstancedMesh)  (~1ms)     │
  │  7. Draw particles (GPU particles)    (~1ms)     │
  │  8. Post-processing (bloom, vignette) (~1ms)     │
  └──────────────────────────────────────────────────┘

  CPU (JavaScript):
  ┌──────────────────────────────────────────────────┐
  │  9. UI overlays (React)               (~2ms)     │
  │  10. Camera controls                  (~0.5ms)   │
  │  11. Gemini API calls (async, non-blocking)      │
  └──────────────────────────────────────────────────┘

  TOTAL: ~16ms = 60fps ✅
```

### 11.3 GPU Buffer Layout

```wgsl
// WebGPU Storage Buffer for 500K agents
struct Agent {
    position: vec3<f32>,
    velocity: vec3<f32>,
    target_position: vec3<f32>,
    state: u32,           // 0=analyzing, 1=rushing, 2=door_fighting, 3=inside, 4=exiting, 5=throwing
    target_store: u32,
    urgency: f32,
    mass: f32,
    radius: f32,
    grab_target: i32,     // -1 = not grabbing, else agent index
    stagger_timer: f32,
    throw_cooldown: f32,
    color: vec4<f32>,     // per-instance color
    candy_size: f32,      // 0 = no candy, 1-4 = small to king_size
};

@group(0) @binding(0) var<storage, read_write> agents: array<Agent>;
@group(0) @binding(1) var<storage, read_write> spatial_grid: array<u32>;
@group(0) @binding(2) var<uniform> params: SimParams;

@compute @workgroup_size(256)
fn simulate(@builtin(global_invocation_id) id: vec3<u32>) {
    let idx = id.x;
    if (idx >= params.agent_count) { return; }

    var agent = agents[idx];
    // ... full physics simulation per agent
    // All 500K agents simulated in parallel on GPU
    agents[idx] = agent;
}
```

### 11.4 Memory Budget

```
500,000 agents × 128 bytes/agent = 64 MB GPU storage buffer
500,000 agents × 64 bytes/matrix = 32 MB instance matrix buffer
Spatial grid (1024×1024 cells × 32 entries) = 128 MB
Stores + candy canes + particles = ~20 MB
Total GPU memory: ~244 MB (well within modern GPU limits of 4-8GB)
```

### 11.5 Fallback Strategy (WebGL2 / No WebGPU)

```
IF WebGPU not available:
  - Reduce to 50,000 agents (instanced rendering only)
  - CPU simulation with Web Workers (4 workers, 12.5K each)
  - Simplified physics (no grab/throw, basic collision only)
  - LOD agents: only simulate nearest 10K with full physics
  - Show warning: "For full 500K experience, use Chrome 113+"
```

### 11.6 Scaling Levers

If performance drops below 60fps on target hardware:

1. Reduce visible agent count (LOD: distant agents → point sprites)
2. Increase spatial grid cell size (fewer neighbor checks)
3. Reduce physics fidelity (skip grab/throw for distant agents)
4. Lower particle counts for Platinum stores
5. Batch Gemini API calls more aggressively (fewer decisions/sec)

---

<a name="candy-theming"></a>

## 12. Candy Theming Specification

### 12.1 Color Palette

| Element | Color | Hex | Candy Reference |
|---------|-------|-----|-----------------|
| **Tier I -- Dip** | Sour Green | `#7FFF00` | Sour apple candy |
| **Tier II -- Shock** | Electric Blue | `#00BFFF` | Blue raspberry jawbreaker |
| **Tier III -- Asymmetry** | Fortune Gold | `#FFD700` | Golden fortune cookie |
| **Tier IV -- Dislocation** | Taffy Pink | `#FF69B4` | Saltwater taffy |
| **Tier V -- Convexity** | Gummy Red | `#FF4500` | Red gummy bear |
| **Platinum** | Wonka Gold | `#DAA520` + animated | Wonka golden ticket |
| **No Ticket** | Vanilla White | `#F5F5DC` | Plain vanilla |
| **Background/Sky** | Cotton Candy Gradient | `#FFB6C1` -> `#9370DB` | Cotton candy sunset |
| **Ground** | Chocolate Brown | `#3E2723` | Chocolate floor |
| **Roads** | Candy Stripe | `#FF0000` / `#FFFFFF` | Candy cane roads |

### 12.2 Sector District Themes

| Sector | Candy District Name | Visual Style |
|--------|-------------------|-------------|
| Technology | Pixel Candy Arcade | Neon signs, LED candy, bright blues/greens |
| Healthcare | Medicine Drop Lane | Apothecary jars, pastel colors, clean lines |
| Financials | Chocolate Coin Plaza | Gold coins, rich browns, brass fixtures |
| Consumer Disc | Candy Bar Boulevard | Colorful wrappers, variety, bright displays |
| Communication | Bubblegum Row | Pink/purple bubbles, round shapes |
| Industrials | Gumball Factory | Mechanical gumball machines, gears |
| Consumer Staples | Sugar & Spice Market | Warm tones, cinnamon/caramel colors |
| Energy | Rock Candy Refinery | Crystalline structures, bold colors |
| Utilities | Licorice Lane | Dark reds/blacks, twisted shapes |
| Real Estate | Gingerbread Heights | Gingerbread house architecture |
| Materials | Caramel Quarry | Amber/caramel tones, raw candy shapes |

### 12.3 Crowd Agent Styles

**Character Design:** AI agents in **professional business attire** — NOT candy characters

- **Male agents:** Dark suits, ties, briefcases — running animations, determined posture
- **Female agents:** Professional blazers, pencil skirts or pantsuits — equally aggressive
- **Color accent:** Tie/scarf/pocket square color matches the ticket tier of their target store
- **Size:** Uniform body size (instanced mesh constraint)
- **Exiting agents:** Carry visible candy above their head — candy color matches store ticker, size = profit

### 12.4 Platinum Chaos Effects (The Candy Apocalypse)

When a store reaches Platinum level, **all hell breaks loose** — visually and with agent behavior:

**Visual Chaos:**

1. **Sprinkle Storm:** GPU particle system rains rainbow sprinkles in a radius around the store
2. **Chocolate Flood:** Ground plane near store gets a dark brown animated wave shader
3. **Candy Explosion:** Burst of hard candy projectiles (instanced meshes, ballistic trajectory)
4. **Store Transformation:** Facade animates — grows larger, candy cane pillars extend, neon sign flashes

**Agent Chaos (THE REAL CHAOS):**
5. **Mass stampede:** ALL agents in the vicinity sprint toward the platinum store at max urgency
6. **Door pileup:** 50+ agents physically jam at the entrance, shoving, grabbing, throwing each other
7. **Body pile:** Agents literally climb over each other at the door (stacked collision bodies)
8. **Thrown agents:** Aggressive agents grab and throw blockers sideways, causing chain-reaction knockdowns
9. **Scattered casualties:** Thrown agents ragdoll across the street, bumping into uninvolved agents
10. **Sound cue:** Cash register "ka-ching" + crowd roar + impact thuds

---

<a name="ai-agents"></a>

## 7. AI Agent Intelligence System — Gemini-Powered Autonomous Traders

### 7.1 Core Concept

Every "person" in Golden City is an **autonomous AI agent** running on **Google Gemini API** (newest model available, e.g., Gemini 2.0 Flash or Gemini 2.5 Pro). Each agent independently:

1. **Reads the Golden Ticket model output** — understands which stocks have active tickets
2. **Reads current financial news** — via news APIs (NewsAPI, Alpha Vantage news, etc.)
3. **Makes a trading decision** — picks a target store and decides BUY/SHORT/CALL/PUT
4. **Races to the store** — physically runs through the city, competing with other agents
5. **Fights at the door** — shoves, grabs, throws other agents to get in first
6. **Collects candy profit** — exits the store carrying candy representing profit

### 7.2 Rust/WASM Low-Latency Data Processing Layer

All performance-critical data processing runs in **Rust compiled to WebAssembly**. This avoids JavaScript GC pauses and gives sub-millisecond parsing for incoming market data, which feeds directly into the GPU simulation pipeline.

```rust
// Core Rust/WASM modules (compiled with wasm-pack, target wasm32-unknown-unknown)

/// MarketDataParser — parses Alpaca WebSocket JSON in <0.1ms per message
/// Avoids serde_json overhead via zero-copy simd-json for hot path
pub struct MarketDataParser {
    buffer: Vec<u8>,               // reusable parse buffer, no alloc per msg
    symbol_index: FxHashMap<u32, u16>,  // ticker hash -> internal ID (0-499)
}

impl MarketDataParser {
    /// Returns parsed quote directly into SharedArrayBuffer visible to GPU pipeline
    pub fn parse_quote(&mut self, raw: &[u8]) -> Result<ParsedQuote, ParseError> {
        // simd-json zero-copy parse -> extract price, volume, timestamp
        // Write directly to mapped GPU staging buffer via wasm_bindgen
    }
}

/// OrderBookEngine — maintains live bid/ask for all 500 tickers
/// Updates in <0.05ms per tick, O(1) spread lookup
pub struct OrderBookEngine {
    books: [CompactBook; 500],     // fixed array, no heap alloc
}

/// PortfolioLedger — tracks profit for 500K agents
/// Fenwick tree for O(log n) rank queries, O(1) profit update
pub struct PortfolioLedger {
    profits: Vec<f32>,             // 500K entries, 2MB
    rank_tree: FenwickTree,        // O(log 500K) = ~19 ops per rank query
}

impl PortfolioLedger {
    pub fn update_profit(&mut self, agent_id: u32, delta: f32) { /* O(log n) */ }
    pub fn get_rank(&self, agent_id: u32) -> u32 { /* O(log n) */ }
    pub fn top_k(&self, k: usize) -> Vec<(u32, f32)> { /* O(k log n) */ }
}

/// CorrelationEngine — rolling 30-day Pearson correlation, SIMD-accelerated
/// Full 500x500 matrix recompute in <5ms using packed f32x4 SIMD
pub struct CorrelationEngine {
    returns: [[f32; 30]; 500],     // rolling window per ticker
    matrix: Vec<f32>,              // 500*500 = 250K entries, 1MB
}

/// SignalRouter — bridges Rust/WASM to GPU via SharedArrayBuffer
/// Writes model updates directly to GPU staging buffers, zero-copy
pub struct SignalRouter {
    staging_buffer: *mut f32,      // ptr into SharedArrayBuffer
    dirty_flags: BitVec,           // which tickers have new data
}
```

**Why Rust/WASM instead of JavaScript for data processing:**

| Concern | JavaScript | Rust/WASM |
|---------|-----------|----------|
| JSON parse (market tick) | ~2ms (GC jank risk) | <0.1ms (simd-json, zero-copy) |
| 500K profit rank query | ~15ms (sort-based) | <0.02ms (Fenwick tree, O(log n)) |
| 500x500 correlation matrix | ~50ms (nested loops) | <5ms (SIMD f32x4 packed) |
| GC pauses during animation | Yes (unpredictable) | None (linear memory, no GC) |
| Memory layout control | No (V8 decides) | Yes (repr(C), cache-friendly) |

**Build pipeline:** `wasm-pack build --target web` produces a `.wasm` binary (~200KB gzipped) loaded once at startup. All Rust modules communicate with JS/GPU via `SharedArrayBuffer` — zero serialization overhead.

### 7.3 Gemini API Integration

```typescript
// Each agent calls Gemini API to decide where to go
// Using $300/student Google credits pool

import { GoogleGenerativeAI } from '@google/generative-ai';
import { portfolioLedger, signalRouter } from './rust-wasm-bridge';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

interface AgentDecision {
    targetTicker: string;
    lane: 'BUY' | 'SHORT' | 'CALL' | 'PUT';
    confidence: number;      // 0-1
    reasoning: string;       // 1-2 sentence explanation
    urgency: number;         // 1.0 = normal walk, 3.0+ = sprint
}

// Batched decision: 1 API call decides for 1,000 agents at once
// Rust/WASM pre-aggregates market snapshot + ranks before each batch
async function getBatchedDecisions(
    agentBatch: string[],          // 1,000 agent IDs
    goldenTicketData: StockData[],
    recentNews: NewsItem[]
): Promise<AgentDecision[]> {
    // Rust/WASM provides pre-computed ranks in <0.02ms
    const ranks = agentBatch.map(id => portfolioLedger.get_rank(parseInt(id)));

    const prompt = `You are the decision engine for ${agentBatch.length} AI trading agents.

CURRENT MARKET DATA:
${goldenTicketData.map(s => 
    `${s.ticker}: Score ${s.golden_score}/5, ` +
    `BUY ${s.direction_bias.buy}% CALL ${s.direction_bias.call}% ` +
    `PUT ${s.direction_bias.put}% SHORT ${s.direction_bias.short}%`
).join('\n')}

RECENT NEWS:
${recentNews.map(n => `- ${n.headline} (${n.ticker})`).join('\n')}

AGENT RANKINGS (out of 500,000):
${agentBatch.map((id, i) => `Agent ${id}: rank #${ranks[i]}`).join(', ')}

For EACH agent, decide: targetTicker, lane (BUY/SHORT/CALL/PUT), confidence (0-1), urgency (1-3).
Lower-ranked agents should be MORE aggressive (higher urgency).
Respond as JSON array of ${agentBatch.length} decisions.`;

    const result = await model.generateContent(prompt);
    const decisions = JSON.parse(result.response.text());

    // Rust/WASM routes decisions to GPU staging buffer in <0.1ms
    signalRouter.push_decisions(decisions);
    return decisions;
}
```

### 7.4 Agent Decision Cycle

```
Every 45-60 seconds per agent (staggered, Rust/WASM manages timing):
  1. Rust/WASM aggregates market snapshot + agent ranks for next batch
  2. 1,000-agent batch sent to Gemini API (1 call = 1,000 decisions)
  3. Rust/WASM parses response, writes decisions to SharedArrayBuffer
  4. WebGPU compute shader reads decisions, updates agent target/urgency
  5. Agent enters 'rushing' state -> GPU physics drives sprint to store
  6. At door -> 'door_fighting' state (GPU collision + grab/throw)
  7. Inside store -> enters chosen section (BUY/SHORT/CALL/PUT)
  8. After trade (5-15s) -> Rust/WASM updates PortfolioLedger, exits with candy
  9. GPU writes new profit to agent buffer, cycle restarts
```

**Low-latency path:** Market data arrives via Alpaca WebSocket -> Rust/WASM `MarketDataParser` (sub-0.1ms) -> `SharedArrayBuffer` -> WebGPU staging buffer -> compute shader reads next frame. Total latency: **< 1ms from WebSocket to GPU**.

### 7.5 Profit Competition & Leaderboard

| Feature | Description |
|---------|-------------|
| **Profit tracking** | Rust/WASM `PortfolioLedger` — Fenwick tree, O(log n) rank, O(1) update |
| **Live leaderboard** | Top 10 agents via `top_k()` in <0.05ms, displayed as floating UI overlay |
| **Agent rankings affect behavior** | Low-ranked agents become more aggressive (higher urgency) |
| **Candy size = profit** | King-size candy = big win, small candy = modest gain |
| **Visible competition** | You can see agents with the most candy (biggest hauls) |

### 7.6 API Rate Management

```python
# Batched architecture with Rust/WASM pre-aggregation:
# 500,000 agents / 1,000 per batch = 500 Gemini API calls per cycle
# Each cycle = 60 seconds, staggered across the window
# Rust/WASM pre-computes ranks + market snapshot for each batch in <1ms
#
# Gemini 2.0 Flash: ~$0.075/1M input, ~$0.30/1M output
# Per batch (1,000 agents): ~5,000 tokens in, ~4,000 tokens out
# Cost per cycle: ~$0.19 input + ~$0.60 output = ~$0.79/minute
# $300/student x 4 students = $1,200 budget
# $1,200 / $0.79/min = ~1,519 minutes = ~25 hours
# Hacklytics 36-hour hackathon with sleep breaks: within budget
#
# Optimization: cache decisions for agents near identical market state
# Rust/WASM deduplication reduces unique batches by ~40%
# Effective cost: ~$0.47/minute -> ~42 hours -> comfortably within budget

RATE_LIMIT_STRATEGY = {
    "max_concurrent_calls": 50,        # Gemini rate limit friendly
    "decision_interval_seconds": 60,   # each agent decides every 60s
    "stagger_window_seconds": 60,      # spread calls across window
    "batch_size": 1000,                # 1,000 agents per API call
    "rust_dedup_enabled": True,        # Rust/WASM deduplicates similar contexts
    "rust_precompute_ms": 1,           # Rust aggregation budget per batch
}
```

---

<a name="sector-filtering"></a>

## 13. Sector Filtering System

### 13.1 Core Feature

Users can **filter the city by sector** to isolate specific industry groups. When a sector filter is active:

- Only buildings in that sector are fully visible and active
- Other sectors fade to 25% opacity (ghosted)
- Agents only show for the active sector
- Candy cane connections only show for the active sector
- Camera auto-focuses on the selected sector district

### 13.2 Sector Filter UI

```typescript
// Geist UI-powered sector filter panel
const SECTORS = [
    { name: 'All Sectors', icon: '🏙️', color: '#FFFFFF' },
    { name: 'Technology', icon: '💻', district: 'Pixel Candy Arcade', color: '#00BFFF' },
    { name: 'Healthcare', icon: '💊', district: 'Medicine Drop Lane', color: '#00FF7F' },
    { name: 'Financials', icon: '🏦', district: 'Chocolate Coin Plaza', color: '#FFD700' },
    { name: 'Consumer Disc', icon: '🛍️', district: 'Candy Bar Boulevard', color: '#FF69B4' },
    { name: 'Communication', icon: '📡', district: 'Bubblegum Row', color: '#9370DB' },
    { name: 'Industrials', icon: '🏭', district: 'Gumball Factory', color: '#808080' },
    { name: 'Consumer Staples', icon: '🍎', district: 'Sugar & Spice Market', color: '#FF6347' },
    { name: 'Energy', icon: '⚡', district: 'Rock Candy Refinery', color: '#FF8C00' },
    { name: 'Utilities', icon: '🔌', district: 'Licorice Lane', color: '#8B0000' },
    { name: 'Real Estate', icon: '🏠', district: 'Gingerbread Heights', color: '#DEB887' },
    { name: 'Materials', icon: '⛏️', district: 'Caramel Quarry', color: '#DAA520' },
];

// Filter panel: floating left sidebar with sector buttons
// Click sector -> city animates to show only that sector
// Click "All Sectors" -> full city view returns
```

### 13.3 Visual Transition on Filter

```
When user selects a sector:
  1. Non-selected buildings animate to 25% opacity (300ms GSAP tween)
  2. Camera smoothly pans to center the active sector district (800ms)
  3. Non-sector agents fade out and stop simulating
  4. Candy cane connections outside sector fade out
  5. Sector district label glows and enlarges
  6. Statistics panel updates to show sector-only metrics
```

---

<a name="integrations"></a>

## 20. Integration & Resources — Alpaca, Webull, Gemini, Claude, Copilot

### 20.1 Broker Integrations

| Broker | Status | Purpose | API |
|--------|--------|---------|-----|
| **Alpaca** | ✅ Live | Paper trading + live market data | Alpaca Trade API v2 |
| **Webull** | 🔄 In Progress | Additional broker integration | Webull API (pending access) |

### 20.2 AI & Development Resources

| Resource | Availability | Purpose |
|----------|-------------|---------|
| **Gemini API** | ✅ Active ($300/student credits) | Powers ALL AI agents (newest model: Gemini 2.0 Flash / 2.5 Pro) |
| **Claude Max** | ✅ Active (1 account) | Code generation, architecture review, complex reasoning |
| **GitHub Copilot** | ✅ Active (4 accounts) | Real-time code completion for all 4 team members |
| **Google Cloud Credits** | ✅ $300/student | Gemini API calls, Cloud Run hosting, BigQuery if needed |

### 20.3 Alpaca Integration

```typescript
// Alpaca connection for live market data + paper trading
import Alpaca from '@alpacamarkets/alpaca-trade-api';

const alpaca = new Alpaca({
    keyId: process.env.ALPACA_API_KEY,
    secretKey: process.env.ALPACA_SECRET_KEY,
    paper: true,  // paper trading for hackathon
});

// Feed live price data to agents
async function getLiveMarketData(): Promise<StockSnapshot[]> {
    const snapshots = await alpaca.getSnapshots(TICKER_LIST);
    return snapshots;
}

// Agents can execute paper trades
async function executePaperTrade(
    agentId: string, ticker: string, side: 'buy' | 'sell', qty: number
) {
    return alpaca.createOrder({
        symbol: ticker,
        qty: qty,
        side: side,
        type: 'market',
        time_in_force: 'gtc',
    });
}
```

---

<a name="demo-pipeline"></a>

## 21. Demo Pipeline — Replit Animation + Web App Demo + IRL Video

### 21.1 Three-Part Demo Strategy

The Hacklytics 2026 demo combines three video sources:

| Source | Content | Tool |
|--------|---------|------|
| **Replit Animation** | Cinematic candy city visuals, smooth transitions, polished animations | Replit's animation capabilities |
| **Web App Screen Recording** | Live demo of the actual running web app with real data | OBS / screen capture |
| **IRL Video** | Team presenting, explaining, real reactions | Phone/camera footage |

### 21.2 Replit Animation — Cinematic Sequences

**Purpose:** Use Replit to create polished, candy-themed cinematic animations that go beyond what the live app can show.

| Animation | Description |
|-----------|-------------|
| **City aerial flyover** | Sweeping camera over the candy city with buildings loading in |
| **Agent stampede** | Close-up of suited agents rushing, bumping, fighting at doors |
| **Platinum chaos** | Slow-motion of agents piling at a platinum store |
| **Candy cane connections** | Beautiful visualization of candy canes interlocking |
| **Store interior dive** | Camera zooming into a store, revealing 4 sections |
| **Candy reward** | Agent exits store, receives glowing candy, walks away |

### 21.3 Web App Demo Recording

```
Live app features to demo:
  1. Full city view with 500 candy buildings
  2. Agents in suits running between stores
  3. Click to enter store -> 4 sections view
  4. Sector filtering -> isolate tech sector
  5. Candy cane correlations appearing between stores
  6. Time slider scrubbing through 5 years
  7. Platinum store chaos moment
  8. Agent leaderboard showing profit competition
  9. Alpaca integration pulling live data
```

### 21.4 IRL Video Segments

```
Real footage to capture:
  1. Team at Hacklytics venue, coding together
  2. Team explaining the concept (30-second pitch)
  3. Judges reacting to the demo
  4. "Behind the scenes" of the 36-hour build
  5. Team celebrating a working demo
```

### 21.5 Final Edit Assembly

```
Final demo video structure (3-4 minutes):
  [0:00-0:15] Replit Animation: cinematic city intro
  [0:15-0:30] IRL: team intro + pitch
  [0:30-1:30] Web App: live demo walkthrough
  [1:30-2:00] Replit Animation: agent chaos close-ups
  [2:00-2:30] Web App: store interior + sector filtering
  [2:30-3:00] Replit Animation: platinum chaos + candy canes
  [3:00-3:15] Web App: leaderboard + Alpaca integration
  [3:15-3:30] IRL: team wrap-up + Hacklytics 2026 branding
  
Edit in: DaVinci Resolve / CapCut
Transitions: candy wrapper peels, sprinkle bursts, chocolate drip dissolves
Music: whimsical orchestral — playful but sophisticated (candy noir)
```

---

### 16.1 Replit Animation — Interactive Frontend Animations

**Purpose:** Use Replit's animation capabilities to rapidly prototype and deploy smooth, interactive animations for the Golden City frontend.

#### What Replit Animation Handles

| Animation | Description | Implementation |
|-----------|-------------|----------------|
| **City load-in** | Stores rise from the ground plane sequentially by sector | CSS keyframes + GSAP timeline |
| **Crowd spawning** | Agents appear in waves, spreading outward from city center | Staggered spawn with easing |
| **Time slider transitions** | Smooth crowd density morphing when date changes | GSAP morphing + Three.js lerp |
| **Store hover effects** | Subtle lift + glow pulse on mouseover | CSS transform + Three.js emissive |
| **Correlation thread animation** | Threads draw themselves from source to target | SVG path animation / Three.js line morph |
| **Platinum store chaos** | Particle burst + screen shake + store scale pulse | Replit-prototyped, ported to Three.js |
| **Panel slide-in/out** | Geist UI panels slide from edges smoothly | Framer Motion or GSAP |
| **Graph node transitions** | Smooth force layout transitions when threshold changes | D3 transition + Replit preview |

#### Replit Development Workflow

```
1. Prototype animations in Replit (instant preview, hot reload)
2. Test with mock data (sample 20 stocks)
3. Export animation configs as JSON/JS modules
4. Import into main Three.js + React project
5. Fine-tune timing and easing in production build
```

#### Animation Config Format

```typescript
// Animations are defined as config objects, prototyped in Replit
interface AnimationConfig {
  name: string;
  duration: number;        // seconds
  easing: string;          // "easeInOutCubic", "spring", "elastic"
  stagger: number;         // delay between elements (seconds)
  properties: {
    from: Record<string, number>;
    to: Record<string, number>;
  };
}

const CITY_LOAD_IN: AnimationConfig = {
  name: "cityLoadIn",
  duration: 2.5,
  easing: "easeOutExpo",
  stagger: 0.02,  // 20ms between each store
  properties: {
    from: { scaleY: 0, opacity: 0 },
    to: { scaleY: 1, opacity: 1 },
  },
};

const CROWD_SPAWN: AnimationConfig = {
  name: "crowdSpawn",
  duration: 1.5,
  easing: "easeOutCirc",
  stagger: 0.005,
  properties: {
    from: { scale: 0, y: 2 },
    to: { scale: 1, y: 0 },
  },
};
```

### 16.2 Rork Max — Candy-Themed Demo Video for Hacklytics 2026

**Purpose:** Use Rork Max to generate a polished, candy-themed cinematic demo of the Golden City for **Hacklytics 2026** presentation. The entire demo drips with candy-lism — candy visuals, candy language, candy transitions.

#### Demo Theme: "The Candy Factory Tour"

```
The demo is framed as a TOUR of a candy factory/marketplace.
The narrator is a "Candy City tour guide" walking judges through
the Golden City like it's a real candy district.

Candy transitions between scenes:
  - Candy wrapper peel reveals (scene transitions)
  - Lollipop wipe (horizontal scene change)
  - Sprinkle burst (on key moments)
  - Chocolate drip dissolve (fade transitions)
  - Golden ticket flip (section reveals)
```

#### Demo Script — Hacklytics 2026 (3-4 minutes)

```
RORK MAX DEMO: "Welcome to Candy City" — Hacklytics 2026

[0:00 - 0:20]  🍬 SCENE 1: THE CANDY FACTORY GATES
  - Dark screen. A golden ticket slowly rotates into frame.
  - Text appears: "SweetReturns presents..."
  - The golden ticket unfolds → reveals the Golden City from above
  - Camera descends through cotton-candy clouds into the isometric city
  - Candy stores load in one by one — each rising with a little pop
  - Brand-colored candy icons materialize above each store
  - Subtle candy-themed ambient music (whimsical, not cheesy)
  - Title card: "GOLDEN CITY" with candy-stripe text
  - Subtitle: "Hacklytics 2026 — Team SweetReturns"

  RORK MAX PROMPT:
  "Cinematic aerial descent through pastel clouds into a minimal
  isometric 3D city made of clean white buildings. Each building
  is an open-topped box with a company name (NVDA, Apple, Tesla,
  Pfizer) and a colorful candy shape floating above it — green
  candy bar over Nvidia, silver mint over Apple, red wrapper over
  Tesla, blue jelly bean over Pfizer. Small stylized people walk
  between the stores. The city is structured on a grid, warm
  lighting, soft shadows. As the camera descends, buildings pop
  up one by one. Style: clean architectural model meets candy
  shop. Golden ticket text 'GOLDEN CITY' fades in."

[0:20 - 0:50]  🍫 SCENE 2: THE CANDY DISTRICTS
  - Camera glides at 45-degree isometric angle across the city
  - Pass through "Pixel Candy Arcade" (tech sector) — NVDA, AAPL, MSFT
    stores buzzing with crowds. Candy bars and pixel cubes glow bright.
  - Pan to "Chocolate Coin Plaza" (financials) — JPM, GS stores with
    gold chocolate coins floating above. Moderate crowd.
  - Pan to "Medicine Drop Lane" (healthcare) — PFE, JNJ with blue
    jelly bean icons. Sparse crowd.
  - Callout candy card pops up: "Crowd density = trading opportunity
    strength. More people = more signal."
  - Transition: chocolate drip dissolve

  RORK MAX PROMPT:
  "Smooth isometric tracking shot across a minimal 3D candy city.
  White buildings with company names. First area: tech buildings
  packed with tiny people, bright green and blue candy icons
  glowing. Second area: finance buildings with gold candy coins,
  moderate crowd. Third area: healthcare buildings with blue
  capsule candies, sparse crowd. Clean, minimal aesthetic. Warm
  light. Text overlay: 'Crowd density = trading opportunity.'
  Style: architectural model, Willy Wonka meets data visualization."

[0:50 - 1:25]  ⏰ SCENE 3: THE TIME MACHINE (Time Slider)
  - Camera pulls back to show the full city + timeline at bottom
  - A candy-striped timeline slider appears at the bottom
  - An animated hand grabs the slider and drags it LEFT (back in time)
  - Date rewinds: 2026 → 2024 → 2022 → 2021
  - Crowds visibly shift — some stores empty out, others fill up
  - The slider pauses on 2023-07 — NVDA store suddenly SWELLS with
    people (AI hype moment). Candy icon above NVDA pulses bright green.
  - Earnings markers flash on the timeline like candy drops: 🔴🔴🔴
  - Slider drags RIGHT past present into FUTURE (2026-06)
  - Future stores become slightly translucent (prediction mode)
  - A "crystal candy ball" indicator appears showing confidence %
  - Callout: "Scrub 5 years of history. Predict the future from
    earnings & dividends."
  - Transition: lollipop wipe

  RORK MAX PROMPT:
  "A 3D isometric candy city with a timeline slider at the bottom
  of the screen. The slider has candy-stripe decoration. A cursor
  drags the slider backward through time — crowds in the city
  shrink and grow as dates change. One building (labeled NVDA)
  suddenly gets swarmed with people when the slider reaches mid-2023.
  Then the slider moves past 'TODAY' into the future — buildings
  become slightly see-through. A small crystal ball icon appears
  showing prediction confidence. Smooth transitions between dates.
  Clean minimal aesthetic with candy accents."

[1:25 - 2:00]  🏪 SCENE 4: INSIDE THE CANDY SHOP (Store Deep Dive)
  - Click on Apple store → camera zooms IN through the open top
  - Interior reveals 4 candy-themed lanes:
    🟢 BUY lane (green candy) — 45% of crowd flowing here
    🔵 CALL lane (blue candy) — 30%
    🟡 PUT lane (yellow candy) — 15%
    🔴 SHORT lane (red candy) — 10%
  - Each lane has tiny people walking through carrying matching candy
  - A Geist UI card slides in showing:
    - Forward return histogram (candy-colored bars)
    - "Golden Score: ★★★☆☆ (3/5)"
    - Tickets held: I ✓, II ✓, III ✓, IV ✗, V ✗
  - The candy icon (silver wrapped mint for AAPL) pulses above
  - Callout: "Inside every shop: see BUY/CALL/PUT/SHORT traffic,
    forward return distribution, and Golden Ticket breakdown."
  - Transition: candy wrapper peel

  RORK MAX PROMPT:
  "Camera zooms into an open-topped white building labeled 'Apple'
  in a 3D isometric city. Inside the building, four colored lanes
  are visible — green, blue, yellow, red — each with tiny people
  walking through carrying matching candy pieces. A sleek dark UI
  panel slides in from the right showing a histogram with candy-
  colored bars and star ratings. A silver candy icon floats and
  pulses above the building. Clean, modern, data-meets-candy
  aesthetic."

[2:00 - 2:30]  🕸️ SCENE 5: THE CANDY WEB (Geist UI Correlations)
  - Camera pulls back to city overview
  - Click on NVDA store → glowing candy-colored THREADS arc outward
  - Green threads = positive correlation (move together)
  - Red threads = inverse correlation (move opposite)
  - Threads glow and pulse with tiny candy particles flowing along them
  - Threads connect NVDA → AAPL, NVDA → MSFT, NVDA → AMD
  - A Geist panel slides in showing:
    "NVDA Connections — Flavor Links"
    "+92% MSFT  ═══════"
    "+87% AMD   ══════"
    "+76% AAPL  ════"
    "-41% XOM   ════ (inverse)"
  - Drag the correlation threshold slider → threads appear/disappear
  - Callout: "See how stocks intertwine. Flavor Links show which
    companies move together — and which move apart."
  - Transition: sprinkle burst

  RORK MAX PROMPT:
  "In a clean isometric 3D candy city, a user clicks on a building
  labeled 'NVDA'. Glowing green curved lines (like candy strings)
  arc from NVDA to nearby buildings, connecting them above the city.
  One red line connects to a distant building. Tiny glowing particles
  flow along the lines. A dark panel slides in from the right with
  connection percentages and a slider control. The city is minimal
  and white, the threads are vibrant and candy-colored. Style:
  architectural model meets Willy Wonka data viz."

[2:30 - 3:00]  🌐 SCENE 6: THE FULL CANDY WEB (Graph Playground)
  - Scene transition to /graph page — full-screen D3 force graph
  - 500 candy-colored nodes (sized by market cap, colored by sector)
  - Correlation edges drawn between them
  - Nodes cluster by sector — tech cluster, finance cluster, etc.
  - Golden Ticket stores glow and pulse
  - Click on AAPL → SHOCK PROPAGATION: a wave of candy-colored
    light spreads outward through the graph, node by node
  - Affected nodes light up in sequence (the "Sugar Shock Wave")
  - Callout: "The Candy Web: 500 stocks, every correlation visible.
    Simulate how a shock to one stock ripples through the market."
  - Transition: golden ticket flip

  RORK MAX PROMPT:
  "Full-screen graph visualization with 500 colorful circular nodes
  on a dark background. Nodes are candy-colored by sector (tech=blue,
  finance=gold, health=green). Lines connect correlated nodes. The
  nodes are clustered in groups. One node gets clicked and a wave of
  golden light spreads outward through the connections, lighting up
  nodes in sequence. The effect looks like a chain reaction of
  glowing candy. Clean typography labels appear near clusters."

[3:00 - 3:20]  ⚡ SCENE 7: THE WONKA BAR (Platinum Moment)
  - Return to city view. Drag time slider to a specific date.
  - One store (TSLA) suddenly TRANSFORMS:
    - Scales up 2.5x with a satisfying pop
    - Gold tint washes over the white surface
    - Red candy icon above turns golden and PULSES
    - Sprinkle/confetti particle storm erupts
    - Crowd of agents STAMPEDES toward the store
    - Screen subtly shakes
  - A golden ticket card overlays: "🎫 PLATINUM TICKET FOUND"
  - "TSLA — All 5 Golden Tickets active. Top 2% rarity."
  - Callout: "The Wonka Bar moment. When everything aligns —
    once-in-a-cycle opportunity."
  - Transition: chocolate drip dissolve

  RORK MAX PROMPT:
  "In a minimal isometric 3D candy city, one white building suddenly
  grows 2.5x larger, turns golden, and erupts with colorful confetti
  particles. A golden ticket card appears floating above it. Hundreds
  of tiny people stampede toward the building from all directions.
  The candy icon above the store pulses brilliantly gold. The screen
  shakes slightly. Dramatic but clean — candy chaos meets financial
  data. A text overlay reads 'PLATINUM TICKET FOUND'."

[3:20 - 3:45]  🎬 SCENE 8: CLOSING — HACKLYTICS 2026
  - Camera pulls UP through cotton candy clouds
  - The city shrinks below, becoming a beautiful miniature
  - Architecture diagram fades in over the city view:
    "React + Three.js + Geist UI + D3.js + Databricks"
  - Dissolve to title card:

    ┌─────────────────────────────────────┐
    │                                     │
    │      🍬 SWEET RETURNS 🍬            │
    │         GOLDEN CITY                 │
    │                                     │
    │   "Every stock is a candy shop.     │
    │    Every crowd tells a story.       │
    │    Every ticket is an opportunity." │
    │                                     │
    │      HACKLYTICS 2026                │
    │      Built in 36 Hours              │
    │                                     │
    │      Team SweetReturns              │
    │                                     │
    └─────────────────────────────────────┘

  - Sponsor logos appear below (Databricks, etc.)
  - Final fade to black with a single golden ticket spinning

  RORK MAX PROMPT:
  "Camera rises up from an isometric candy city through pastel
  clouds. The city becomes a beautiful miniature below. Text fades
  in: 'SWEET RETURNS — GOLDEN CITY' in elegant golden typography.
  Below it: 'Hacklytics 2026 — Built in 36 Hours.' A single
  golden ticket rotates slowly in the center. Background is warm
  dark chocolate brown. Clean, cinematic, premium feel. A few
  candy icons (lollipop, wrapped mint, chocolate coin) float
  decoratively around the edges."
```

#### Candy Transition Library (for Rork Max + Video Editing)

| Transition | Description | When Used |
|-----------|-------------|-----------|
| **Candy wrapper peel** | Scene peels away like unwrapping a candy bar, revealing next scene | Between major sections |
| **Lollipop wipe** | A circular lollipop shape wipes across screen | Between related scenes |
| **Sprinkle burst** | Explosion of colorful sprinkles that clear to reveal new scene | On exciting moments |
| **Chocolate drip dissolve** | Current scene melts like chocolate, dripping away | Slow transitions |
| **Golden ticket flip** | A golden ticket flips 180 degrees, new scene on the back | Section reveals |
| **Candy cane swipe** | Diagonal candy-stripe bar slides across | Quick cuts |

#### Candy Sound Design for Demo

| Moment | Sound Effect |
|--------|-------------|
| City load-in | Gentle chime cascade (like wind chimes made of candy) |
| Store pop-up | Soft "pop" (bubble wrap / candy pop) |
| Time slider drag | Whooshy scrub sound with candy crinkle |
| Crowd surge | Rising murmur + candy rustling |
| Correlation thread appear | Magical string pluck (harp note) |
| Platinum trigger | Dramatic brass hit + sprinkle rain + crowd roar |
| Golden ticket reveal | Classic Wonka-style shimmer + choir "ahhh" |
| Scene transitions | Candy wrapper crinkle + whoosh |
| Background music | Whimsical orchestral — playful but sophisticated. NOT children's music. Think "candy noir" — a Danny Elfman-esque score that takes candy seriously. |

#### Rork Max Generation Strategy

```
1. Generate SCENE 1 (aerial) first — establish visual style
2. Use Scene 1's style as reference for all subsequent scenes
3. Generate scenes in order (1-8)
4. For each scene:
   a. Generate 2-3 variations
   b. Pick best, note what worked
   c. Refine prompt if needed
5. Generate transition clips separately
6. Assemble in DaVinci Resolve / CapCut:
   - Rork Max footage for cinematic shots
   - Actual screen recordings for UI close-ups
   - Candy transitions between scenes
   - Voiceover layered on top
   - Background music + SFX
```

#### Integration with Actual App

```
Rork Max generates the CANDY-THEMED DEMO VIDEO.
The actual app is built with:
  - React + Three.js (3D candy city)
  - Geist UI (controls, panels, typography)
  - D3.js (graph playground / candy web)
  - Replit (animation prototyping)

Demo video = Rork Max cinematic candy shots + actual screen recordings
Screen recordings = capture real app running with test data
Candy transitions = After Effects / CapCut candy transition pack
Final edit = DaVinci Resolve / CapCut

HACKLYTICS 2026 BRANDING:
  - "Hacklytics 2026" watermark in bottom-right during demo
  - Team name "SweetReturns" in opening and closing
  - Sponsor logos in closing title card
```

---

<a name="deployment"></a>

## Deployment Plan

### 13.1 Repository Structure

```
sweet-returns/
  frontend/                    # React + Three.js application
    src/
      components/
        CandyCity.tsx          # Main 3D scene
        StoreManager.tsx       # Store instancing & layout
        CrowdSimulation.tsx    # Agent physics loop
        CameraController.tsx   # Zoom & navigation
        Minimap.tsx            # 2D minimap overlay
        StoreInterior.tsx      # Interior view on click
        GraphPlayground.tsx    # Correlation graph page
        CandyParticles.tsx     # GPU particle system
      shaders/
        candyGlow.vert
        candyGlow.frag
        crowd.vert
        particles.vert / particles.frag
      data/
        stocks.json            # Pre-computed payload
      hooks/
        useStockData.ts
        useCrowdSimulation.ts
      utils/
        spatialGrid.ts
        layoutEngine.ts
      App.tsx
    public/
      assets/                  # Textures, fonts
    package.json
    vite.config.ts

  data/                        # Python data pipeline
    notebooks/
      01_eda.ipynb
      02_features.ipynb
      03_golden_tickets.ipynb
      04_correlations.ipynb
      05_export.ipynb
    databricks/
      bronze_ingestion.py
      silver_features.py
      gold_tickets.py
      export_json.py
    requirements.txt

  api/                         # Optional: FastAPI server
    main.py
    models.py
    Dockerfile

  README.md
```

### 13.2 Hosting

| Component | Host | Notes |
|-----------|------|-------|
| Frontend (React) | Vercel | Free tier, auto-deploy from Git |
| Static JSON data | Vercel (bundled) or CDN | < 5MB, can live in `/public/data/` |
| API (if dynamic) | Railway / Render / Fly.io | FastAPI, $5-7/mo |
| Databricks | Databricks Community / Workspace | Feature engineering |
| Colab | Google Colab (Free/Pro) | Prototyping |

### 13.3 CI/CD

```
Push to main -> Vercel auto-deploys frontend
Data pipeline: manual trigger in Databricks -> export JSON -> commit to repo -> redeploy
```

---

<a name="mvp-roadmap"></a>

## 14. Hacklytics 2026 — 36-Hour MVP Roadmap

### Phase 0: Setup (Hours 0-2)

- [ ] Create repo, init React + Vite + Three.js
- [ ] Download Kaggle dataset, load into Colab
- [ ] Provision Databricks workspace (or confirm access)
- [ ] Set up project structure

### Phase 1: Data Pipeline (Hours 2-8)

- [ ] Colab: EDA notebook — profile all 500 tickers, check data quality
- [ ] Colab: Feature engineering — drawdowns, percentiles, volatility, forward returns
- [ ] Colab: Golden Ticket computation — implement all 5 tiers + Platinum
- [ ] Colab: Direction bias computation
- [ ] Colab: Correlation matrix computation
- [ ] Databricks: Migrate working Colab logic to Spark jobs (Delta Lake tables)
- [ ] Export: Generate `stocks.json` and `correlations.json`

### Phase 2: 3D Candy City Foundation (Hours 6-14)

- [ ] Three.js scene setup (lights, camera, renderer, candy skybox)
- [ ] City layout engine (sector grid, store placement by candy district)
- [ ] Store InstancedMesh (500 candy shops, sized by market cap)
- [ ] Store color/glow by ticket tier (candy color palette)
- [ ] Platinum store visual differentiation (Wonka Factory style)
- [ ] OrbitControls with zoom constraints
- [ ] Chocolate ground plane with candy-stripe roads
- [ ] Candy-themed materials and glow shaders

### Phase 3: Crowd Simulation (Hours 12-20)

- [ ] Agent data structure (TypedArrays)
- [ ] Spatial hashing grid
- [ ] Goal attraction force (gummy bears running to candy shops)
- [ ] Separation force
- [ ] Basic turbulence
- [ ] Agent InstancedMesh rendering (gummy bear silhouettes)
- [ ] Density scaling by Golden Score
- [ ] Speed scaling by Golden Score
- [ ] Platinum stampede behavior (Candy Apocalypse)
- [ ] Outgoing agents with glowing candy bar meshes

### Phase 4: Navigation & Store Interiors (Hours 18-26)

- [ ] Zoom level system (Macro -> Sector -> Store -> Interior)
- [ ] Smooth camera transitions
- [ ] Minimap component (React overlay, candy district map)
- [ ] Click-to-zoom on minimap
- [ ] Store click -> interior view
- [ ] Interior lane visualization (BUY/CALL/PUT/SHORT candy lanes)
- [ ] Forward return histogram (D3/Recharts overlay)
- [ ] Ticket breakdown display
- [ ] Sector labels (candy district names via CSS2DRenderer)

### Phase 5: Graph Playground (Hours 24-30)

- [ ] Separate `/graph` route (The Candy Web)
- [ ] Load correlation data
- [ ] react-force-graph-3d setup with candy-themed nodes
- [ ] Sector clustering forces
- [ ] Threshold slider
- [ ] Node styling by Golden Score (candy glow)
- [ ] Platinum node highlighting
- [ ] Shock propagation animation (sugar shock wave)
- [ ] Regime toggle (if time allows)

### Phase 5B: Time Slider & Future Prediction (Hours 26-32)

- [ ] Time slider component (Geist UI Slider + playback controls)
- [ ] Pre-compute per-date crowd data for 5-year history
- [ ] Wire slider to update crowd density, store glow, agent count
- [ ] Smooth crowd transition animation (GSAP lerp)
- [ ] Playback mode (auto-advance through dates)
- [ ] Event markers on timeline (earnings, dividends)
- [ ] Earnings impact prediction model
- [ ] Dividend impact prediction model
- [ ] Future date ghost rendering (translucent stores for predictions)
- [ ] "Did They Do Good?" retrospective overlay for past earnings
- [ ] Confidence indicator for future predictions

### Phase 5C: Geist UI Graph System (Hours 28-32)

- [ ] Install and configure @geist-ui/core
- [ ] Stock connections panel (Geist Card overlay)
- [ ] Correlation threshold slider (Geist Slider)
- [ ] 3D correlation threads (curved arcs between stores)
- [ ] Thread particles (flowing dots along arcs)
- [ ] Hover → show top 3 connections as threads
- [ ] Click → full panel with all correlations
- [ ] Time-aware correlations (threads update with time slider)

### Phase 6: Polish, Rork Max Demo & Full Candy Theme (Hours 30-36)

- [ ] Brand-colored candy icons per company (procedural Three.js shapes)
- [ ] Candy icon assignment by sector + brand color
- [ ] All sector district naming applied
- [ ] Platinum chaos particle effects (sprinkle storms, chocolate floods)
- [ ] Replit Animation prototypes finalized and imported
- [ ] City load-in animation sequence
- [ ] Post-processing (bloom for candy glow, vignette)
- [ ] LOD system tuning
- [ ] Performance profiling & optimization
- [ ] Loading screen / candy city intro animation
- [ ] Responsive layout fixes
- [ ] Final data pipeline run on Databricks
- [ ] Deploy to Vercel
- [ ] Generate Rork Max demo video clips
- [ ] Edit demo video (DaVinci Resolve / CapCut)
- [ ] Demo rehearsal

---

<a name="future-scaling"></a>

## 15. Future Scaling Roadmap

### Near Term (Post-MVP)

- **Live data feed:** Alpha Vantage / Polygon.io WebSocket for real-time price updates
- **GPGPU crowd simulation:** Move agent physics to GPU via compute shaders or transform feedback
- **Data texture agents:** Encode agent state in textures, simulate entirely on GPU (10k+ agents)
- **Sound design:** Ambient candy factory sounds, crowd noise scaled by density, cash register ka-chings
- **Mobile touch controls:** Pinch-to-zoom, tap-to-select
- **Enhanced Geist UI theming:** Dark mode city (night view), custom Geist theme matching candy palette

### Medium Term

- **Live earnings calendar:** Auto-update predictions when new earnings dates are announced
- **ML-powered predictions:** Train models on historical earnings reactions for more accurate crowd forecasts
- **Portfolio builder:** Click stores to add to a virtual candy basket, see combined stats
- **Notification system:** Alert when a stock enters Platinum territory ("Wonka Bar Found!")
- **MLflow integration:** Version Golden Ticket model parameters, A/B test thresholds
- **Rork Max automated demos:** Auto-generate demo videos for each significant market event
- **Real-time correlation updates:** Live correlation threads update intra-day

### Long Term

- **Options chain integration:** Real options pricing data for CALL/PUT lanes
- **Multi-asset class:** Add crypto, commodities, forex as separate candy districts
- **VR mode:** WebXR support for immersive candy city exploration
- **Collaborative:** Multiple users in the same city, see each other's cursors
- **Spark Streaming:** Real-time feature engineering with Structured Streaming on Databricks
- **AI crowd prediction:** Neural net predicts crowd patterns from earnings transcripts + sentiment
- **Geist UI dashboard mode:** Full Geist-powered analytics dashboard as alternative to 3D city

---

<a name="stock-network-page"></a>

## 25. Stock Network Page — How Model Reacts (Databricks/Colab/Kaggle)

**Route:** `/network`  
**Purpose:** A **dedicated full page** showing how the Golden Ticket model (computed on **Databricks + Google Colab** from **5 years of Kaggle daily stock data**) determines stock relationships, and how the candy cane correlation network reacts to model updates.

### 25.1 Page Layout

```
+-----------------------------------------------------------------------+
|  [🏙️ City]  [📊 Stock Network]  [🤖 Agent Reactions]  [🎮 Playground]  |
+-----------------------------------------------------------------------+
|                                                                         |
|  +----- LEFT PANEL (30%) ----+  +------ MAIN CANVAS (70%) ------+     |
|  |                            |  |                                |     |
|  |  MODEL PIPELINE            |  |   3D FORCE-DIRECTED GRAPH      |     |
|  |  ┌────────────────────┐   |  |                                |     |
|  |  │ Kaggle CSV (5yr)   │   |  |   500 nodes (stocks)           |     |
|  |  │      ↓             │   |  |   Edges = candy canes          |     |
|  |  │ Google Colab       │   |  |   Colors = ticker brand colors |     |
|  |  │  (preprocessing)   │   |  |   Node size = golden_score     |     |
|  |  │      ↓             │   |  |   Edge thickness = |corr|      |     |
|  |  │ Databricks Spark   │   |  |                                |     |
|  |  │  (correlation +    │   |  |   ○──🍬──○──🍬──○              |     |
|  |  │   golden ticket)   │   |  |    \ 🍬  / \ 🍬 /              |     |
|  |  │      ↓             │   |  |     ○──🍬──○──🍬──○            |     |
|  |  │ API → Frontend     │   |  |                                |     |
|  |  └────────────────────┘   |  |                                |     |
|  |                            |  +--------------------------------+     |
|  |  CORRELATION MATRIX        |                                         |
|  |  [heatmap of 500×500]      |  +------ BOTTOM PANEL (30%) -----+     |
|  |                            |  |                                |     |
|  |  SECTOR HEATMAP            |  |  SECTOR BREAKDOWN BAR CHART   |     |
|  |  [11 sector averages]      |  |  Golden Score by Sector        |     |
|  |                            |  |  [Tech: ████████ 4.2]          |     |
|  |  MODEL PARAMETERS          |  |  [Fin:  ██████   3.8]          |     |
|  |  - Lookback window         |  |  [HC:   █████    3.5]          |     |
|  |  - Correlation threshold   |  |  ...                           |     |
|  |  - Golden ticket weights   |  |                                |     |
|  +----------------------------+  +--------------------------------+     |
+-----------------------------------------------------------------------+
```

### 25.2 Key Visualizations

| Visualization | Description | Technology |
|---------------|-------------|------------|
| **3D Candy Cane Force Graph** | 500 stock nodes connected by interlocking candy canes. Drag, zoom, rotate. Colors match tickers. | react-force-graph-3d + Three.js |
| **Correlation Heatmap** | 500×500 matrix showing pairwise correlations. Click cell → highlights candy cane in graph. | D3.js canvas heatmap |
| **Sector Heatmap** | 11×11 sector-level average correlations. Shows which sectors move together. | D3.js |
| **Model Pipeline Diagram** | Live status of Kaggle → Colab → Databricks → API pipeline. Shows last compute timestamp. | React + Geist UI |
| **Golden Score Distribution** | Histogram of all 500 golden scores, colored by sector | D3.js |

### 25.3 Model → Network Reaction Flow

```
When model recomputes (every N minutes via Databricks):
  1. New golden_score values arrive via API
  2. Node sizes animate to new sizes (GSAP tween, 1s)
  3. Candy cane edges recalculate:
     - New correlations → new candy canes grow in (scale 0→1)
     - Lost correlations → candy canes shrink and dissolve
     - Changed weights → candy cane thickness morphs
  4. Sector clusters reorganize (force simulation updates)
  5. Correlation heatmap re-renders with diff highlighting
  6. Notification banner: "Model updated — 23 correlations changed"
```

### 25.4 Data Source Stack

```python
# KAGGLE: 5 years of daily stock data (2019-2024)
# Loaded into Google Colab for preprocessing
import pandas as pd
kaggle_data = pd.read_csv('sp500_daily_prices_5yr.csv')

# COLAB: Feature engineering
returns = kaggle_data.pivot('date', 'ticker', 'close').pct_change()
correlation_matrix = returns.rolling(60).corr()  # 60-day rolling

# DATABRICKS: Large-scale Golden Ticket computation
# Uses Spark for distributed computation across all 500 stocks
# Computes: momentum, mean reversion, sector rotation, earnings proximity
# Outputs: golden_score (0-5 scale) for each stock
# PUSH TO API: golden_scores + correlation_matrix → frontend
```

---

<a name="agent-reactions-page"></a>

## 26. Agent Reactions Page — How 500K Agents React to Model Signals

**Route:** `/agents`  
**Purpose:** A **dedicated full page** showing how the 500,000 AI agents react to Golden Ticket model signals in real-time. Includes live leaderboard, agent decision heatmaps, decision stream, and store pressure visualization.

### 26.1 Page Layout

```
+-----------------------------------------------------------------------+
|  [🏙️ City]  [📊 Stock Network]  [🤖 Agent Reactions]  [🎮 Playground]  |
+-----------------------------------------------------------------------+
|                                                                         |
|  +----- LEADERBOARD (20%) ---+  +------ MAIN VIEW (50%) ---------+    |
|  |                            |  |                                |    |
|  |  🏆 PROFIT LEADERBOARD    |  |  AGENT HEATMAP (bird's eye)   |    |
|  |                            |  |                                |    |
|  |  #1  Agent_7382   $48,291  |  |  Each pixel = group of agents |    |
|  |  #2  Agent_1094   $45,112  |  |  Color = current target       |    |
|  |  #3  Agent_9821   $43,887  |  |  Brightness = urgency         |    |
|  |  #4  Agent_0456   $41,203  |  |                                |    |
|  |  #5  Agent_5519   $39,991  |  |  ░░░▓▓██░░░▓▓██░░░           |    |
|  |  ...                       |  |  ░▓▓███▓▓░░▓████░░           |    |
|  |  #500,000 Agent_2133 $102  |  |  ░░░▓▓██░░░▓▓██░░░           |    |
|  |                            |  |                                |    |
|  |  STATS:                    |  +--------------------------------+    |
|  |  Avg Profit: $12,441       |                                        |
|  |  Total Trades: 2.4M        |  +------ RIGHT PANEL (30%) ------+    |
|  |  Active Agents: 487,221    |  |                                |    |
|  |  Avg Urgency: 1.8          |  |  STORE PRESSURE MAP           |    |
|  |                            |  |                                |    |
|  +----------------------------+  |  500 stores as cells           |    |
|                                   |  Color = agent density         |    |
|  +----- DECISION STREAM -----+  |  Height = urgency at door      |    |
|  |                            |  |                                |    |
|  |  LIVE AGENT DECISIONS:     |  |  ┌──┬──┬──┬──┬──┐            |    |
|  |                            |  |  │▓▓│░░│██│░░│▓▓│ NVDA       |    |
|  |  Agent_7382 → NVDA (BUY)  |  |  │██│▓▓│░░│▓▓│██│ AAPL       |    |
|  |  "Earnings beat + AI hype" |  |  │░░│██│▓▓│██│░░│ TSLA       |    |
|  |  Confidence: 0.92 🔥       |  |  └──┴──┴──┴──┴──┘            |    |
|  |                            |  |                                |    |
|  |  Agent_1094 → TSLA (PUT)  |  |  BUY  SHORT  CALL  PUT        |    |
|  |  "Delivery miss expected"  |  |  ██   ▓▓     ░░    --         |    |
|  |  Confidence: 0.78          |  |                                |    |
|  |                            |  +--------------------------------+    |
|  +----------------------------+                                        |
+-----------------------------------------------------------------------+
```

### 26.2 Key Visualizations

| Visualization | Description | Technology |
|---------------|-------------|------------|
| **Profit Leaderboard** | Live-updating top agents ranked by cumulative profit. Click agent → see their trade history. | React + Geist UI |
| **Agent Heatmap** | Bird's-eye view of all 500K agents. Each pixel = cluster. Color = target sector, brightness = urgency. | WebGL canvas |
| **Decision Stream** | Live feed of agent decisions — ticker, direction, reasoning, confidence. Filterable by agent. | React virtualized list |
| **Store Pressure Map** | 500-cell grid. Cell color = how many agents targeting that store. Height = average urgency. Click → see breakdown. | D3.js + canvas |
| **Sector Flow Sankey** | Shows agent flow between sectors over time. Width = number of agents switching. | D3-sankey |
| **Reaction Timeline** | When model updates, shows the cascade: model signal → agent decisions → store pressure → profit results | D3.js timeline |

### 26.3 Model Signal → Agent Reaction Flow

```
When Golden Ticket model updates:

  T+0.0s   Model signal arrives (new golden_scores)
  T+0.1s   First batch of agents receive updated data via Gemini
  T+0.5s   50,000 agents have new decisions — heatmap begins shifting
  T+1.0s   SURGE: agents that picked platinum stores start sprinting
  T+2.0s   200,000 agents have updated — store pressure map lights up
  T+3.0s   Door fights begin at high-score stores
  T+5.0s   All 500,000 agents have new targets — cascade complete
  T+10.0s  First wave of agents EXIT stores with candy (profits)
  T+15.0s  Leaderboard reshuffles — new rankings
  T+30.0s  Decision stream shows reasoning diversity
  T+60.0s  Next cycle begins

  THIS ENTIRE REACTION IS VISUALIZED ON THE AGENT REACTIONS PAGE
```

### 26.4 Agent Reaction Filters

```typescript
// Users can filter the agent reactions page
interface AgentFilters {
    sector: string | 'all';           // filter by target sector
    direction: 'BUY' | 'SHORT' | 'CALL' | 'PUT' | 'all';
    urgencyRange: [number, number];   // e.g., [2.0, 3.0] = urgent agents only
    profitRange: [number, number];    // e.g., [10000, Infinity] = top earners
    searchAgent: string;              // search by agent ID/name
    showOnlyPlatinum: boolean;        // only show agents targeting platinum stores
}

// Apply filters → heatmap, leaderboard, stream all update in real-time
```

### 26.5 Page Navigation

```typescript
// React Router routes
const routes = [
    { path: '/',           component: GoldenCityPage },       // main 3D city
    { path: '/network',    component: StockNetworkPage },     // §25 stock network
    { path: '/agents',     component: AgentReactionsPage },   // §26 agent reactions
    { path: '/playground', component: GraphPlaygroundPage },  // existing D3 playground
];

// Top nav bar appears on all pages
// All pages share the same data store (Zustand)
// Navigating between pages preserves state
```

---

## Appendix A: Dependency List

### Frontend

```json
{
  "dependencies": {
    "react": "^18.x",
    "react-dom": "^18.x",
    "three": "^0.168.x",
    "@react-three/fiber": "^8.x",
    "@react-three/drei": "^9.x",
    "react-router-dom": "^6.x",
    "@geist-ui/core": "^2.x",
    "zustand": "^4.x",
    "react-force-graph-3d": "^1.x",
    "d3": "^7.x",
    "gsap": "^3.x",
    "framer-motion": "^11.x",
    "@google/generative-ai": "^0.21.x",
    "@alpacamarkets/alpaca-trade-api": "^3.x",
    "newsapi": "^2.x"
  },
  "devDependencies": {
    "vite": "^5.x",
    "typescript": "^5.x",
    "@types/three": "latest",
    "@types/d3": "^7.x"
  }
}
```

### Data Pipeline (Python)

```
pandas>=2.0
numpy>=1.24
scipy>=1.10
matplotlib>=3.7
seaborn>=0.12
yfinance>=0.2
pyspark>=3.4      # Databricks
delta-spark>=2.4
mlflow>=2.8       # optional
```

## Appendix B: Glossary of Candy Terms

| Technical Term | Candy Equivalent |
|---------------|-----------------|
| Stock | Sweet / Candy |
| Company | Candy Store / Sweet Shop |
| Market Cap | Store Size |
| Sector | Candy District |
| Brand Identity | Candy Icon (unique shape + company color) |
| Drawdown | Sour Drop |
| Volume Spike | Sugar Rush |
| Volatility | Fizz Level |
| Golden Score | Candy Rating |
| Platinum Ticket | Wonka Bar |
| Buy Signal | Sweet Tooth Alert |
| Forward Return | Candy Payoff |
| Correlation | Flavor Link / Candy Thread |
| Correlation Thread | Candy String (glowing arc between stores) |
| Crowd Density | Sugar Stampede |
| Portfolio | Candy Basket |
| Benchmark (SPY) | The Candy Index |
| Mean Reversion | Taffy Snap-back |
| Skewness | Candy Lean |
| Regime | Sugar Season |
| Graph Playground | The Candy Web |
| Shock Propagation | Sugar Shock Wave |
| Time Slider | Time Machine / Date Scrubber |
| Historical Playback | Rewind the Factory |
| Future Prediction | Crystal Candy Ball |
| Earnings Report | Factory Inspection |
| Dividend | Candy Dividend / Free Samples |
| Geist Panel | Control Console |
| Demo Video | Factory Tour (Rork Max) |

## Appendix C: New Tech Stack Additions

| Tool | Purpose | Integration Point |
|------|---------|-------------------|
| **Geist UI** | Design system for controls, panels, sliders, typography | Overlay on Three.js canvas, graph controls, time slider |
| **Replit Animation** | Rapid prototyping of frontend animations | City load-in, crowd transitions, panel animations |
| **Rork Max** | Cinematic demo video generation | 3-4 min polished demo walkthrough |
| **Framer Motion** | React animation library for panel transitions | Geist panel slide-in/out, modal animations |
| **GSAP** | High-performance timeline animations | Camera transitions, crowd morphing, time slider playback |
