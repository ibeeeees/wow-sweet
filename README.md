# Wolf of Wall Sweet <img src="public/favicon.ico" alt="" width="40" height="40" style="vertical-align:middle;" />

## **A candy-themed AI agent stock market simulation with autonomous trading intelligence and future market prediction based on events**

## Overview

500 publicly traded companies rendered as candy storefronts in a Three.js 3D city. 10,000+ autonomous AI agents race between stores and compete for the most profitable trades in real time. A full Databricks medallion pipeline processes 1.5 M rows of real finance data into ML-scored trade signals with zero lookahead bias, validated against the 2008 financial crash.

---

![System Architecture](assets/systemarchitecture.png)

---

## Features

- **3D Candy City** — 500 real S&P stocks as candy storefronts, sized by golden score, colored by real brand, placed via Poisson disk sampling
- **10,000+ AI Agents** — Autonomous crowd with spatial hash grid, door-fighting physics, and BUY / SHORT / CALL / PUT trade lanes
- **4 Competing Whale Funds** — Wonka (Gemini AI), Slugworth (Momentum), Oompa (Value), Gobstopper (Contrarian)
- **Golden Ticket System** — 5-tier ML signal detection (Dip, Shock, Asymmetry, Dislocation, Convexity) + Platinum (Wonka Bar) rarity tier
- **Databricks Medallion Pipeline** — Bronze → Silver → Gold processing 602K rows with 50+ features, FinBERT sentiment, and HMM regime detection
- **Time Travel** — Scrub 5 years of historical data, present state, and Gemini-powered future predictions

---

## Tech Stack

| Layer             | Technology                                                  |
| ----------------- | ----------------------------------------------------------- |
| **Frontend**      | React 19 + TypeScript + Vite 7                              |
| **3D Engine**     | Three.js + @react-three/fiber + @react-three/drei           |
| **State**         | Zustand 5                                                   |
| **AI**            | Google Gemini 2.0 Flash (multi-agent hierarchy) + SphinxAI for monitoring          |
| **Data Pipeline** | Databricks (PySpark + Delta Lake)  |
| **ML Models**     | FinBERT + Light GBM + BERTopic                              |
| **Backend**       | FastAPI + WebSockets                                        |
| **Dataset**       | Yahoo Finance, Kaggle and FRED                              |
| **Deployment**    | Vercel (frontend)                                           |


## Agent State Machine

```
ANALYZING (drifting, picking next target)
    │
    ▼
RUSHING (pathfinding to store door, speed based on urgency)
    │  distance < 2.5 units from door
    ▼
DOOR_FIGHTING (queued at entrance, 1 admitted per store per frame)
    │  admitted
    ▼
INSIDE (trading at lane quadrant, idle sway animation, tinted to lane color)
    │  timer expires
    ▼
ANALYZING (back to picking next target)
```

### Spatial Grid Collision Detection

4.0-unit cell size grid for O(n) neighbor queries. Each agent hashed to cell. Collision checks only against agents in adjacent cells. Prevents O(n²) blowup with 10K agents.

### Rendering (10 InstancedMeshes)

Agents rendered as Oompa Loompas using 10 InstancedMesh instances (one per body part: overalls, shirt, head, hair, legs, arms, shoes). 10 draw calls total instead of 100,000+. Per-frame matrix updates via `setMatrixAt()`.

---

## Whale Arena

4 competing hedge funds with different strategies. Each controls 25% of the agent population.

| Fund                | Color          | Strategy   | Method                                      |
| ------------------- | -------------- | ---------- | ------------------------------------------- |
| **Wonka Fund**      | Gold #FFD700   | Gemini AI  | Hierarchical 11 analysts + PM + risk desk   |
| **Slugworth Fund**  | Orange #FF4500 | Momentum   | Top 8 stocks with RSI > 55 + MACD > 0       |
| **Oompa Fund**      | Green #00FF7F  | Value/Dip  | Top 8 deep drawdowns with golden_score >= 1 |
| **Gobstopper Fund** | Purple #9370DB | Contrarian | Short RSI > 72, long RSI < 32               |

WhaleLeaderboard panel shows P&L, trade count, current allocations, and Gemini reasoning chain for Wonka Fund.

---

## 2008 Financial Crash Validation

Two validation notebooks prove zero lookahead bias across the entire pipeline:

### `validate_medallion.py` — Bronze → Silver Integrity

| Check                                                            | Result |
| ---------------------------------------------------------------- | ------ |
| Row count: Bronze 1,896,880 → Silver 1,896,259 (0.033% drop)     | PASS   |
| Ticker coverage: 1 missing (BAND) out of 621                     | PASS   |
| Core OHLCV columns: zero NULLs                                   | PASS   |
| GNN metadata: 12 sectors, 0 missing                              | PASS   |
| Gold network_features → Silver referential integrity: 0 orphans  | PASS   |
| Feature completeness for GNN (daily_return, close): < 0.03% null | PASS   |

### `validate_2008_crash.py` — Zero Lookahead Bias

| Check                                                             | Result |
| ----------------------------------------------------------------- | ------ |
| 2008 data coverage (424 tickers, 505 trading days)                | PASS   |
| `fwd_return_5d` — 0 mismatched, 0 leaked future prices            | PASS   |
| `fwd_return_20d` — 0 mismatched, 0 leaked future prices           | PASS   |
| SMA-20 backward-looking only: 0 mismatches in 49,072 crash rows   | PASS   |
| Drawdown uses only past peaks (deepest: -0.998)                   | PASS   |
| Delta Lake Time Travel: v0 == current, 0 changed crash-era rows   | PASS   |
| Golden ticket drawdowns match silver layer exactly                | PASS   |
| Market regime: 69% Bear during Sep 2008 – Mar 2009 (84 Bear days) | PASS   |

**Conclusion:** All signals (moving averages, drawdowns, volatility, golden tickets) are computed from data available at each point in time. Delta Lake Time Travel confirms zero retroactive contamination.

---

## Endpoints

| Method      | Endpoint                 | Description                                                                                |
| ----------- | ------------------------ | ------------------------------------------------------------------------------------------ |
| `GET`       | `/health`                | Health check + Databricks status + `stocks_available` flag                                 |
| `GET`       | `/stocks`                | **Live stock payload** from Databricks gold layer (5-min cache), falls back to static JSON |
| `POST`      | `/analyze/news`          | Gemini + FinBERT sentiment analysis on news text/URL                                       |
| `GET`       | `/market/regime`         | Current market regime from HMM (Bull/Bear/Neutral)                                         |
| `GET`       | `/stocks/correlations`   | GNN correlation network edges                                                              |
| `GET`       | `/stocks/archetypes`     | 100 agent archetype definitions                                                            |
| `GET`       | `/scenarios/precomputed` | Pre-built scenario flows                                                                   |
| `WebSocket` | `/ws/agent-stream`       | Bi-directional agent flow + breaking news streaming                                        |

---

**Built at Hacklytics 2026 by:**

- **Ibe Mohammed Ali** — Data/ML Engineer — Georgia State University
- **Ryan Varghese** — Backend Engineer — Georgia Tech
- **Poorav Rawat** — UX/UI + Web Dev + Data Pipelines — Georgia State University
- **Kashish Rikhi** — ML Engineer — Georgia State University

<p align="center">
  <img src="assets/wolf-of-wall-sweet-final.png" alt="Wolf of Wall Sweet" width="600" />
</p>
