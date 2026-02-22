# Wolf of Wall Sweet

**A Candy-Themed 3D Stock Market Where 10,000 AI Agents Physically Race to Trade**

Live: [wolfofwallsweet.tech](https://wolfofwallsweet.tech)

---

## Inspiration

We wanted to answer a question: **what would the stock market look like if you could *see* it?**

Not as charts and candles — but as a living, breathing city. A place where every stock is a building you can walk into, where thousands of AI-powered traders sprint down streets, shove each other out of the way, and fight at doorways to get their trades in first. A place where herd behavior, market panic, and momentum aren't abstract concepts — they're things you *watch happen* in real time.

The financial world is opaque by design. Retail investors stare at green and red numbers with no intuition for what's actually going on. We wanted to build something that makes market dynamics visceral and immediate — something a first-time investor could watch for 30 seconds and *feel* what a momentum trade looks like, or *see* what happens when bad news hits a sector.

We also had a data problem to solve. Raw Yahoo Finance CSVs don't tell you which stocks are actually interesting. So we built a full Databricks pipeline to score every stock on five dimensions of opportunity and surface the ones worth watching — what we call **Golden Tickets**.

The candy theme started as a joke and became the identity. Every stock is a candy store. Correlations are candy canes. The best opportunities are Wonka Bars. It stuck because it makes something intimidating feel approachable.

---

## What it does

Wolf of Wall Sweet is a **real-time 3D stock market simulation** built on real financial data. It has three layers:

### 1. The City

500 real S&P stocks rendered as candy storefronts in a Three.js 3D city. Each store's **color** is its real brand color (Apple is silver, Coca-Cola is red). Each store's **size** scales with its Golden Ticket score — how many of our five opportunity signals it triggers. Platinum-tier stocks pulse with a golden glow and rain candy particle confetti.

You can orbit the city from above, or drop into **first-person mode** and walk the streets at eye level using WASD controls.

### 2. The Agents

10,000 autonomous AI agents (rendered as Oompa Loompas) race between stores. Each agent belongs to one of **four competing hedge funds**:

- **Wonka Fund** — powered by a 3-layer Google Gemini AI hierarchy (11 sector analysts, a portfolio manager, and a risk desk)
- **Slugworth Fund** — momentum strategy (chases RSI + MACD signals)
- **Oompa Fund** — value/dip buying (targets deep drawdowns with golden tickets)
- **Gobstopper Fund** — contrarian (shorts overbought, buys oversold)

Every 15 seconds, all 10,000 agents receive new orders and physically sprint to their target stores. They queue at doorways, fight to get inside, pick one of four trade lanes (BUY, SHORT, CALL, PUT), execute their trade, and exit. A live leaderboard tracks profit, win rate, and trade history for every agent.

### 3. The Data

602,000 rows of real Yahoo Finance data (491 tickers, 5 years) flow through a **Databricks medallion pipeline**:

- **Bronze** — raw OHLCV + financial news + Reddit sentiment + macro indicators
- **Silver** — 50+ engineered features: RSI, MACD, Bollinger Bands, Z-scores, realized volatility, forward return distributions, drawdown percentiles
- **Gold** — ML-scored signals: FinBERT sentiment, HMM regime detection (Bull/Bear/Neutral), graph centrality metrics, and our Golden Ticket scoring system

The pipeline produces a scored payload that drives every visual in the app — store sizes, agent targets, trade lane distributions, and correlation edges.

### Additional Pages

| Page | What it shows |
|------|---------------|
| **Stock Network** | 3D force-directed graph of all 500 stocks connected by correlation edges. Drag a threshold slider to rewire the graph in real time. |
| **Agent Reactions** | Live D3 treemap heatmap showing which stores are hot (red) vs. cold (blue), whale fund rankings, and a scrolling AI decision stream. |
| **Agent Network** | Canvas force graph of whale funds connected to top agents. Double-click a node to trigger a shock wave that propagates through the network. |
| **Graph Playground** | Full interactive correlation explorer with shock propagation, regime filtering, ticker search, golden score color mode, and a detail panel showing technicals + golden ticket status per stock. |
| **Trade Journal** | Paste your own trading notes and watch them parsed into a neural network visualization mapping tickers to patterns to win/loss outcomes. |

---

## How we built it

### Team

| Name | Role | Contribution |
|------|------|-------------|
| **Ibe Mohammed Ali** | Data/ML Engineer | Databricks pipeline, golden ticket system, Gemini multi-agent hierarchy, crowd simulation engine, system architecture |
| **Ryan Varghese** | Backend Engineer | FastAPI backend, Databricks REST client, WebSocket streaming, news injection endpoint, Docker deployment |
| **Poorav Rawat** | UX/UI & Web Dev | Three.js 3D city, store interiors, camera systems, POV mode, all 6 page layouts, navbar, leaderboard UI |
| **Kashish Rikhi** | ML Engineer | FinBERT sentiment model, HMM regime detection, correlation graph analysis, agent archetypes, 2008 crash validation |

### Architecture

```
Kaggle CSV (602K rows)
  --> Databricks Bronze (raw Delta tables)
    --> Silver (50+ features via PySpark)
      --> Gold (ML models + Golden Tickets)
        --> export_json.py --> frontend_payload.json
                                      |
                                      v
              Browser: React 19 + Three.js + Zustand
                |                           |
                v                           v
        CandyCity (3D)              FastAPI Backend :8000
        10K InstancedMesh agents      /stocks (live Databricks query)
        useCrowdSimulation            /regime (HMM)
        (TypedArrays + SpatialGrid)   /sentiment (FinBERT)
                ^                     /inject-news (Gemini)
                |                     /ws/agent-stream (WebSocket)
        Gemini 2.0 Flash
        (11 Analysts -> PM -> Risk Desk)
```

### Data Pipeline (20 Databricks Scripts)

We built a full **medallion architecture** inside Databricks Unity Catalog (`sweetreturns`):

**Bronze layer** — 4 ingestion notebooks load raw stock OHLCV, financial news, Reddit posts, and macro indicators (SPY, VIX, interest rates) into Delta Lake tables.

**Silver layer** — PySpark window functions compute 50+ technical indicators per (ticker, date) pair. Every feature is strictly backward-looking. Key features:

- $\text{RSI}_{14} = 100 - \frac{100}{1 + \frac{\text{avg gain}_{14}}{\text{avg loss}_{14}}}$

- $\text{Z-score}_{20} = \frac{P_t - \mu_{20}}{\sigma_{20}}$

- $\text{Bollinger \%B} = \frac{P_t - (SMA_{20} - 2\sigma_{20})}{4\sigma_{20}}$

- Forward return distributions: $\{p_5, p_{25}, \tilde{x}, p_{75}, p_{95}\}$ over the next 60 trading days

- Drawdown from all-time high: $DD_t = \frac{P_t - \max_{s \leq t} P_s}{\max_{s \leq t} P_s}$

**Gold layer** — ML models and scoring:

- **FinBERT** (ProsusAI/finbert) scores news headlines for sentiment via HuggingFace Transformers, served through MLflow
- **Hidden Markov Model** (3-state Gaussian HMM via hmmlearn) classifies each trading day as Bull, Bear, or Neutral based on SPY returns and volatility
- **Correlation graph** — Pearson correlation matrix + NetworkX graph metrics (degree centrality, betweenness, eigenvector, PageRank) + Louvain community detection
- **Golden Ticket scoring** — 5-tier opportunity detection (detailed below)
- **Agent archetypes** — 100 personality profiles (10 base types x 10 variants) with risk tolerance, greed, fear, and preferred trade actions

### Golden Ticket System

Every stock earns a **golden score** from 0 to 5 based on five binary ticket evaluations per day:

| Tier | Candy Name | What it detects |
|------|-----------|-----------------|
| 1 | Sour Candy Drop | Deep drawdown from all-time high ($DD_{\%} > 80\text{th percentile}$) |
| 2 | Jawbreaker | Drawdown + volume spike + extreme volatility (triple confirmation) |
| 3 | Fortune Cookie | Positive forward skew with limited downside ($\text{skew} > 0$, $p_{95} > 2 \times \tilde{x}$) |
| 4 | Taffy Pull | SPY underperformance + mean reversion signal ($\text{rel. return} < 15\text{th pct}$) |
| 5 | Golden Gummy Bear | All conditions met in a favorable HMM regime |

**Platinum (Wonka Bar):** The rarest tier. Requires $\text{score} \geq 4$, top 2% cross-sectional rarity, $\text{skew} \geq 1.0$, relative return below the 5th percentile, and a favorable vol regime. Platinum stores are 2.5x larger in the city and attract 3x more agents.

The overall golden score drives every visual: $\text{store size} \propto \text{golden\_score}^2$, agent density scales linearly, and emissive glow intensity increases per tier.

### Gemini AI Hierarchy

The Wonka Fund runs a **3-layer multi-agent system** using Google Gemini 2.0 Flash, called directly from the browser every 10 seconds:

**Layer 1 — 11 Sector Analysts (parallel):** Each analyst receives its sector's stocks with full technicals (RSI, MACD, Bollinger %B, Z-score, golden score) and returns its top 3 picks with action (BUY/CALL/PUT/SHORT), conviction score, and reasoning.

**Layer 2 — Portfolio Manager:** Aggregates all 11 sector reports into a 6-10 position portfolio. Enforces diversification: max 30% per sector, 5-25% weight per position.

**Layer 3 — Risk Desk:** Reviews the portfolio for concentration risk, high-volatility positions, and dangerous short exposure. Approves or adjusts weights. Final allocations are normalized to sum to 1.0.

The full reasoning chain (every sector report, PM decision, risk review) is displayed live in the Whale Leaderboard panel.

### Crowd Simulation Engine

10,000 agents are simulated entirely in **TypedArrays** — `Float32Array` for positions/velocities/targets, `Uint8Array` for states/trade lanes — with zero per-frame heap allocation. A **spatial hash grid** (4-unit cells) provides O(1) neighbor lookups for collision avoidance, eliminating the $O(n^2)$ brute-force bottleneck.

Each agent runs a 4-state finite state machine:

$$\text{ANALYZING} \xrightarrow{\text{timer}} \text{RUSHING} \xrightarrow{d < 2.5} \text{DOOR\_FIGHTING} \xrightarrow{\text{admitted}} \text{INSIDE} \xrightarrow{\text{timer}} \text{ANALYZING}$$

Door admission is gated to 1 agent per store per frame, creating realistic queuing behavior. Agents are rendered as Oompa Loompas using 10 `InstancedMesh` instances (one per body part), producing only 10 draw calls for all 10,000 agents.

### Backend

FastAPI serves 7 REST endpoints + 1 WebSocket channel. The `DatabricksClient` uses the **SQL Statement REST API** (`POST /api/2.0/sql/statements/`) to query gold-layer Delta tables with a 5-minute cache TTL. The `/inject-news` endpoint scrapes a URL with BeautifulSoup, runs Gemini sentiment analysis, and broadcasts the result to all connected WebSocket clients — agents in the browser react in real time.

The frontend uses a **3-tier data loading** strategy: live Databricks queries (via backend) > static `frontend_payload.json` > synthetic data. A pulsing connection badge in the navbar shows the active tier: LIVE (green), API (gold), STATIC (orange), MOCK (red).

### Deployment

- **Frontend:** Vite 7 build deployed to **Vercel** with auto-deploy on push to `main`. Domain: wolfofwallsweet.tech
- **Backend:** Docker container running FastAPI + Uvicorn on port 8000
- **Pipeline:** Databricks Unity Catalog (`sweetreturns`) with 20 orchestrated PySpark scripts

---

## Challenges we ran into

**Simulating 10,000 agents at 30+ FPS.** Our first implementation used plain JavaScript objects for agent state — it ran at 4 FPS with 1,000 agents. We rewrote the entire simulation in TypedArrays with a spatial hash grid, and switched from individual meshes to InstancedMesh rendering. This took the engine from $O(n^2)$ collision detection to $O(n)$ with constant-factor improvements from cache-coherent memory access. The result: 10,000 agents at 30+ FPS on a mid-range laptop GPU.

**Databricks connection reliability.** The official Databricks SQL connector would hang silently on connection, blocking the entire backend. We switched to the raw REST API (`/api/2.0/sql/statements/`) with explicit 35-second timeouts and built a graceful 3-tier fallback so the app always works — even without Databricks running.

**Zero lookahead bias in the pipeline.** Financial backtesting is notoriously prone to data leakage — using future information to make past predictions. We validated every computed feature against the 2008 financial crash: SMA-20 backward-looking only (0 mismatches across 49,072 rows), forward returns computed correctly, drawdowns using only past peaks, Delta Lake Time Travel confirming zero retroactive changes. The HMM correctly identified 69% Bear regime during Sep 2008 – Mar 2009.

**Gemini rate limits and latency.** Calling Gemini 33 times per cycle (11 analysts + PM + risk desk) from the browser would blow through rate limits in seconds. We parallelized the 11 analyst calls with `Promise.all`, added a 10-second cycle interval, and built a golden-score-based fallback so the 3 non-AI whale funds always work even when Gemini is unavailable.

**Making 500 stores visually distinct.** With 500 stores on screen, everything looked like noise. We used real brand colors per stock (Apple's silver, Netflix red, JPMorgan blue), scaled store height by golden score, added emissive pulsing for platinum stores, and implemented Poisson disk sampling for placement so no two stores overlap. Sector filtering and the fog gradient (near: 200, far: 1000) keep the scene readable.

---

## Accomplishments that we're proud of

- **10,000+ agents running at 30 FPS** with full physics, pathfinding, and door-fighting — in a browser, with zero WebAssembly or GPU compute
- **A 3-layer Gemini AI hierarchy** that produces real portfolio allocations with full reasoning chains visible in the UI — not a black box
- **A complete Databricks medallion pipeline** (20 scripts, 11 Delta tables) processing 602K rows of real financial data with zero lookahead bias, validated against the 2008 crash
- **The Golden Ticket system** — a novel 5-tier opportunity scoring framework with a platinum "Wonka Bar" rarity tier that drives every visual in the app
- **4 competing whale funds** with genuinely different strategies, creating emergent market dynamics you can watch unfold
- **6 fully interactive pages** — 3D city, stock network, agent heatmap, force graph playground with shock propagation, agent network, and AI trade journal
- **Live data pipeline** with real-time connection status — the app degrades gracefully across 4 tiers (Databricks live > backend API > static JSON > synthetic)

---

## What we learned

- **TypedArrays change everything** for browser physics. Moving from object-oriented agent state to flat typed arrays was the single biggest performance unlock — not because of algorithmic improvement, but because of CPU cache locality.
- **Spatial hashing is underrated.** A simple hash grid eliminated our O(n^2) collision bottleneck more effectively than a quadtree would have, with far less implementation complexity.
- **Multi-agent LLM systems need fallbacks.** Gemini is powerful but unpredictable — rate limits, latency spikes, malformed JSON. Building the 3 algorithmic whale funds as a parallel system meant the simulation never stops, even when AI is offline.
- **Delta Lake Time Travel is essential for financial data integrity.** Being able to prove that no row changed retroactively gave us confidence that our golden ticket scores are legitimate.
- **InstancedMesh is the secret to large-scale Three.js scenes.** Rendering 10,000 individual meshes is impossible in a browser. Rendering 10 instanced meshes with 10,000 matrices each is trivial.

---

## What's next

- **Live market data integration** — connect to a real-time market data feed so agents react to actual price movements during market hours
- **Agent memory and learning** — let agents remember their past trades and adapt strategy over time using Gemini's context window
- **Mobile support** — responsive layout with touch controls for the 3D city
- **Multiplayer mode** — let users create their own whale fund and compete against the AI funds in real time
- **Voice narration** — Gemini-generated play-by-play commentary describing what's happening in the city as agents swarm

---

## Built With

`react` `three.js` `typescript` `zustand` `d3.js` `vite` `google-gemini` `databricks` `pyspark` `delta-lake` `fastapi` `websockets` `finbert` `hidden-markov-model` `react-three-fiber` `instancedmesh` `vercel` `docker`
