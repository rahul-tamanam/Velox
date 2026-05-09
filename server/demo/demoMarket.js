const { DEMO_QUOTES } = require('./fixtures');

function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function demoQuoteRow(ticker) {
  const sym = String(ticker || '').toUpperCase();
  const base = DEMO_QUOTES[sym] || {
    name: sym,
    price: 100,
    prev: 99,
    beta: 1,
  };
  const now = Math.floor(Date.now() / 1000);
  return {
    symbol: sym,
    shortName: base.name,
    regularMarketPrice: base.price,
    regularMarketPreviousClose: base.prev,
    currency: 'USD',
    regularMarketTime: now,
    beta: base.beta,
    marketState: 'DEMO',
  };
}

function demoBeta(ticker) {
  const sym = String(ticker || '').toUpperCase();
  const base = DEMO_QUOTES[sym];
  const b = base?.beta;
  return typeof b === 'number' && Number.isFinite(b) ? b : 1;
}

async function demoChartHistory(ticker, period1, period2, interval) {
  const sym = String(ticker || '').toUpperCase();
  const base = DEMO_QUOTES[sym]?.price ?? 100;

  const start = new Date(period1);
  const end = new Date(period2);
  const startMs = start.getTime();
  const endMs = end.getTime();
  const stepMs = interval === '5m' ? 5 * 60000 : interval === '15m' ? 15 * 60000 : interval === '1wk' ? 7 * 86400000 : 86400000;

  const seedFn = xmur3(`${sym}|${start.toISOString().slice(0, 10)}|${interval}`);
  const rand = mulberry32(seedFn());

  const rows = [];
  let px = base;
  // gentle drift to keep it believable
  const drift = (rand() - 0.5) * 0.001;

  for (let t = startMs; t <= endMs; t += stepMs) {
    const shock = (rand() - 0.5) * 0.02;
    const close = Math.max(1, px * (1 + drift + shock));
    const open = px;
    const high = Math.max(open, close) * (1 + rand() * 0.004);
    const low = Math.min(open, close) * (1 - rand() * 0.004);
    rows.push({
      date: new Date(t),
      open,
      high,
      low,
      close,
      adjClose: close,
    });
    px = close;
    if (rows.length > 2500) break;
  }
  return rows;
}

module.exports = {
  demoQuoteRow,
  demoBeta,
  demoChartHistory,
};

