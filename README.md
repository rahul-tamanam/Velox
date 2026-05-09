# Velox


Velox is a localhost-only portfolio workspace designed for beginner and intermediate investors. It blends plain-English KPIs, macro-aware signals powered by the FRED economic data API, a 1,000-path Monte Carlo simulation engine, and a fully implemented **Velox Macro-Aware Momentum** monthly backtest (2020 to present) with regime-shaded charts. The project ships with a polished React + Vite client, an Express + SQLite API, and an optional Groq-powered AI assistant.

---

## Table of Contents

1. [Overview](#overview)
2. [Feature Highlights](#feature-highlights)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Prerequisites](#prerequisites)
6. [Installation](#installation)
7. [Environment Variables](#environment-variables)
8. [Running the App](#running-the-app)
9. [Demo Credentials](#demo-credentials)
10. [API Reference](#api-reference)
11. [Velox Macro-Aware Momentum Algorithm](#velox-macro-aware-momentum-algorithm)
12. [Monte Carlo Engine](#monte-carlo-engine)
13. [FRED Series IDs](#fred-series-ids)
14. [Health Score Logic](#health-score-logic)
15. [Database & Persistence](#database--persistence)
16. [NPM Scripts](#npm-scripts)
17. [Troubleshooting](#troubleshooting)
18. [Roadmap](#roadmap)
19. [License & Disclaimer](#license--disclaimer)

---

## Overview

Velox turns a beginner's portfolio into something they can actually understand and stress-test. Where most retail tools dump tickers and percentages on a screen, Velox layers on:

* **Macro context** from FRED (GDP growth, Fed funds rate momentum) so the user knows which environment they are investing in.
* **Forward-looking simulations** (Monte Carlo + the proprietary Velox Macro-Aware Momentum backtest) so they can rehearse decisions instead of guessing.
* **Plain-English KPIs** (Health Score ring, Stocks vs Funds split, exit-cost calculator, what-if shocks) so jargon never blocks comprehension.
* **An optional AI assistant** powered by Groq that already knows the user's holdings summary and current macro regime when invoked.

Everything runs on `localhost`. No data leaves the machine except for outbound calls to Yahoo Finance, FRED, optional NewsAPI, and optional Groq.

---

## Feature Highlights

### Authentication & Persistence
* JWT + bcrypt authentication with SQLite persistence via Node's built-in `node:sqlite` (`DatabaseSync`), so there are no native addons to compile.
* Automatic legacy-row migration: any old `demo@vestiq.com` row is rewritten to `demo@velox.com` on startup.

### Portfolio Dashboard
* Live Yahoo Finance quotes, weighted **portfolio beta** estimates, and an automatic **Stocks vs Funds** split.
* Today's change %, total return %, and total market value, all refreshed from a single quote endpoint.
* Concentration penalty applied when any single holding dominates the portfolio.

### Health Score Ring
A single animated ring blending four heuristics:
1. Diversification (number of holdings + concentration).
2. Volatility proxy (weighted historical sigma).
3. Goal alignment (does projected median outcome reach the target?).
4. Buffer (cash and stable-asset cushion).

### Macro Regime Badge
* FRED-backed badge showing the current regime: **Risk-On**, **Moderate**, or **Risk-Off**.
* Cached for 24 hours via `node-cache` to stay well inside FRED's free-tier quotas.

### Monte Carlo Simulation
* 1,000 geometric Brownian motion paths.
* Monthly time steps with optional monthly contribution.
* Per-ticker historical mu/sigma estimated from 5 years of Yahoo daily data; portfolio mu/sigma is the weighted aggregation.
* Outputs a fan chart (p10, p25, p50, p75, p90), median final value, p10 worst case, and probability of hitting the user's goal.

### Velox Macro-Aware Momentum Backtest
* Monthly rebalance from January 2020 through the latest closed month.
* Regime-shaded equity curve plotted against SPY buy-and-hold.
* Position history table showing exact weights for each month.
* Configurable starting corpus, clamped between $1,000 and $100,000,000.

### Tools
* **Exit-cost calculator** that estimates tax drag and trading friction.
* **What-if simulator** that applies a shock %, computes new portfolio value, implied return, before/after Health Score, and a rebalance recommendation tier.
* **News sentiment feed** combining Yahoo Finance ticker search results with optional NewsAPI articles, scored by keyword sentiment.
* **Velox Assistant** chat drawer (Groq-powered) seeded with the live portfolio summary and macro regime.

---

## Tech Stack

| Layer    | Technology                                                           |
|----------|----------------------------------------------------------------------|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion, React Router v6         |
| Charts   | Recharts, TradingView Lightweight Charts, custom `@visx` SVG chart   |
| Backend  | Node.js, Express                                                     |
| Database | SQLite via built-in `node:sqlite` (`DatabaseSync`), no native build  |
| Auth     | JWT (`jsonwebtoken`) + bcrypt (`bcryptjs`)                           |
| Market   | Yahoo Finance public APIs (`quote`, `chart`, `quoteSummary`); optional RapidAPI Yahoo-style host for quotes |
| Macro    | FRED REST API (`axios` + `node-cache`, TTL 24h)                      |
| News     | Yahoo Finance search + optional NewsAPI.org                          |
| AI       | Groq (OpenAI-compatible chat completions, default `llama-3.3-70b-versatile`) |
| Tooling  | `concurrently`, `nodemon`, `dotenv`                                  |

---

## Project Structure

```
velox/
├── client/                          # Vite + React frontend
│   ├── src/
│   │   ├── pages/                   # Landing.jsx, Dashboard.jsx, etc.
│   │   ├── components/
│   │   │   └── charts/              # VeloxBacktestAreaChart.jsx, etc.
│   │   ├── index.css                # Tailwind layers + design tokens
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── server/                          # Express API
│   ├── index.js                     # Entry point, middleware wiring
│   ├── db.js                        # SQLite bootstrap + migrations
│   ├── middleware/
│   │   └── auth.js                  # JWT verification
│   ├── routes/
│   │   ├── auth.js                  # /api/auth (login, register, profile)
│   │   ├── portfolio.js             # /api/portfolio (summary, holdings)
│   │   ├── stocks.js                # /api/stocks (quotes, history, beta)
│   │   ├── simulate.js              # /api/simulate (montecarlo, backtest)
│   │   ├── chatbot.js               # /api/chatbot (Groq proxy)
│   │   ├── macro.js                 # /api/macro (regime payload)
│   │   ├── news.js                  # /api/news
│   │   ├── tools.js                 # /api/tools (exit cost, what-if)
│   │   └── ai.js                    # /api/ai (auxiliary AI helpers)
│   ├── engines/
│   │   ├── monteCarlo.js            # 1,000-path GBM engine
│   │   ├── macroAwareMomentum.js    # Backtest + regime selector
│   │   └── macroEngine.js           # FRED fetch + regime classifier
│   ├── services/
│   │   └── yahooMarket.js           # Quote/chart helpers, RapidAPI fallback
│   └── velox.db                     # SQLite file (gitignored)
├── package.json                     # Root workspace + scripts
├── .env.example
├── .env                             # gitignored
└── README.md
```

---

## Prerequisites

* **Node.js 22.5+** required because the API uses the built-in `node:sqlite` module. Node 24 works fine.
* **npm** (ships with Node).
* A free **FRED API key** from [https://fred.stlouisfed.org/docs/api/api_key.html](https://fred.stlouisfed.org/docs/api/api_key.html).
* (Optional) A **Groq API key** from [https://console.groq.com](https://console.groq.com) for the AI assistant.
* (Optional) A **NewsAPI.org** key for richer per-ticker headlines.
* (Optional) A **RapidAPI** Yahoo-style host if public Yahoo HTTP is rate-limited in your environment.

---

## Installation

Clone the repo and install both workspaces in one shot:

```bash
git clone <your-fork-url> velox
cd velox
npm run install:all
```

This runs `npm install` at the root and inside `client/`. The root `package.json` carries the API dependencies (Express, axios, bcrypt, JWT, etc.). `client/package.json` carries the Vite + React stack.

---

## Environment Variables

Copy the example file and fill in the secrets:

```bash
cp .env.example .env
```

| Variable                      | Required | Purpose                                                                                  |
|-------------------------------|----------|------------------------------------------------------------------------------------------|
| `JWT_SECRET`                  | Yes      | Any long random string. Used to sign JWTs. Server refuses to boot if shorter than 8 chars. |
| `FRED_API_KEY`                | Yes      | Free key from FRED. Drives macro regime classification.                                  |
| `PORT`                        | No       | API port. Defaults to `5000`.                                                            |
| `GROQ_API_KEY`                | No       | Enables the Velox Assistant chat drawer.                                                 |
| `GROQ_MODEL`                  | No       | Defaults to `llama-3.3-70b-versatile`. Any model your Groq project supports.             |
| `NEWS_API_KEY`                | No       | Optional NewsAPI.org key. Merges with Yahoo Finance ticker search results.               |
| `YAHOO_FINANCE_RAPIDAPI_KEY`  | No       | Fallback quote source if public Yahoo HTTP is blocked. Alias: `RAPIDAPI_KEY`.            |
| `YAHOO_FINANCE_RAPIDAPI_HOST` | No       | RapidAPI host header. Alias: `RAPIDAPI_HOST`. Charts and beta still use public Yahoo.    |

> **Security note:** never commit `.env`. It is already listed in `.gitignore` along with `*.db`, `node_modules/`, and `dist/`.

---

## Running the App

### Development (both servers, hot-reload)

```bash
npm run dev
```

This boots:

* **API** on `http://localhost:5000`, supervised by `nodemon`.
* **Client (Vite)** on `http://localhost:5173`, with `/api` proxied to port `5000`.

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production build of the client

```bash
cd client
npm run build
npm run preview
```

The preview server serves the production bundle locally.

### Running the API alone

```bash
node server/index.js
```

A health check is available at `GET /api/health`, returning `{ ok: true, service: "velox-api" }`.

---

## Demo Credentials

A demo account is seeded automatically:

* **Email:** `demo@velox.com`
* **Password:** `demo1234`

If you previously ran an older build with `demo@vestiq.com`, the server migrates that row to `demo@velox.com` on startup, so the same password keeps working.

---

## API Reference

All authenticated routes expect `Authorization: Bearer <jwt>`.

### Auth (`/api/auth`)
* `POST /register` create user.
* `POST /login` returns JWT.
* `GET /me` returns the current user profile.
* `PATCH /me` updates goal target, risk profile, etc.

### Portfolio (`/api/portfolio`)
* `GET /summary` returns total value, cost basis, today's change %, total return %, weighted beta, Health Score, and Stocks vs Funds split.
* `GET /holdings` returns the holdings list with live quotes.
* `POST /holdings` adds a holding.
* `DELETE /holdings/:id` removes a holding.

### Stocks (`/api/stocks`)
* `GET /quote/:ticker` proxied Yahoo quote.
* `GET /history/:ticker?range=...&interval=...` chart history.
* `GET /beta/:ticker` 5-year monthly beta vs SPY.

### Simulate (`/api/simulate`)
* `POST /montecarlo` body: `{ holdings, horizon, contribution, goalAmount }`. Returns fan chart, median final value, p10 worst case, probability of hitting goal.
* `GET /backtest?corpus=100000` runs the Velox Macro-Aware Momentum backtest. Corpus is clamped to `[1,000, 100,000,000]`.

### Macro (`/api/macro`)
* `GET /regime` returns `{ regime, gdpGrowth, fedFunds, fedFundsMomentum, asOf }`.

### News (`/api/news`)
* `GET /:ticker` returns merged Yahoo + optional NewsAPI articles with keyword sentiment scoring.

### Tools (`/api/tools`)
* `POST /exit-cost` estimates tax + friction drag of liquidating a position.
* `POST /whatif` body: `{ shockPct, holdings }`. Returns new portfolio value, implied return %, Health Score before/after, and a rebalance recommendation tier.

### Chatbot (`/api/chatbot`)
* `POST /` proxies to Groq with the user's portfolio summary + macro regime injected into the system prompt.

### Health
* `GET /api/health` returns `{ ok: true, service: "velox-api" }`.

---

## Velox Macro-Aware Momentum Algorithm

A monthly-rebalanced rotation strategy that switches between three regimes based on FRED macro signals.

### Regime Classification

Inputs:
* Real GDP % change (FRED series `A191RL1Q225SBEA`).
* Federal funds rate level (FRED series `FEDFUNDS`) and its 6-month momentum.

| Regime    | Trigger                                                              |
|-----------|----------------------------------------------------------------------|
| Risk-On   | GDP expanding **and** Fed policy stable or easing.                   |
| Moderate  | Growth still positive **but** Fed funds rising at an accelerating pace. |
| Risk-Off  | Macro picture deteriorating (negative GDP read or aggressive tightening). |

### Allocation Logic

1. **Risk-On.** Velox screens an 11-ETF diversified universe, filters for strong 3-month momentum, and concentrates equal-weight into the top performers.
2. **Moderate.** Velox still uses momentum but spreads across the top three names with no hard momentum cutoff, accepting more diversification in exchange for less conviction.
3. **Risk-Off.** Velox ignores momentum and rotates into a defensive sleeve: gold, long-duration Treasuries, T-bills, and listed real estate. It rebalances monthly until conditions improve.

### Outputs

The `/api/simulate/backtest` endpoint returns:
* `portfolioValues` array, monthly equity curve.
* `dates` matching month-end labels.
* `regimeHistory` array (one regime tag per month).
* `positionHistory` detailing each rebalance with weights and date range.
* `spyBenchmark` parallel SPY buy-and-hold curve.
* `stats` object with total return %, CAGR, max drawdown, etc.
* `corpus` echoed back (clamped).

### Visualization

The frontend renders a regime-shaded area chart (`VeloxBacktestAreaChart`) overlaying the strategy curve on SPY, with vertical bands for Risk-On / Moderate / Risk-Off periods and a tooltip that interpolates both series at the cursor's date.

---

## Monte Carlo Engine

Located in `server/engines/monteCarlo.js`.

### Method
1. For each holding, fetch 5 years of daily adjusted closes from Yahoo.
2. Compute log returns, then annualize: `mu = exp(dailyMean * 252) - 1`, `sigma = dailySigma * sqrt(252)`.
3. Default fallback if data is missing: `mu = 0.07`, `sigma = 0.18`.
4. Aggregate to portfolio level using weights: `muP = sum(w_i * mu_i)`, `sigmaP = sqrt(sum((w_i * sigma_i)^2))` (independence assumed; future versions may add a correlation matrix).
5. Run 1,000 paths of geometric Brownian motion with monthly steps (`dt = 1/12`) for the chosen horizon (clamped 1 to 30 years).
6. Optional monthly contribution is added at the start of each step before the GBM update.
7. Compute percentiles (p10, p25, p50, p75, p90) per month for the fan chart.
8. Compute median final value, p10 worst case, and (if a goal is set) the share of paths that finish at or above the goal.

### Output Shape

```json
{
  "fanChart": [{ "month": 0, "p10": ..., "p25": ..., "p50": ..., "p75": ..., "p90": ... }],
  "medianFinal": 184325.12,
  "probHitGoal": 0.62,
  "worstCaseP10": 92110.55,
  "initialValue": 100000,
  "horizonYears": 10
}
```

---

## FRED Series IDs

| Metric                  | Series ID         |
|-------------------------|-------------------|
| Real GDP, % change      | `A191RL1Q225SBEA` |
| Effective Federal funds | `FEDFUNDS`        |

Cached for 24 hours via `node-cache` to respect FRED's free-tier limits.

---

## Health Score Logic

The Health Score (0 to 100) is a weighted blend:

* **Diversification (0 to 30 pts).** Penalizes single-name concentration; rewards 8+ holdings spread across types.
* **Volatility (0 to 25 pts).** Inverse-mapped from weighted portfolio sigma. Lower sigma => more points.
* **Goal alignment (0 to 25 pts).** Compares Monte Carlo median final value to the user's goal target.
* **Buffer (0 to 20 pts).** Rewards cash and stable allocations sized for short-term needs.

A `concentrationPenalty` is subtracted when any single holding exceeds a threshold share of total value. The Health Score is recomputed live whenever holdings, goals, or the macro regime change.

---

## Database & Persistence

* SQLite file lives at `server/velox.db`. Gitignored.
* Bootstrap and migrations run on every server start (`server/db.js`).
* Tables include `users`, `holdings`, and supporting indices.
* No ORM. Plain `DatabaseSync` prepared statements keep dependencies lean and Node-native.

---

## NPM Scripts

### Root
* `npm run install:all` installs root + client dependencies.
* `npm run dev` starts API and client concurrently.
* `npm run server` starts only the API with nodemon.
* `npm run client` starts only the Vite dev server.

### Client (`client/`)
* `npm run dev` Vite dev server.
* `npm run build` production bundle into `client/dist`.
* `npm run preview` serve the production bundle locally.

---

## Troubleshooting

| Symptom                                              | Fix                                                                                                  |
|------------------------------------------------------|------------------------------------------------------------------------------------------------------|
| `[velox] Set JWT_SECRET in .env` then process exits  | Add a long random string to `JWT_SECRET` in `.env`.                                                  |
| `node:sqlite` module not found                       | Upgrade Node to 22.5 or higher.                                                                      |
| Yahoo quote calls failing with 429 / 401             | Set `YAHOO_FINANCE_RAPIDAPI_KEY` and `YAHOO_FINANCE_RAPIDAPI_HOST` to use a RapidAPI fallback.       |
| Macro regime stuck on a stale value                  | The 24-hour cache is intentional; restart the API or wait for the TTL to expire.                     |
| AI assistant button does nothing                     | `GROQ_API_KEY` not set, or the configured `GROQ_MODEL` is not enabled on your Groq project.          |
| Login fails for `demo@vestiq.com`                    | Use `demo@velox.com`. The startup migration rewrites the email automatically.                        |
| Vite proxy errors on `/api`                          | Make sure the API is running on port 5000 (or update the proxy target in `client/vite.config.js`).   |

---

## Roadmap

Items being considered for future iterations:

* Correlation matrix in the Monte Carlo aggregator (currently assumes independence between holdings).
* Configurable backtest universe from the UI (today the 11-ETF sleeve is hardcoded).
* Tax-lot aware exit-cost calculator (FIFO + LIFO + specific-lot).
* Multi-currency support.
* Optional Postgres adapter for users who outgrow SQLite.
* Read-only sharing links with redacted dollar amounts.

---

## License & Disclaimer

Velox is an educational prototype. Nothing in the application constitutes investment advice, a recommendation, or an offer to buy or sell securities. Backtest results are illustrative, calibrated on historical data, and do not guarantee future performance. Always consult a licensed financial professional before making investment decisions.

Source code is provided as-is for personal, non-commercial use unless a separate `LICENSE` file accompanies the repository.
