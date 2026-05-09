const DEMO_QUOTES = {
  AAPL: { name: 'Apple Inc.', price: 189.12, prev: 187.55, beta: 1.28 },
  MSFT: { name: 'Microsoft Corp.', price: 418.7, prev: 414.02, beta: 0.89 },
  NVDA: { name: 'NVIDIA Corp.', price: 112.45, prev: 110.91, beta: 1.72 },
  AMZN: { name: 'Amazon.com, Inc.', price: 182.3, prev: 180.88, beta: 1.18 },
  GOOGL: { name: 'Alphabet Inc. (Class A)', price: 168.66, prev: 167.41, beta: 1.05 },
  META: { name: 'Meta Platforms, Inc.', price: 478.22, prev: 472.4, beta: 1.34 },
  TSLA: { name: 'Tesla, Inc.', price: 214.9, prev: 212.12, beta: 2.08 },
  JPM: { name: 'JPMorgan Chase & Co.', price: 206.44, prev: 205.02, beta: 1.06 },
  GS: { name: 'Goldman Sachs Group, Inc.', price: 456.18, prev: 451.35, beta: 1.36 },
  SPY: { name: 'SPDR S&P 500 ETF Trust', price: 531.2, prev: 529.74, beta: 1.0 },
  TLT: { name: 'iShares 20+ Year Treasury Bond ETF', price: 92.14, prev: 92.66, beta: 0.2 },
  GLD: { name: 'SPDR Gold Shares', price: 219.55, prev: 218.91, beta: 0.1 },
  SHY: { name: 'iShares 1-3 Year Treasury Bond ETF', price: 81.38, prev: 81.41, beta: 0.05 },
  VNQ: { name: 'Vanguard Real Estate ETF', price: 84.26, prev: 84.02, beta: 0.7 },
};

function getDemoMacroRegimePayload() {
  // Chosen to showcase "macro-aware" UI without needing FRED.
  const lastUpdated = new Date().toISOString().slice(0, 10);
  return {
    regime: 'MODERATE',
    gdpGrowth: 1.8,
    fedFundsRate: 5.25,
    rateChange: 0.0,
    gdpOk: true,
    ratesOk: true,
    label: 'Growth OK but rates rising - diversified momentum',
    lastUpdated,
    warning: 'Demo mode - macro data is a static snapshot (no FRED calls).',
  };
}

function getDemoNewsItems(tickers) {
  const now = Date.now();
  const iso = (daysAgo) => new Date(now - daysAgo * 86400000).toISOString();
  const t = (tickers?.[0] || 'MARKET').toUpperCase();
  const uniq = [...new Set((tickers || []).map((x) => String(x).toUpperCase()))];
  const a = uniq[0] || t;
  const b = uniq[1] || 'SPY';
  return [
    {
      ticker: a,
      title: `${a} - Earnings recap and what investors are watching next`,
      url: '',
      source: 'Demo Wire',
      publishedAt: iso(1),
      sentiment: 'neutral',
      provider: 'demo',
    },
    {
      ticker: b,
      title: `${b} - Markets digest: rates, inflation, and risk appetite`,
      url: '',
      source: 'Demo Wire',
      publishedAt: iso(2),
      sentiment: 'neutral',
      provider: 'demo',
    },
    {
      ticker: 'MARKET',
      title: 'Macro regime explained: why Velox shifts between Risk-On, Moderate, and Risk-Off',
      url: '',
      source: 'Demo Wire',
      publishedAt: iso(3),
      sentiment: 'bullish',
      provider: 'demo',
    },
  ];
}

module.exports = {
  DEMO_QUOTES,
  getDemoMacroRegimePayload,
  getDemoNewsItems,
};

