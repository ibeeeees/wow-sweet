# CLAUDE.md - Project Instructions for Claude Code

## Project: Wolf of Wall Sweet (SweetReturns)
Candy-themed AI agent stock market simulation. 500 stocks as 3D candy storefronts with autonomous business-person agents racing between them.

## Tech Stack
- **Frontend:** React 19 + TypeScript + Three.js (@react-three/fiber) + Vite 7
- **State:** Zustand 5
- **Data Pipeline:** Databricks (PySpark + Delta Lake) — scripts in `databricks/`
- **AI:** Google Gemini API for agent decisions
- **Dataset:** Kaggle Yahoo Finance 5Y (602K rows, 491 tickers)

## Architecture
- `src/components/` — React Three Fiber 3D components (stores, agents, city, effects)
- `src/hooks/useCrowdSimulation.ts` — Agent physics engine (TypedArrays, spatial grid)
- `src/data/stockData.ts` — Mock stock data generator (500 stocks, 11 sectors)
- `src/store/useStore.ts` — Zustand global state
- `src/types/index.ts` — All TypeScript interfaces
- `databricks/` — Medallion pipeline (bronze → silver → gold → export JSON)
- `plan.md` — Full architecture spec (48KB)

## Design Decisions
- Stores are scattered randomly across the city (NOT grouped by sector)
- Each store's color matches its stock's real brand color
- Agents are businessmen/women in dark suits, running and fighting
- Agents fight at store doors to enter (DOOR_FIGHTING state)
- Click a store → camera flies in, shows interior with 4 trade lanes (BUY/SHORT/CALL/PUT)
- Use GLTF 3D models for candy stores if procedural geometry isn't visually sufficient
- Performance: 10K+ agents at 30+ FPS via InstancedMesh

## Commands
- `npm run dev` — Start Vite dev server
- `npm run build` — TypeScript check + production build
- `npm run lint` — ESLint

## Golden Ticket System
5 tiers based on drawdown depth, volume spikes, skewness, mean reversion, and regime:
1. Dip (Sour Candy Drop) — deep drawdown
2. Shock (Jawbreaker) — drawdown + volume + volatility
3. Asymmetry (Fortune Cookie) — positive skew + limited downside
4. Dislocation (Taffy Pull) — SPY underperformance + mean reversion
5. Convexity (Golden Gummy Bear) — all conditions in favorable regime
- Platinum (Wonka Bar) — rarest: score >= 4, top 2% rarity, extreme skew

## Databricks Pipeline
See `DATABRICKS_TUTORIAL.md` for full setup guide. Run in order:
1. `bronze_ingestion.py` — CSV to Delta Lake with sector mapping
2. `silver_features.py` — 50+ technical indicators
3. `gold_tickets.py` — Golden ticket evaluation + store dimensions
4. `export_json.py` — Build frontend_payload.json
