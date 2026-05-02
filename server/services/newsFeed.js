const axios = require('axios');

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

/** Rolling window: headlines from the last 7 days only (not the same as the Velox backtest range). */
const NEWS_RECENT_DAYS = 7;
const NEWS_WINDOW_MS = NEWS_RECENT_DAYS * 24 * 60 * 60 * 1000;

function newsApiFromIsoDate() {
  const d = new Date();
  d.setDate(d.getDate() - NEWS_RECENT_DAYS);
  return d.toISOString().slice(0, 10);
}

function isPublishedInNewsRange(iso) {
  if (!iso || typeof iso !== 'string') return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const now = Date.now();
  const t = d.getTime();
  return t >= now - NEWS_WINDOW_MS && t <= now;
}

function filterNewsDateRange(items) {
  return items.filter((it) => isPublishedInNewsRange(it.publishedAt));
}

const BULL = /\b(rally|surge|gain|beat|upgrade|bull|growth|record|strong|optim)\b/i;
const BEAR = /\b(fall|drop|crash|miss|downgrade|bear|lawsuit|fear|weak|cut)\b/i;

function sentimentFor(title) {
  const b = BULL.test(title) ? 1 : 0;
  const r = BEAR.test(title) ? 1 : 0;
  if (b && !r) return 'bullish';
  if (r && !b) return 'bearish';
  return 'neutral';
}

async function yahooFinanceSearchNews(ticker) {
  const { data, status } = await axios.get('https://query2.finance.yahoo.com/v1/finance/search', {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    timeout: 20000,
    params: {
      q: ticker,
      quotesCount: 1,
      newsCount: 25,
      lang: 'en-US',
    },
    validateStatus: (s) => s >= 200 && s < 500,
  });
  if (status !== 200) return [];
  const news = data?.news || [];
  return news.map((n) => ({
    ticker,
    title: n.title || '',
    url: String(n.link || n.clickThroughUrl || '').trim() || '',
    source: n.publisher || 'Yahoo Finance',
    publishedAt:
      n.providerPublishTime != null
        ? new Date(n.providerPublishTime * 1000).toISOString()
        : '',
    sentiment: sentimentFor(n.title || ''),
    provider: 'yahoo',
  }));
}

async function newsApiForTickers(tickers) {
  const key = process.env.NEWS_API_KEY;
  if (!key || key === 'your_news_api_key_here') return [];

  const q = tickers.map((t) => `"${t}"`).join(' OR ');
  const toDate = new Date();
  toDate.setHours(23, 59, 59, 999);
  try {
    const { data, status } = await axios.get('https://newsapi.org/v2/everything', {
      timeout: 20000,
      params: {
        q,
        language: 'en',
        sortBy: 'publishedAt',
        from: newsApiFromIsoDate(),
        to: toDate.toISOString().slice(0, 10),
        pageSize: 40,
        apiKey: key,
      },
      validateStatus: () => true,
    });
    if (status !== 200 || !data?.articles) return [];
    const articles = [];
    for (const a of data.articles) {
      const title = a.title || '';
      const tick = tickers.find((t) => title.includes(t)) || tickers[0] || 'MARKET';
      articles.push({
        ticker: tick,
        title,
        url: String(a.url || '').trim() || '',
        source: a.source?.name || 'NewsAPI',
        publishedAt: a.publishedAt || '',
        sentiment: sentimentFor(title),
        provider: 'newsapi',
      });
    }
    return articles;
  } catch {
    return [];
  }
}

function dedupe(items) {
  const seen = new Set();
  const out = [];
  for (const it of items) {
    const k = `${it.title}|${it.source}`.toLowerCase().slice(0, 400);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(it);
  }
  return out;
}

async function fetchHoldingsNews(tickers) {
  const upper = [...new Set(tickers.map((t) => String(t).trim().toUpperCase()).filter(Boolean))];
  const chunks = [];
  await Promise.all(
    upper.map(async (ticker) => {
      try {
        const rows = await yahooFinanceSearchNews(ticker);
        chunks.push(...rows);
      } catch {
        /* skip */
      }
    })
  );
  chunks.push(...(await newsApiForTickers(upper)));
  const merged = filterNewsDateRange(dedupe(chunks));
  merged.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
  return merged;
}

module.exports = {
  fetchHoldingsNews,
  yahooFinanceSearchNews,
  newsApiForTickers,
};
