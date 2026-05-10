// Demo helpers for Vercel (single serverless function). Not placed under /api so Hobby limit stays at 1 function.

process.env.DEMO_MODE = '1';

const { getDemoMacroRegimePayload, getDemoNewsItems } = require('./demo/fixtures');
const { demoQuoteRow, demoBeta, demoChartHistory } = require('./demo/demoMarket');

function json(res, code, body) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function demoUser(overrides = {}) {
  return {
    id: 1,
    name: 'Demo User',
    email: 'demo@velox.com',
    risk_profile: 'moderate',
    goal_name: 'Retirement',
    goal_target_amount: 250000,
    goal_target_year: new Date().getFullYear() + 10,
    onboarding_answers: [],
    ...overrides,
  };
}

function authOk() {
  return true;
}

function holdingRow(id, ticker, type, quantity, avg_buy_price, buy_date) {
  const q = demoQuoteRow(ticker);
  const price = q.regularMarketPrice ?? 0;
  const beta = demoBeta(ticker);
  const market_value = price * quantity;
  const cost_basis = avg_buy_price * quantity;
  const pl = market_value - cost_basis;
  const pl_pct = cost_basis > 0 ? pl / cost_basis : 0;
  return {
    id,
    user_id: 1,
    ticker: String(ticker).toUpperCase(),
    type,
    quantity,
    avg_buy_price,
    buy_date,
    current_price: price,
    beta,
    market_value,
    cost_basis,
    pl,
    pl_pct,
  };
}

function demoHoldings() {
  return [
    holdingRow(1, 'AAPL', 'stock', 8, 165.25, '2024-02-15'),
    holdingRow(2, 'MSFT', 'stock', 4, 312.4, '2023-10-02'),
    holdingRow(3, 'NVDA', 'stock', 6, 78.15, '2024-05-18'),
    holdingRow(4, 'SPY', 'etf', 5, 470.1, '2023-06-12'),
    holdingRow(5, 'TLT', 'etf', 10, 96.2, '2024-01-08'),
  ];
}

function demoPortfolioSummary() {
  const holdings = demoHoldings();
  const totalValue = holdings.reduce((s, h) => s + h.market_value, 0);
  const costBasis = holdings.reduce((s, h) => s + h.cost_basis, 0);
  const totalReturnPct = costBasis > 0 ? (totalValue - costBasis) / costBasis : 0;

  let todayChangePct = 0;
  for (const h of holdings) {
    const q = demoQuoteRow(h.ticker);
    const prev = q.regularMarketPreviousClose ?? q.chartPreviousClose;
    const cur = q.regularMarketPrice ?? q.postMarketPrice;
    const w = totalValue > 0 ? h.market_value / totalValue : 0;
    if (prev && cur && prev > 0) todayChangePct += w * ((cur - prev) / prev);
  }

  const stocksShare = holdings.filter((h) => h.type === 'stock').reduce((s, h) => s + h.market_value, 0);
  const fundsShare = holdings.filter((h) => h.type === 'etf' || h.type === 'fund').reduce((s, h) => s + h.market_value, 0);

  const { computeHealthScore } = require('./engines/healthScore');
  const macro = getDemoMacroRegimePayload();
  const goalAmt = demoUser().goal_target_amount || 1;
  const goalProgress = Math.min(1, totalValue / goalAmt);
  const maxWeight =
    holdings.length > 0
      ? Math.max(...holdings.map((h) => (totalValue > 0 ? h.market_value / totalValue : 0)))
      : 0;
  const concentrationPenalty = Math.max(0, Math.min(20, ((maxWeight - 0.3) / 0.7) * 20));
  const health = computeHealthScore({
    holdingsWithWeights: holdings.map((h) => ({
      ticker: h.ticker,
      weight: totalValue > 0 ? h.market_value / totalValue : 0,
      beta: h.beta,
    })),
    goalProgress,
    regime: macro.regime,
    riskProfile: demoUser().risk_profile,
    concentrationPenalty,
  });

  return {
    totalValue,
    costBasis,
    totalReturnPct,
    todayChangePct,
    portfolioBeta:
      holdings.reduce((s, h) => {
        const w = totalValue > 0 ? h.market_value / totalValue : 0;
        return s + w * (h.beta || 1);
      }, 0) || 1,
    health,
    stocksVsFunds: {
      stocksPct: totalValue > 0 ? stocksShare / totalValue : 0,
      fundsPct: totalValue > 0 ? fundsShare / totalValue : 0,
    },
  };
}

module.exports = {
  getDemoMacroRegimePayload,
  getDemoNewsItems,
  demoQuoteRow,
  demoBeta,
  demoChartHistory,
  demoUser,
  demoHoldings,
  demoPortfolioSummary,
  authOk,
  json,
  readBody,
};
