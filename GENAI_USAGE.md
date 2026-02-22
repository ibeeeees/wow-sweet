# How We Used Generative AI — Wolf of Wall Sweet

---

## Yes — Google Gemini 2.0 Flash is core to the product.

Generative AI isn't a bolted-on feature in Wolf of Wall Sweet — it's the brain of the entire simulation. We use **Google Gemini 2.0 Flash** in two distinct systems: a **3-layer multi-agent trading hierarchy** that controls 2,500 agents in real time, and a **live news analysis engine** that lets users inject breaking news and watch the market react.

---

## 1. Hierarchical Multi-Agent Trading System (Frontend)

**File:** `src/services/geminiService.ts`
**Model:** `gemini-2.0-flash`
**Called from:** Browser (via `VITE_GEMINI_API_KEY`)
**Cycle:** Every 10 seconds

The Wonka Fund — one of four competing AI hedge funds in our simulation — runs a **3-layer Gemini hierarchy** that produces real portfolio allocations with full reasoning chains:

### Layer 1: 11 Sector Analysts (parallel)

We fire 11 simultaneous Gemini calls, one per GICS sector (Technology, Healthcare, Financials, Energy, etc.). Each analyst receives its sector's stocks with full technicals — RSI, MACD, Bollinger %B, Z-score, golden ticket score — and returns:

- **Top 3 stock picks** with action (BUY / CALL / PUT / SHORT)
- **Sector sentiment** (bullish / bearish / neutral)
- **Risk level** (low / medium / high)
- **Reasoning** explaining why each pick was selected

All 11 calls run in parallel via `Promise.all` to stay within our 10-second cycle budget.

### Layer 2: Portfolio Manager (sequential)

A single Gemini call receives all 11 sector analyst reports and builds a 6-10 position portfolio. It enforces:

- 5-25% weight per position
- Max 30% exposure to any single sector
- Long/short balance based on regime

Returns: ticker, action, weight, and reasoning for each position.

### Layer 3: Risk Desk (sequential)

A final Gemini call reviews the portfolio for:

- Concentration risk (too much weight in one sector)
- High-volatility positions that could blow up
- Dangerous short exposure

The Risk Desk either approves the portfolio or suggests weight adjustments. Final allocations are normalized to sum to 1.0.

### How It Drives the Simulation

The output — a weighted portfolio of 6-10 stocks with actions — is fed into `whaleArena.ts`. Every 15 seconds, 25% of the 10,000 agents (the Wonka Fund faction) are physically redirected to sprint toward the stocks Gemini selected. You can **watch the AI's decisions play out spatially** — agents change direction, pile into new stores, fight at new doorways — all because Gemini decided that NVDA is a better CALL than AAPL this cycle.

The full reasoning chain (every sector report, PM decision, risk review, final allocations, and cycle timing) is displayed live in the **Whale Leaderboard panel** in the UI. Users can expand each layer and read exactly why the AI made each decision — it's not a black box.

**Fallback:** When Gemini is unavailable (rate limit, no API key, network error), the Wonka Fund silently falls back to an algorithmic golden-score-based allocation. The other 3 whale funds (Slugworth, Oompa, Gobstopper) are purely algorithmic and always run, so the simulation never stops.

---

## 2. Live News Analysis Engine (Backend)

**File:** `backend/app/main.py` — `POST /inject-news`
**Model:** Gemini (via `google-generativeai` Python SDK)
**Called from:** FastAPI backend (via `GEMINI_API_KEY`)

Users can paste a news URL or free-text headline into the **Future Predictions panel** in the UI. The backend:

1. **Scrapes the article** using BeautifulSoup (if a URL is provided)
2. **Sends the content to Gemini** with a structured prompt asking for:
   - Overall sentiment (BULLISH / BEARISH / NEUTRAL) with a confidence score (-1.0 to +1.0)
   - List of affected stock tickers
   - Recommended agent reaction (which stocks to rush toward, which to flee)
   - A natural language analysis paragraph
3. **Broadcasts the result** via WebSocket to all connected browser clients
4. **Agents react in real time** — the simulation redirects agents toward or away from affected stocks based on Gemini's analysis

This creates a live feedback loop: paste a CNBC article about Fed rate hikes → Gemini identifies affected financial stocks → agents swarm bank stores → the heatmap on the Agent Reactions page lights up red in the Financials sector. The entire chain takes 2-3 seconds from URL paste to visible agent movement.

---

## 3. Trade Journal Intelligence (Frontend)

**File:** `src/pages/TradeJournalPage.tsx`
**Model:** `gemini-2.0-flash`

Users can paste their own trading notes (free text, Markdown, or CSV) into the Trade Journal page. Gemini parses unstructured text into structured trade entries — extracting ticker, action (BUY/SHORT/CALL/PUT), date, outcome, and reasoning. These parsed trades are then visualized as a **neural network graph** showing which patterns (Dip Buy, Momentum, Earnings Play) led to wins vs. losses.

For image uploads (photos of handwritten trading notes), we use **Gemini's vision capabilities** to OCR and parse the content into the same structured format.

---

## Why Gemini Specifically

We chose Gemini 2.0 Flash for three reasons:

1. **Speed** — Flash model latency (~1-2s per call) fits our 10-second cycle budget. Running 11 parallel analyst calls + 2 sequential calls completes in ~4 seconds total.
2. **Structured output** — Gemini reliably returns JSON-parseable responses when prompted with explicit schemas, which is critical for feeding allocations into the simulation engine.
3. **Cost at scale** — Flash pricing let us run continuous 10-second cycles across a 36-hour hackathon within our student budget.

---

## Summary

| System | Model | Where | Frequency | What It Does |
|--------|-------|-------|-----------|-------------|
| Sector Analysts (x11) | Gemini 2.0 Flash | Browser | Every 10s, parallel | Analyze sector stocks, pick top 3 with action + reasoning |
| Portfolio Manager | Gemini 2.0 Flash | Browser | Every 10s, sequential | Build diversified 6-10 position portfolio from analyst reports |
| Risk Desk | Gemini 2.0 Flash | Browser | Every 10s, sequential | Validate portfolio, flag concentration/vol risk, adjust weights |
| News Analysis | Gemini | Backend | On demand | Sentiment + affected tickers + agent reaction from news articles |
| Trade Journal Parser | Gemini 2.0 Flash | Browser | On demand | Parse unstructured trade notes into structured entries |

Total: **14 Gemini calls per 10-second cycle** (11 analysts + PM + risk desk + ongoing news/journal on demand), driving 2,500 agents' physical behavior in a 3D city.
