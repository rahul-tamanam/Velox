# Velox

**Tagline:** Portfolio management built for humans — not hedge funds.

Velox is a localhost-only portfolio workspace for beginner investors. It blends plain-English KPIs, macro-aware signals powered by FRED, Monte Carlo simulation, and a fully implemented Velox Macro-Aware Momentum backtest (2020–2024) with regime-shaded charts.

## Setup

```bash
cd vestiq
npm run install:all
```

Copy `.env.example` to `.env` and fill in secrets:

- `FRED_API_KEY` — free key from [FRED API keys](https://fred.stlouisfed.org/docs/api/api_key.html)
- `GROQ_API_KEY` — optional; enables the Velox Assistant chat drawer ([GroqCloud](https://console.groq.com))
- `GROQ_MODEL` — optional; defaults to `llama-3.3-70b-versatile` (any model your Groq project supports)
- `JWT_SECRET` — any long random string for local JWT signing
- **`NEWS_API_KEY`** — optional [NewsAPI.org](https://newsapi.org) key; merges extra articles with Yahoo Finance search results per holding ticker
- **`YAHOO_FINANCE_RAPIDAPI_KEY`** / **`YAHOO_FINANCE_RAPIDAPI_HOST`** — optional; if public Yahoo HTTP is rate-limited or blocked, a RapidAPI Yahoo-style product can be used for quotes (aliases: `RAPIDAPI_KEY`, `RAPIDAPI_HOST`). Charts and beta still use Yahoo’s public `chart` and `quoteSummary` endpoints.

Start both servers:

```bash
npm run dev
```

- API: `http://localhost:5000`
- Client (Vite): `http://localhost:5173` (proxies `/api` → `:5000`)

### Node version

The API uses the built-in **`node:sqlite`** module (no native addons). Use **Node.js 22.5+** (your Node 24 install is fine).

## Demo credentials

- Email: `demo@velox.com`
- Password: `demo1234`

If you used an older database with `demo@vestiq.com`, the server migrates that row to `demo@velox.com` on startup.

## Feature highlights

- JWT + bcrypt authentication with SQLite persistence
- Portfolio dashboard with live Yahoo quotes, beta estimates, and Stocks vs Funds split
- Health score ring driven by diversification, volatility, goal alignment, and buffer heuristics
- FRED-backed macro regime badge (GDP growth + Fed funds momentum)
- Monte Carlo engine (1,000 geometric Brownian paths, monthly steps)
- Velox Macro-Aware Momentum monthly backtest with regime history + defensive basket rotation
- Exit-cost calculator, what-if simulator, news sentiment feed (keyword scoring), Groq-powered assistant drawer

## Velox Macro-Aware Momentum (plain English)

1. **Risk-On:** When GDP is expanding and Fed policy is stable-or-easier, Velox hunts momentum among 11 diversified ETFs, filters for strong 3-month trends, and concentrates into the top performers (equal-weight).
2. **Moderate:** Growth is fine but rates are rising faster — Velox still uses momentum but spreads across more names (top three, no hard momentum cutoff).
3. **Risk-Off:** When the macro picture deteriorates, Velox ignores momentum and rotates into a defensive sleeve: gold, long Treasuries, T-bills, and listed real estate — then rebalances monthly until conditions improve.

Historical GDP uses FRED series `A191RL1Q225SBEA`; Fed funds use `FEDFUNDS`.

## Tech stack

| Layer    | Technology                                       |
|----------|---------------------------------------------------|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion       |
| Charts   | Recharts, TradingView Lightweight Charts          |
| Backend  | Node.js, Express                                  |
| Database | SQLite via built-in `node:sqlite` (`DatabaseSync`) |
| Auth     | JWT + bcrypt                                      |
| Market   | Yahoo Finance public APIs (quote, chart, quoteSummary); optional RapidAPI for quotes |
| Macro    | FRED REST API (`axios` + `node-cache` TTL 24h)    |
| AI       | Groq (OpenAI-compatible chat completions)         |

## FRED series IDs

| Metric            | Series ID        |
|-------------------|------------------|
| Real GDP % change | `A191RL1Q225SBEA`|
| Fed funds level   | `FEDFUNDS`       |
