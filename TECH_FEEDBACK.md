# Technology Feedback — Hacklytics 2026

---

## Databricks

Databricks was the backbone of our entire data pipeline. We built a full Bronze-Silver-Gold medallion architecture inside Unity Catalog, processing 602K rows of Yahoo Finance data across 20 PySpark scripts and 11 Delta Lake tables.

**What worked well:** Unity Catalog made organizing our `sweetreturns` schema incredibly clean — `sweetreturns.bronze.raw_stock_data`, `sweetreturns.silver.daily_features`, `sweetreturns.gold.golden_tickets` — the naming convention alone made our pipeline self-documenting. Delta Lake Time Travel was critical for us: we used it to prove zero lookahead bias in our golden ticket scoring system by verifying that no crash-era rows were retroactively modified. That single feature gave us confidence that our entire financial signal pipeline was legitimate.

**What was challenging:** The official Databricks SQL Connector would silently hang on connection from our FastAPI backend, blocking the entire server with no timeout or error. We burned hours debugging this before switching to the raw SQL Statement REST API (`POST /api/2.0/sql/statements/`), which gave us explicit control over timeouts and error handling. The REST API worked flawlessly — we just wish the connector had the same reliability. Warehouse cold starts also cost us time during the hackathon; having a serverless warehouse warm up in 30+ seconds made rapid iteration on gold-layer queries painful.

**Verdict:** Databricks is genuinely powerful for structured data pipelines at scale. Delta Lake's ACID guarantees and time travel are not gimmicks — they solved a real data integrity problem for us. We'd use it again without hesitation, but we'd skip the SQL connector entirely and go straight to the REST API.

---

## PySpark

PySpark powered all of our feature engineering in the Silver layer — 50+ technical indicators computed across 491 tickers and 5 years of daily data using Window functions.

**What worked well:** PySpark's Window functions were perfect for financial feature engineering. Computing rolling RSI, MACD, Bollinger Bands, Z-scores, drawdowns, and forward return percentiles across partitions of (ticker, date) felt natural. The `partitionBy("ticker").orderBy("date")` pattern meant every feature was automatically computed per-stock in chronological order with no manual grouping. We also used `pandas_udf` to run our FinBERT sentiment model inside Spark, which let us score thousands of news headlines without leaving the pipeline.

**What was challenging:** Debugging PySpark transformations is painful compared to Pandas. When a Window function produces wrong results, there's no easy way to inspect intermediate state — you have to `.show()` at every step and squint at the output. We also hit issues with null handling in rolling calculations: PySpark's behavior with nulls in window aggregations is different from Pandas, and our first pass at RSI and Bollinger Bands had subtle bugs because of it. Type coercion between PySpark and Delta Lake column types also caused silent data issues that took time to track down.

**Verdict:** PySpark is the right tool for financial feature engineering at this scale — 602K rows with 50+ derived columns per row would have been slow in Pandas. The Window function API is elegant once you internalize it. But the debugging experience needs work; we spent more time validating PySpark output than writing the transformations.

---

## Sphinx

We used Sphinx to generate structured documentation for our Databricks pipeline and data science methodology. With 20 pipeline scripts, 11 Delta tables, and a 48KB architecture spec, we needed documentation that could keep up with a fast-moving hackathon codebase.

**What worked well:** Sphinx's reStructuredText format and autodoc extensions let us pull docstrings directly from our Python pipeline scripts into rendered documentation. Cross-referencing between our bronze, silver, and gold layer docs meant we could link table schemas to the notebooks that produce them. The output looked professional and was useful for onboarding teammates mid-hackathon — instead of explaining the pipeline verbally, we could point to the rendered docs.

**What was challenging:** Sphinx's configuration (`conf.py`, `index.rst`, toctree structure) has a steep initial setup cost, especially under hackathon time pressure. The reStructuredText syntax feels dated compared to Markdown — we kept making formatting mistakes. Getting the build to work with our project structure (Python scripts in `databricks/` that aren't a proper package) required workarounds. For a 36-hour hackathon, the setup-to-value ratio was borderline — we probably spent 2 hours configuring Sphinx that could have gone toward features.

**Verdict:** Sphinx produces great documentation, but the setup overhead is high for a hackathon. If we did it again, we'd either start from a pre-configured Sphinx template or just use a simpler Markdown-based doc generator. That said, having proper docs for a 20-script data pipeline was worth it for team coordination.

---

## Replit (Animation for Demo Video)

We used Replit to generate animated graphics for our demo video — pipeline flow diagrams, the golden ticket pyramid, Gemini AI hierarchy visualization, and the title card. Instead of screen-recording static slides, we wanted motion graphics that matched our app's dark gold-and-purple aesthetic.

**What worked well:** Replit's ability to quickly scaffold and run small animation projects was ideal for producing short motion graphics. We could describe what we wanted — "a medallion pipeline where each stage lights up left to right with a gold pulse" — and iterate on the animation code in real time with hot reload. The browser-based environment meant no local setup, and we could share the project link with teammates for review instantly. For a hackathon where you need polished visuals fast, it removed a lot of friction.

**What was challenging:** Fine-tuning animation timing and easing curves required a lot of trial and error. Getting our exact color palette (`#FFD700` gold, `#0c0a14` dark background, `#FF69B4` pink accents) to match across multiple animation snippets took manual effort. Exporting the final animations as video clips that could be composited into our demo also required extra steps — there's no one-click "export as MP4" from a canvas animation. We ended up screen-recording the Replit preview, which felt like a workaround.

**Verdict:** Replit was a surprisingly good tool for producing hackathon demo video assets. The speed of iteration beat any traditional motion graphics tool for our needs. We'd love a smoother export pipeline for video output, but for rapid prototyping of animated diagrams, it delivered.

---

## Claude (Claude Code)

Claude Code was our primary architecture and engineering tool throughout the entire hackathon. We used it for system design, code generation, debugging, documentation, and even writing this Devpost submission.

**What worked well:** Claude Code's ability to explore an entire codebase — reading files, grepping for patterns, understanding how components connect — made it an incredibly effective pair programmer. We'd describe a feature ("add a whale leaderboard that shows 4 competing funds ranked by profit") and Claude would read the existing Zustand store, the simulation hook, the component patterns, and produce code that integrated cleanly with what was already there. The context window meant it could hold our entire architecture in memory and make changes that were consistent across files. For a 36-hour hackathon, this was the difference between building 2 pages and building 6.

It was also invaluable for our Databricks pipeline. Writing PySpark Window functions for 50+ financial indicators is tedious and error-prone — Claude generated the feature engineering code, the golden ticket scoring logic, and the validation notebooks, all while maintaining awareness of the lookahead bias constraints we specified. The 2008 crash validation that proved zero data leakage across our entire pipeline was designed and implemented with Claude.

**What was challenging:** Claude occasionally generated code that looked correct but had subtle issues — a Zustand selector that caused unnecessary re-renders, a Three.js material that wasn't disposed properly, a PySpark Window frame that included the current row when it shouldn't have. These bugs were hard to catch because the code was syntactically perfect and logically plausible. We learned to always test Claude's output rather than trusting it blindly, especially for financial calculations where a subtle off-by-one in a window function could introduce lookahead bias.

**Verdict:** Claude Code was the most impactful tool we used at this hackathon, full stop. It didn't replace our engineering judgment — we still designed the architecture, made the trade-offs, and validated the output — but it multiplied our velocity by at least 3-4x. The ability to say "read the whole codebase and add this feature" and get a working implementation that respects existing patterns is transformative for hackathon-speed development.

---

## Figma Make

We used Figma Make for rapid UI prototyping and generating design assets — component layouts, color palette exploration, and visual mockups of our 6 pages before building them in React.

**What worked well:** Figma Make's AI-assisted design generation let us go from "dark candy-themed stock dashboard" to a visual mockup in minutes. We used it to explore different layouts for the store detail overlay, the whale leaderboard panel, and the time slider before committing to code. Having a visual reference that the whole team could comment on prevented the "build it, hate it, rebuild it" cycle that eats hackathon hours. The component-level generation was particularly useful — we'd describe a UI element ("a draggable leaderboard panel with gold accents, dark glass background, and expandable agent cards") and get a mockup we could hand to the frontend developer as a spec.

**What was challenging:** The generated designs sometimes defaulted to generic SaaS dashboard aesthetics that didn't match our candy/Willy Wonka theme. We had to manually push the designs toward our specific palette (dark navy `#1a1a2e`, gold `#FFD700`, pink `#FF69B4`, purple `#9370DB`) and aesthetic (frosted glass panels, candy cane motifs, pulsing glow effects). The gap between "Figma mockup" and "React + Three.js implementation" was also significant — 3D scene UI overlays behave differently than flat Figma frames, so the mockups were more inspirational than pixel-accurate.

**Verdict:** Figma Make was useful for rapid ideation and team alignment on visual direction. It's not a replacement for building the actual UI — especially for a 3D app where overlays interact with a Three.js canvas — but it saved us from going in circles on layout decisions. For hackathons, the speed of getting a visual starting point is worth the trade-off of needing to adapt the designs during implementation.
