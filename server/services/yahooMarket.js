/**
 * Market data from Yahoo Finance (public HTTP) with optional RapidAPI quote proxy.
 */
const axios = require('axios');
const { isDemoMode } = require('../demo/demoMode');
const { demoQuoteRow, demoBeta, demoChartHistory } = require('../demo/demoMarket');

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

function httpOpts(extra = {}) {
  return {
    headers: { 'User-Agent': UA, Accept: 'application/json', ...extra.headers },
    timeout: 25000,
    validateStatus: (s) => s >= 200 && s < 500,
    ...extra,
  };
}

function rapidHeaders() {
  const key = process.env.YAHOO_FINANCE_RAPIDAPI_KEY || process.env.RAPIDAPI_KEY;
  const host =
    process.env.YAHOO_FINANCE_RAPIDAPI_HOST ||
    process.env.RAPIDAPI_HOST ||
    'yahoo-finance15.p.rapidapi.com';
  if (!key) return null;
  return {
    'X-RapidAPI-Key': key,
    'X-RapidAPI-Host': host,
  };
}

async function rapidQuote(ticker) {
  if (isDemoMode()) return null;
  const headers = rapidHeaders();
  if (!headers) return null;
  const host = headers['X-RapidAPI-Host'];
  const bases = [
    `https://${host}/api/v1/market/quotes`,
    `https://${host}/v1/market/quotes`,
    `https://${host}/market/v2/get-quotes`,
  ];
  for (const url of bases) {
    try {
      const { data, status } = await axios.get(url, {
        ...httpOpts({ headers }),
        params: { symbols: ticker, symbol: ticker },
      });
      if (status !== 200 || !data) continue;
      const row =
        data.quoteResponse?.result?.[0] ||
        data.body?.quote?.[0] ||
        data.quotes?.[0] ||
        data[0] ||
        data.result?.[0] ||
        data.data?.[0];
      if (row && (row.regularMarketPrice != null || row.price != null || row.ask != null)) {
        return {
          regularMarketPrice:
            row.regularMarketPrice ?? row.price ?? row.last ?? row.ask,
          postMarketPrice: row.postMarketPrice,
          regularMarketPreviousClose:
            row.regularMarketPreviousClose ?? row.previousClose ?? row.regularMarketPreviousClose,
          currency: row.currency,
          regularMarketTime: row.regularMarketTime,
          beta: row.beta,
        };
      }
    } catch {
      /* try next */
    }
  }
  return null;
}

async function publicQuote(ticker) {
  if (isDemoMode()) return demoQuoteRow(ticker);
  const { data, status } = await axios.get(
    'https://query1.finance.yahoo.com/v7/finance/quote',
    {
      ...httpOpts(),
      params: { symbols: ticker },
    }
  );
  if (status !== 200) throw new Error(`Quote HTTP ${status}`);
  const row = data?.quoteResponse?.result?.[0];
  if (!row) throw new Error('Quote not found');
  return row;
}

async function publicQuoteSummaryBeta(ticker) {
  if (isDemoMode()) return demoBeta(ticker);
  const { data, status } = await axios.get(
    `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(ticker)}`,
    {
      ...httpOpts(),
      params: { modules: 'defaultKeyStatistics,summaryDetail' },
    }
  );
  if (status !== 200) throw new Error(`quoteSummary HTTP ${status}`);
  const r = data?.quoteSummary?.result?.[0];
  const beta = r?.defaultKeyStatistics?.beta ?? r?.summaryDetail?.beta?.raw ?? r?.summaryDetail?.beta;
  const n = typeof beta === 'object' && beta?.raw != null ? beta.raw : beta;
  return typeof n === 'number' && Number.isFinite(n) ? n : 1;
}

/**
 * @returns {Array<{ date: Date, open, high, low, close, adjClose }>}
 */
async function chartHistory(ticker, period1, period2, interval) {
  if (isDemoMode()) return await demoChartHistory(ticker, period1, period2, interval);
  const p1 = Math.floor(new Date(period1).getTime() / 1000);
  const p2 = Math.floor(new Date(period2).getTime() / 1000);
  const { data, status } = await axios.get(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}`,
    {
      ...httpOpts(),
      params: {
        period1: p1,
        period2: p2,
        interval,
        includePrePost: false,
      },
    }
  );
  if (status !== 200) throw new Error(`Chart HTTP ${status}`);
  const res = data?.chart?.result?.[0];
  if (!res) throw new Error('Chart empty');
  const ts = res.timestamp || [];
  const q = res.indicators?.quote?.[0] || {};
  const adj = res.indicators?.adjclose?.[0]?.adjclose;
  const rows = [];
  for (let i = 0; i < ts.length; i++) {
    const close = q.close?.[i];
    if (close == null || Number.isNaN(close)) continue;
    rows.push({
      date: new Date(ts[i] * 1000),
      open: q.open?.[i] ?? close,
      high: q.high?.[i] ?? close,
      low: q.low?.[i] ?? close,
      close,
      adjClose: adj?.[i] ?? close,
    });
  }
  return rows;
}

/**
 * When Yahoo's quote REST endpoint blocks (common 401), the chart API often still works.
 * Returns a minimal quote-shaped row using the last daily bar (adj close).
 */
async function quoteFromChartLastClose(ticker) {
  if (isDemoMode()) return demoQuoteRow(ticker);
  const sym = String(ticker).toUpperCase();
  const period2 = new Date();
  const period1 = new Date(Date.now() - 21 * 86400000);
  const rows = await chartHistory(sym, period1, period2, '1d');
  if (!rows?.length) return null;
  const last = rows[rows.length - 1];
  const px = last.adjClose ?? last.close;
  if (px == null || Number.isNaN(Number(px))) return null;
  return {
    regularMarketPrice: Number(px),
    currency: 'USD',
    regularMarketTime: Math.floor(last.date.getTime() / 1000),
    shortName: sym,
    marketState: 'CHART_LAST_CLOSE',
  };
}

async function getQuoteRow(ticker) {
  const sym = String(ticker).toUpperCase();
  const rapid = await rapidQuote(sym);
  if (rapid && rapid.regularMarketPrice != null) return rapid;
  try {
    return await publicQuote(sym);
  } catch (err) {
    try {
      const fromChart = await quoteFromChartLastClose(sym);
      if (fromChart) return fromChart;
    } catch {
      /* fall through */
    }
    throw err;
  }
}

module.exports = {
  getQuoteRow,
  publicQuoteSummaryBeta,
  chartHistory,
  rapidHeaders,
};
