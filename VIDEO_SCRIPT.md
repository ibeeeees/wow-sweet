# Wolf of Wall Sweet — Demo Video Script (2:00–2:30)

> **Target:** 2 minutes to 2 minutes 30 seconds
> **Format:** Face cam clips + screen recordings + Replit animated transitions
> **Pace:** ~150 words/min spoken = 300–375 words total narration

---

## PRE-PRODUCTION: What to Record

### A. Face Cam Clips (film these first)

Record each person against a clean background, good lighting, looking at camera. Each clip should be 10–20 seconds raw (will be trimmed to 3–8 seconds each).

| Clip ID | Who | Says | Duration |
|---------|-----|------|----------|
| **FC-1** | **Ibe** (Data/ML Engineer) | "We built Wolf of Wall Sweet — a candy-themed stock market where AI agents physically race to make trades in a 3D city." | ~6s |
| **FC-2** | **Poorav** (UX/UI & Web Dev) | "Every store is a real stock. Click one and you see agents fighting at the door to get inside and trade." | ~5s |
| **FC-3** | **Ryan** (Backend Engineer) | "Our backend streams live data from Databricks through a FastAPI pipeline — regime detection, sentiment, agent flows — all in real time." | ~6s |
| **FC-4** | **Kashish** (ML Engineer) | "We trained FinBERT for sentiment, a Hidden Markov Model for market regimes, and built a golden ticket system that scores every stock on five dimensions." | ~7s |
| **FC-5** | **Ibe** (closing) | "Wolf of Wall Sweet. Five hundred stocks. Ten thousand agents. One candy city." | ~4s |

### B. Screen Recordings (capture these from wolfofwallsweet.tech)

Record each as a separate clip, 1080p or higher, smooth mouse movements, no clicking sounds.

| Clip ID | What to Record | How | Duration |
|---------|----------------|-----|----------|
| **SR-1** | City wide shot | Load `/`, let camera idle, show full city with agents moving | 8s |
| **SR-2** | Agents swarming | Zoom into a cluster of agents rushing between stores | 5s |
| **SR-3** | Click a platinum store | Click a glowing/pulsing store, let camera fly to it | 5s |
| **SR-4** | Store detail overlay | After fly-to, show the full overlay: trade lanes, golden tickets, door fighting dots | 8s |
| **SR-5** | POV mode walk | Click "POV MODE", walk through the city at street level with WASD | 6s |
| **SR-6** | Time slider scrub | Drag the time slider from 2019 through 2020 crash to 2026 | 5s |
| **SR-7** | Whale leaderboard + Gemini chain | Show whale rankings, toggle Gemini ON, expand the chain to show sector analyst reports | 8s |
| **SR-8** | Future predictions | Paste a news URL, click Predict, show Gemini sentiment result | 6s |
| **SR-9** | Stock network graph | Navigate to `/network`, show 3D force graph rotating, drag correlation slider | 6s |
| **SR-10** | Agent heatmap | Navigate to `/agents`, show D3 treemap coloring from blue to red, hover a cell | 5s |
| **SR-11** | Shock propagation | Navigate to `/playground`, enable shock, click a platinum node, show BFS wave | 6s |
| **SR-12** | Trade journal neural net | Navigate to `/journal`, paste sample trades, show neural network with particles | 5s |
| **SR-13** | Navbar connection badge | Show the pulsing green "LIVE" badge in the navbar | 3s |
| **SR-14** | Candy particles | Zoom into a platinum store showing falling candy confetti particles | 4s |
| **SR-15** | Sector filter toggle | Open sector filter, toggle sectors off/on, watch stores disappear/appear | 4s |

---

## THE SCRIPT

### SCENE 1 — Hook (0:00–0:12)

| Time | Visual | Audio/Narration |
|------|--------|-----------------|
| 0:00–0:03 | **SR-1**: Wide aerial shot of the candy city, camera slowly rotating. Stores glowing, agents moving like ants. | *[Music kicks in — upbeat, techy]* |
| 0:03–0:05 | **SR-2**: Quick cut — zoom into agents swarming a store entrance | *[Music builds]* |
| 0:05–0:12 | **FC-1**: Ibe on camera | **Ibe:** "We built Wolf of Wall Sweet — a candy-themed stock market where AI agents physically race to make trades in a 3D city." |

---

### SCENE 2 — The City (0:12–0:35)

| Time | Visual | Audio/Narration |
|------|--------|-----------------|
| 0:12–0:17 | **SR-3**: Click a platinum store, camera swoops in. Candy particles visible. | **Poorav (VO):** "Every one of these buildings is a real stock from the S&P 500." |
| 0:17–0:22 | **FC-2**: Poorav on camera | **Poorav:** "Click one and you see agents fighting at the door to get inside and trade." |
| 0:22–0:30 | **SR-4**: Store detail overlay — show trade lanes filling up (BUY/CALL/PUT/SHORT bars animating), golden ticket checkmarks, door fighting dots pulsing | **Poorav (VO):** "Inside, agents split across four trade lanes — buy, short, call, put — all driven by real market data." |
| 0:30–0:35 | **SR-5**: POV mode — walking through the city at street level, agents running past | **Poorav (VO):** "And you can walk through it yourself in first person." |

---

### SCENE 3 — The Data Pipeline (0:35–0:55)

| Time | Visual | Audio/Narration |
|------|--------|-----------------|
| 0:35–0:41 | **FC-3**: Ryan on camera | **Ryan:** "Our backend streams live data from Databricks through a FastAPI pipeline — regime detection, sentiment, agent flows — all in real time." |
| 0:41–0:46 | **[Replit animated graphic]**: Animated medallion pipeline diagram: Kaggle CSV &rarr; Bronze &rarr; Silver (50+ features) &rarr; Gold (ML models) &rarr; JSON &rarr; Browser. Each stage lights up in sequence. | **Ryan (VO):** "Six hundred thousand rows of Yahoo Finance data flow through our Databricks medallion pipeline." |
| 0:46–0:51 | **SR-13**: Navbar showing green "LIVE" badge pulsing, then cut to **SR-6**: Time slider scrubbing from 2019 to 2026 | **Ryan (VO):** "Bronze ingestion, silver feature engineering, gold scoring — all the way to the browser." |
| 0:51–0:55 | **[Replit animated graphic]**: FastAPI backend diagram — REST endpoints fanning out: /regime, /sentiment, /stocks, /inject-news + WebSocket stream | **Ryan (VO):** "Our FastAPI backend serves it all over REST and WebSocket." |

---

### SCENE 4 — The ML Models (0:55–1:20)

| Time | Visual | Audio/Narration |
|------|--------|-----------------|
| 0:55–1:02 | **FC-4**: Kashish on camera | **Kashish:** "We trained FinBERT for sentiment, a Hidden Markov Model for market regimes, and built a golden ticket system that scores every stock on five dimensions." |
| 1:02–1:07 | **[Replit animated graphic]**: Golden Ticket pyramid — 5 tiers stacking up: Sour Candy Drop &rarr; Jawbreaker &rarr; Fortune Cookie &rarr; Taffy Pull &rarr; Golden Gummy Bear &rarr; Wonka Bar (platinum) at top, glowing gold | **Kashish (VO):** "Drawdown depth, volume shock, return asymmetry, market dislocation, and full convexity — if a stock hits all five, it earns a platinum Wonka Bar." |
| 1:07–1:14 | **SR-14**: Candy particles falling around a platinum store, then **SR-11**: Shock propagation — click a node, BFS wave flashes across the 3D graph | **Kashish (VO):** "Platinum stores glow in the city. And on our playground page, you can shock-propagate through the entire correlation network." |
| 1:14–1:20 | **SR-10**: Agent heatmap on `/agents` page — treemap cells going from blue to red as agents pile in | **Kashish (VO):** "Our agent reactions dashboard shows the herd in real time — which stores are hot, which are cold." |

---

### SCENE 5 — The AI Agents (1:20–1:50)

| Time | Visual | Audio/Narration |
|------|--------|-----------------|
| 1:20–1:26 | **SR-7**: Whale leaderboard showing 4 funds ranked, expand Gemini chain showing sector analyst reports and final allocations | **Ibe (VO):** "Four AI whale funds compete in real time. Wonka Fund runs a three-layer Gemini hierarchy — eleven sector analysts, a portfolio manager, and a risk desk." |
| 1:26–1:32 | **[Replit animated graphic]**: Gemini 3-layer diagram: 11 colored sector boxes at top &rarr; arrows to single PM box &rarr; arrow to Risk Desk &rarr; arrow to "Agent Swarm". Each layer lights up in sequence. | **Ibe (VO):** "Slugworth plays momentum. Oompa buys dips. Gobstopper goes contrarian. Every fifteen seconds, ten thousand agents get new orders." |
| 1:32–1:38 | **SR-8**: Paste a news URL into Future Predictions, Gemini returns BULLISH sentiment with affected tickers | **Ibe (VO):** "Inject breaking news and watch Gemini analyze it instantly — sentiment, affected tickers, trade signals." |
| 1:38–1:44 | **SR-9**: Stock network page — 3D force graph rotating, sector clusters visible, drag the correlation slider | **Ibe (VO):** "Our network view maps all five hundred stocks by correlation strength." |
| 1:44–1:50 | **SR-12**: Trade journal — paste notes, neural network appears with particles flowing from tickers through patterns to win/loss nodes | **Ibe (VO):** "And the trade journal turns your notes into a visual neural network — mapping which patterns actually made money." |

---

### SCENE 6 — Closing (1:50–2:10)

| Time | Visual | Audio/Narration |
|------|--------|-----------------|
| 1:50–1:56 | Quick montage (1s each): **SR-15** sector filter toggle, **SR-5** POV walking, **SR-3** camera fly-to, **SR-11** shock wave, **SR-14** candy particles, **SR-2** agent swarm | *[Music crescendo]* |
| 1:56–2:00 | **FC-5**: Ibe on camera | **Ibe:** "Wolf of Wall Sweet. Five hundred stocks. Ten thousand agents. One candy city." |
| 2:00–2:05 | **[Replit animated]**: Logo/title card — "WOLF OF WALL SWEET" in gold on dark background, candy cane underline animation, team names fade in below | *[Music resolves]* |
| 2:05–2:10 | **[Replit animated]**: Tech stack icons grid fade in: React, Three.js, Databricks, Gemini, FastAPI, Zustand, D3, Vite. URL: **wolfofwallsweet.tech** | *[Music out]* |

---

## REPLIT ANIMATION DELIVERABLES

These are the animated graphics Replit needs to generate (not screen recordings):

| ID | Description | Style | Duration |
|----|-------------|-------|----------|
| **RA-1** | Medallion pipeline flow diagram — Kaggle &rarr; Bronze &rarr; Silver &rarr; Gold &rarr; JSON &rarr; Browser. Each node lights up left-to-right with a gold pulse traveling along the arrows. | Dark background, gold/pink/purple palette, clean sans-serif labels | 5s |
| **RA-2** | FastAPI endpoint fan-out — Central "FastAPI :8000" node with 6 endpoints radiating outward + WebSocket stream pulsing | Same dark palette, thin animated connection lines | 4s |
| **RA-3** | Golden Ticket pyramid — 5 tiers building upward with candy names, platinum Wonka Bar at top glowing | Candy colors per tier, gold glow on platinum | 5s |
| **RA-4** | Gemini 3-layer hierarchy — 11 sector boxes &rarr; PM &rarr; Risk Desk &rarr; Agent Swarm. Animated data flowing down through layers. | Gold arrows, sector colors on analyst boxes | 6s |
| **RA-5** | Title card — "WOLF OF WALL SWEET" with candy cane underline drawing itself, team names fade in: Ibe (Data/ML), Poorav (UX/UI), Ryan (Backend), Kashish (ML) | Gold text on #0c0a14 dark, Inter font | 5s |
| **RA-6** | Tech stack grid — 8 icons (React, Three.js, Databricks, Gemini, FastAPI, Zustand, D3, Vite) appear in a 4x2 grid with staggered fade-in. URL appears below. | Minimal, icon-forward, wolfofwallsweet.tech in gold | 5s |

---

## RECORDING CHECKLIST

Before recording, make sure:

- [ ] Site is live at wolfofwallsweet.tech (or run `npm run dev` locally)
- [ ] Backend is running (`cd backend && uvicorn app.main:app --port 8000`)
- [ ] Gemini API key is set (for whale chain + predictions to work)
- [ ] Browser is full-screen, 1080p minimum, no bookmarks bar visible
- [ ] Dark mode OS (matches the app's dark theme)
- [ ] Smooth, deliberate mouse movements — no jittery clicks
- [ ] For face cam: good lighting, clean background, look at camera not screen
- [ ] Record each clip separately — easier to hand to Replit for assembly

## FILE HANDOFF TO REPLIT

Give Replit:
1. This script (VIDEO_SCRIPT.md)
2. All SR-* screen recording clips (labeled SR-1.mp4 through SR-15.mp4)
3. All FC-* face cam clips (labeled FC-1.mp4 through FC-5.mp4)
4. A background music track (royalty-free, upbeat/techy, 2:10 length)
5. The project logo or title text if you have one
6. Reference: the architecture diagram at `/Users/ibe/Downloads/finalitty_diagram.html` for visual style/colors

Replit will generate RA-1 through RA-6 animations and assemble everything per the timeline above.
