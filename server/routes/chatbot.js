const express = require('express');
const axios = require('axios');
const { authMiddleware } = require('../middleware/auth');
const db = require('../db');
const { fetchHoldingsNews } = require('../services/newsFeed');
const { getQuoteRow } = require('../services/yahooMarket');
const { isDemoMode } = require('../demo/demoMode');

/** Longer phrases first so "bank of america" beats "america". */
const COMPANY_TO_TICKER = Object.fromEntries(
  Object.entries({
    'bank of america': 'BAC',
    'jp morgan': 'JPM',
    jpmorgan: 'JPM',
    nvidia: 'NVDA',
    apple: 'AAPL',
    microsoft: 'MSFT',
    google: 'GOOGL',
    alphabet: 'GOOGL',
    amazon: 'AMZN',
    meta: 'META',
    facebook: 'META',
    tesla: 'TSLA',
    netflix: 'NFLX',
    amd: 'AMD',
    intel: 'INTC',
    goldman: 'GS',
    palantir: 'PLTR',
    coinbase: 'COIN',
  }).sort(([a], [b]) => b.length - a.length)
);

const TICKER_NOISE = new Set([
  'THE', 'AND', 'FOR', 'ANY', 'HOW', 'WHAT', 'WHO', 'WHEN', 'WHERE', 'WHY', 'USD', 'MY', 'OUR',
  'YOU', 'NOT', 'YES', 'ALL', 'CAN', 'HAS', 'ARE', 'WAS', 'WERE', 'GET', 'USE', 'THIS', 'THAT',
  'WITH', 'FROM', 'YOUR', 'HAVE', 'JUST', 'LIKE', 'SOME', 'THAN', 'THEN', 'THEY', 'THEM', 'VERY',
  'OUT', 'NOW', 'SEE', 'WAY', 'ITS', 'VIA', 'PER', 'OFF', 'TOP', 'NEW', 'OLD', 'LET', 'MAY',
  'IT', 'ON', 'OR', 'AN', 'AS', 'BE', 'AT', 'DO', 'GO', 'SO', 'UP', 'RISK',
]);

const router = express.Router();
router.use(authMiddleware);

const NEWS_CACHE_TTL_MS = 90_000;
let newsCache = { key: '', exp: 0, rows: [] };

function userWantsNews(messages) {
  const last = [...(messages || [])].reverse().find((m) => m.role === 'user');
  if (!last?.content) return false;
  return /\b(news|headlines?|articles?|breaking|latest\s+news|stock\s+news|market\s+headlines?|what'?s\s+in\s+the\s+news|any\s+stories)\b/i.test(
    last.content
  );
}

async function newsDigestForTickers(tickers) {
  const upper = [...new Set(tickers.map((t) => String(t).trim().toUpperCase()).filter(Boolean))].sort();
  if (!upper.length) return [];
  const key = upper.join(',');
  if (newsCache.key === key && Date.now() < newsCache.exp) {
    return newsCache.rows;
  }
  const all = await fetchHoldingsNews(upper);
  const rows = all.slice(0, 12).map((n) => ({
    ticker: n.ticker,
    title: n.title,
    url: n.url || '',
    source: n.source,
    publishedAt: n.publishedAt,
    sentiment: n.sentiment,
  }));
  newsCache = { key, exp: Date.now() + NEWS_CACHE_TTL_MS, rows };
  return rows;
}

function extractQuoteSymbols(text) {
  const lower = String(text).toLowerCase();
  const found = [];
  const seen = new Set();
  function add(sym) {
    const u = String(sym).toUpperCase();
    if (seen.has(u)) return;
    seen.add(u);
    found.push(u);
  }
  for (const [name, sym] of Object.entries(COMPANY_TO_TICKER)) {
    if (lower.includes(name)) add(sym);
  }
  const upper = String(text)
    .replace(/[^A-Za-z\s]/g, ' ')
    .toUpperCase();
  for (const p of upper.split(/\s+/)) {
    if (p.length >= 2 && p.length <= 5 && /^[A-Z]+$/.test(p) && !TICKER_NOISE.has(p)) add(p);
  }
  return found.slice(0, 4);
}

function userWantsPriceOrQuote(messages) {
  const last = [...(messages || [])].reverse().find((m) => m.role === 'user');
  if (!last?.content) return false;
  const t = last.content;
  if (extractQuoteSymbols(t).length === 0) return false;
  return /\b(price|prices|quote|quotes|cost|how much|worth|trading|share|shares|stock|ticker|current)\b/i.test(
    t
  );
}

function normalizeQuoteSnapshot(ticker, row) {
  if (!row) return null;
  const price =
    row.regularMarketPrice ??
    row.postMarketPrice ??
    row.ask ??
    row.price ??
    row.last;
  if (price == null || Number.isNaN(Number(price))) return null;
  const name =
    row.shortName ||
    row.longName ||
    row.displayName ||
    row.symbol ||
    String(ticker).toUpperCase();
  const currency = row.currency || 'USD';
  let asOf = null;
  if (row.regularMarketTime != null) {
    const rt = row.regularMarketTime;
    const ms = typeof rt === 'number' ? (rt > 1e12 ? rt : rt * 1000) : Date.parse(rt);
    if (!Number.isNaN(ms)) asOf = new Date(ms).toISOString();
  }
  const chartFallback = row.marketState === 'CHART_LAST_CLOSE';
  return {
    ticker: String(ticker).toUpperCase(),
    companyName: name,
    price: Number(price),
    currency,
    asOf,
    marketState: row.marketState || null,
    priceKind: chartFallback ? 'last_daily_close' : 'quote_api',
  };
}

async function fetchQuoteSnapshots(symbols) {
  const out = [];
  for (const sym of symbols) {
    try {
      const row = await getQuoteRow(sym);
      const snap = normalizeQuoteSnapshot(sym, row);
      if (snap) out.push({ ok: true, ...snap });
      else out.push({ ok: false, ticker: sym.toUpperCase(), error: 'No price in provider response' });
    } catch (e) {
      out.push({ ok: false, ticker: sym.toUpperCase(), error: e.message || 'Quote failed' });
    }
  }
  return out;
}

function portfolioSummaryForUser(userId) {
  const rows = db.prepare('SELECT ticker, type, quantity, avg_buy_price FROM holdings WHERE user_id = ?').all(userId);
  if (!rows.length) return 'No holdings yet.';
  return rows
    .map(
      (r) =>
        `${r.ticker} (${r.type}) - ${r.quantity} shares @ avg $${Number(r.avg_buy_price).toFixed(2)}`
    )
    .join('; ');
}

router.post('/message', async (req, res) => {
  try {
    if (isDemoMode()) {
      const { messages } = req.body || {};
      const last = [...(messages || [])].reverse().find((m) => m.role === 'user');
      const q = String(last?.content || '').trim();
      const base =
        'Demo mode: the assistant is running locally with no external API calls. I can still explain what the dashboard is showing, how the Health Score works, and how the macro-aware momentum backtest switches regimes.';
      const followup =
        q.length > 0
          ? `\n\nYou asked: "${q}". If you want, paste a ticker list or a portfolio goal and I will walk through what Velox would do.`
          : '\n\nAsk me about the portfolio, macro regime, or the backtest.';
      return res.json({ reply: `${base}${followup}` });
    }

    const key = process.env.GROQ_API_KEY;
    if (!key || key === 'your_groq_api_key_here') {
      return res.json({
        reply: 'Chatbot unavailable - add GROQ_API_KEY to .env',
      });
    }

    const { messages, portfolioContext, macroRegime, portfolioTickers } = req.body;
    const portfolio =
      portfolioContext ||
      portfolioSummaryForUser(req.user.id);

    const regimeStr = macroRegime
      ? `${macroRegime.regime}: ${macroRegime.label}`
      : 'Unknown regime';

    const tickers = Array.isArray(portfolioTickers)
      ? portfolioTickers
      : [];
    let newsAppend = '';
    if (userWantsNews(messages) && tickers.length) {
      try {
        const digest = await newsDigestForTickers(tickers);
        newsAppend =
          digest.length > 0
            ? `\n\nHeadlines for the user's holdings (last 7 days only; use ONLY these URLs when linking):\n${JSON.stringify(digest)}`
            : '\n\nNo recent headlines were loaded for these tickers (feed empty or unavailable).';
      } catch {
        newsAppend = '\n\nHeadlines could not be loaded.';
      }
    } else if (userWantsNews(messages) && !tickers.length) {
      newsAppend =
        '\n\nThe user asked about news but has no portfolio tickers; say they can add holdings or use the News tab, and you cannot pull symbol-specific headlines yet.';
    }

    let quoteAppend = '';
    if (userWantsPriceOrQuote(messages)) {
      const lastUser = [...(messages || [])].reverse().find((m) => m.role === 'user');
      const symbols = extractQuoteSymbols(lastUser?.content || '');
      if (symbols.length) {
        try {
          const snaps = await fetchQuoteSnapshots(symbols);
          quoteAppend = `\n\nQUOTE_SNAPSHOT (Velox uses Yahoo Finance via the app - typically delayed ~15 minutes; not for placing trades):\n${JSON.stringify(snaps)}`;
        } catch {
          quoteAppend =
            '\n\nQuote lookup failed; suggest the user check Yahoo Finance or Google Finance for a live quote.';
        }
      }
    }

    const system = `You are Velox Assistant, a friendly financial guide for beginner investors. The user's portfolio: ${portfolio}. Current macro regime: ${regimeStr}. Explain simply. Avoid jargon. When asked about the Velox algorithm, explain how it switches between Risk-On, Moderate, and Risk-Off modes based on real GDP and Fed rate data.

Use Markdown in every reply: short paragraphs, **bold** for tickers and key numbers (e.g. **NVDA**, **RISK_ON**), numbered or bulleted lists when listing holdings or steps.${newsAppend}${quoteAppend}
Never use em dashes or en dashes. Use a hyphen (-) instead.

When QUOTE_SNAPSHOT is present: answer with a clear **Current price** (or **Prices**) section first. For each entry with ok:true, give **TICKER** at ~$price with currency; mention as-of time if present. If priceKind is "last_daily_close", say clearly this is the **last daily close** from chart data (Yahoo's live quote API was unavailable) - not a live streaming print. Otherwise note quotes may be delayed ~15 min. All illustrative - not financial advice. Relate briefly to the macro regime (**RISK_ON**, **MODERATE**, or **RISK_OFF**). Never invent prices. For ok:false, suggest Yahoo or Google Finance.

When discussing news or headlines and a digest is present above: give a numbered list; each item must be **TICKER** - [article title](exact_url_from_digest) - source name, approximate date, and sentiment (bullish/neutral/bearish). Never invent URLs. If a digest entry has an empty url, quote the title without a link and say the link was unavailable.`;

    let maxTokens = 800;
    if (userWantsNews(messages)) maxTokens = 1100;
    if (quoteAppend) maxTokens = Math.max(maxTokens, 1000);

    const url =
      process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions';
    const body = {
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: system }, ...(messages || [])],
      temperature: 0.6,
      max_tokens: maxTokens,
    };

    const { data } = await axios.post(url, body, {
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    });

    const reply = (data?.choices?.[0]?.message?.content ?? 'No response').replace(/[\u2014\u2013]/g, '-');
    res.json({ reply });
  } catch (e) {
    res.status(500).json({
      reply: `Assistant error: ${e.response?.data?.error?.message || e.message}`,
    });
  }
});

module.exports = router;
