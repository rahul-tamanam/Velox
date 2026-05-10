/**
 * Single entry for Vercel Hobby: one serverless function routes all /api/* paths.
 */
const {
  json,
  readBody,
  authOk,
  demoUser,
  demoHoldings,
  demoPortfolioSummary,
  demoQuoteRow,
  demoBeta,
  demoChartHistory,
  getDemoMacroRegimePayload,
  getDemoNewsItems,
} = require('./vercelDemoHelpers');

const { computeExitCost } = require('./engines/exitCost');
const { computeHealthScore } = require('./engines/healthScore');
const { runMonteCarloEngine } = require('./engines/monteCarlo');
const { runMacroAwareBacktest } = require('./engines/macroAwareMomentum');

/**
 * Vercel catch-all `api/[...slug].js` puts path segments in `req.query.slug`
 * (string or string[]). Some local mocks only set `req.url` — support both.
 */
function getApiRoute(req) {
  const q = req.query || {};
  if (q.slug != null && q.slug !== '') {
    const s = q.slug;
    const joined = Array.isArray(s) ? s.filter(Boolean).join('/') : String(s);
    return joined.replace(/^\/+|\/+$/g, '');
  }
  try {
    const u = new URL(req.url || '/', 'http://localhost');
    let p = u.pathname || '';
    if (p.startsWith('/api/')) p = p.slice(5);
    else if (p === '/api') p = '';
    return p.replace(/^\/+|\/+$/g, '');
  } catch {
    return '';
  }
}

/** Vercel often strips ?query from `req.url` and puts params on `req.query` instead. */
function getSearchParam(req, key) {
  const rq = req.query || {};
  if (Object.prototype.hasOwnProperty.call(rq, key) && rq[key] != null && rq[key] !== '') {
    const v = rq[key];
    return Array.isArray(v) ? String(v[0]) : String(v);
  }
  try {
    const u = new URL(req.url || '/', 'http://localhost');
    return u.searchParams.get(key) || '';
  } catch {
    return '';
  }
}

function periodConfig(period) {
  const end = new Date();
  const start = new Date(end);
  let interval = '1d';
  switch (period) {
    case '1d':
      start.setDate(end.getDate() - 3);
      interval = '5m';
      break;
    case '1wk':
    case '5d':
      start.setDate(end.getDate() - 7);
      interval = '15m';
      break;
    case '1mo':
      start.setMonth(end.getMonth() - 1);
      interval = '1d';
      break;
    case '3mo':
      start.setMonth(end.getMonth() - 3);
      interval = '1d';
      break;
    case '1y':
      start.setFullYear(end.getFullYear() - 1);
      interval = '1wk';
      break;
    default:
      start.setMonth(end.getMonth() - 1);
      interval = '1d';
  }
  return { start, end, interval };
}

function fmtUsd(n) {
  if (n == null || Number.isNaN(Number(n))) return 'N/A';
  return `$${Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

async function handleApi(req, res) {
  const route = getApiRoute(req);
  const method = req.method || 'GET';

  try {
    // --- health ---
    if (route === 'health' && method === 'GET') {
      return json(res, 200, { ok: true, service: 'velox-api', demoMode: true });
    }

    // --- auth ---
    if (route === 'auth/login' && method === 'POST') {
      const body = await readBody(req);
      const email = String(body.email || 'demo@velox.com').trim().toLowerCase();
      return json(res, 200, { token: 'demo-token', user: demoUser({ email }) });
    }
    if (route === 'auth/register' && method === 'POST') {
      const body = await readBody(req);
      const name = String(body.name || 'Demo User').trim() || 'Demo User';
      const email = String(body.email || 'demo@velox.com').trim().toLowerCase();
      return json(res, 200, { token: 'demo-token', user: demoUser({ name, email }) });
    }
    if (route === 'auth/me' && method === 'GET') {
      if (!authOk(req)) return json(res, 401, { error: 'Unauthorized' });
      return json(res, 200, { user: demoUser() });
    }
    if (route === 'auth/profile' && method === 'PATCH') {
      if (!authOk(req)) return json(res, 401, { error: 'Unauthorized' });
      const body = await readBody(req);
      return json(res, 200, { user: demoUser(body || {}) });
    }
    if (route === 'auth/password' && method === 'PATCH') {
      if (!authOk(req)) return json(res, 401, { error: 'Unauthorized' });
      return json(res, 200, { ok: true });
    }
    if (route === 'auth/account' && method === 'DELETE') {
      if (!authOk(req)) return json(res, 401, { error: 'Unauthorized' });
      return json(res, 200, { ok: true });
    }

    // --- portfolio ---
    if (route === 'portfolio' && method === 'GET') {
      if (!authOk(req)) return json(res, 401, { error: 'Unauthorized' });
      return json(res, 200, demoHoldings());
    }
    if (route === 'portfolio/summary' && method === 'GET') {
      if (!authOk(req)) return json(res, 401, { error: 'Unauthorized' });
      return json(res, 200, demoPortfolioSummary());
    }
    if (route === 'portfolio/add' && method === 'POST') {
      if (!authOk(req)) return json(res, 401, { error: 'Unauthorized' });
      const body = await readBody(req);
      const ticker = String(body.ticker || 'DEMO').toUpperCase();
      const type = body.type || 'stock';
      const quantity = Number(body.quantity) || 0;
      const avg_buy_price = Number(body.avg_buy_price) || 100;
      const buy_date = String(body.buy_date || new Date().toISOString().slice(0, 10));
      const nextId = demoHoldings().length + 1;
      return json(res, 200, {
        id: nextId,
        user_id: 1,
        ticker,
        type,
        quantity,
        avg_buy_price,
        buy_date,
      });
    }
    if (route === 'portfolio/sell' && method === 'POST') {
      if (!authOk(req)) return json(res, 401, { error: 'Unauthorized' });
      await readBody(req);
      return json(res, 200, { ok: true, deleted: false, remaining_quantity: 0 });
    }

    // --- stocks ---
    if (route === 'stocks/price' && method === 'GET') {
      if (!authOk(req)) return json(res, 401, { error: 'Unauthorized' });
      const ticker = String(getSearchParam(req, 'ticker') || '').toUpperCase();
      if (!ticker) return json(res, 400, { error: 'ticker required' });
      const q = demoQuoteRow(ticker);
      return json(res, 200, {
        ticker,
        price: q.regularMarketPrice ?? q.postMarketPrice,
        currency: q.currency || 'USD',
        marketTime: q.regularMarketTime,
      });
    }
    if (route === 'stocks/history' && method === 'GET') {
      if (!authOk(req)) return json(res, 401, { error: 'Unauthorized' });
      const ticker = String(getSearchParam(req, 'ticker') || '').toUpperCase();
      const period = String(getSearchParam(req, 'period') || '1mo');
      if (!ticker) return json(res, 400, { error: 'ticker required' });
      const { start, end, interval } = periodConfig(period);
      const quotes = await demoChartHistory(ticker, start, end, interval);
      const candles = (quotes || [])
        .filter((q) => q.close != null)
        .map((q) => ({
          time: Math.floor(new Date(q.date).getTime() / 1000),
          open: q.open ?? q.close,
          high: q.high ?? q.close,
          low: q.low ?? q.close,
          close: q.close,
        }));
      return json(res, 200, { ticker, period, candles });
    }

    // --- macro ---
    if (route === 'macro/regime' && method === 'GET') {
      if (!authOk(req)) return json(res, 401, { error: 'Unauthorized' });
      return json(res, 200, getDemoMacroRegimePayload());
    }

    // --- news ---
    if (route === 'news' && method === 'GET') {
      if (!authOk(req)) return json(res, 401, { error: 'Unauthorized' });
      const raw = String(getSearchParam(req, 'tickers') || '');
      const tickers = raw
        .split(',')
        .map((t) => t.trim().toUpperCase())
        .filter(Boolean);
      if (!tickers.length) return json(res, 400, { error: 'tickers query required' });
      const items = getDemoNewsItems(tickers);
      return json(res, 200, { items, meta: { newsapiConfigured: false } });
    }

    // --- tools ---
    if (route === 'tools/exitcost' && method === 'POST') {
      if (!authOk(req)) return json(res, 401, { error: 'Unauthorized' });
      const body = await readBody(req);
      const result = computeExitCost(body);
      const holdNet = (Number(body.quantity) || 0) * (Number(body.buyPrice) || 0);
      return json(res, 200, {
        ...result,
        comparison: {
          holdLabel: 'Hold',
          sellNet: result.netProceeds,
          holdApprox: holdNet,
        },
      });
    }
    if (route === 'tools/whatif' && method === 'POST') {
      if (!authOk(req)) return json(res, 401, { error: 'Unauthorized' });
      const body = await readBody(req);
      const { scenario, customPct, totalValue, costBasis, holdingsCount, goalAmount } = body;
      let shock = 0;
      let label = '';
      switch (scenario) {
        case 'market_drop_20':
          shock = -0.2;
          label = 'Broad market falls ~20%';
          break;
        case 'inflation_high':
          shock = -0.08;
          label = 'Elevated inflation pressures valuations';
          break;
        case 'withdraw_20':
          shock = -0.2;
          label = 'You withdraw ~20% next year';
          break;
        case 'rates_up_2':
          shock = -0.12;
          label = 'Rates rise ~200 bps';
          break;
        case 'custom':
          shock = -(Math.abs(Number(customPct) || 0) / 100);
          label = `Custom shock ${customPct}%`;
          break;
        default:
          shock = -0.1;
          label = 'Stress scenario';
      }
      const tv = Number(totalValue) || 0;
      const cb = Number(costBasis) || 1;
      const newValue = Math.max(0, tv * (1 + shock));
      const hc = Math.max(1, Number(holdingsCount) || 5);
      const ga = Number(goalAmount) || tv || 1;
      const beforeHealth = computeHealthScore({
        holdingsWithWeights: Array.from({ length: hc }).map(() => ({ weight: 1 / hc, beta: 1 })),
        portfolioVolatility: 0.18,
        goalProgress: Math.min(1, tv / ga),
        maxDrawdownEstimate: 0.15,
      });
      const afterHealth = computeHealthScore({
        holdingsWithWeights: Array.from({ length: hc }).map(() => ({ weight: 1 / hc, beta: 1 })),
        portfolioVolatility: 0.22,
        goalProgress: Math.min(1, newValue / ga),
        maxDrawdownEstimate: Math.min(0.45, 0.15 - shock * 0.3),
      });
      let rebalance = 'Stay the course - moves are modest.';
      if (shock <= -0.15) {
        rebalance =
          'Consider trimming concentrated winners and adding quality bonds or diversified funds to stabilize.';
      } else if (shock <= -0.08) {
        rebalance = 'Light rebalance toward your target mix; avoid panic trades.';
      }
      return json(res, 200, {
        scenarioLabel: label,
        shockPct: shock,
        newPortfolioValue: newValue,
        impliedReturnPct: cb > 0 ? (newValue - cb) / cb : 0,
        healthBefore: beforeHealth.score,
        healthAfter: afterHealth.score,
        rebalanceRecommendation: rebalance,
      });
    }

    // --- simulate ---
    if (route === 'simulate/montecarlo' && method === 'POST') {
      if (!authOk(req)) return json(res, 401, { error: 'Unauthorized' });
      const body = await readBody(req);
      const { holdings, horizon, contribution, goalAmount } = body;
      const result = await runMonteCarloEngine({
        holdings,
        horizonYears: horizon,
        monthlyContribution: contribution,
        goalAmount,
      });
      return json(res, 200, result);
    }
    if (route === 'simulate/backtest' && method === 'GET') {
      if (!authOk(req)) return json(res, 401, { error: 'Unauthorized' });
      let corpus = Number(getSearchParam(req, 'corpus'));
      if (!Number.isFinite(corpus)) corpus = 100_000;
      corpus = Math.round(Math.min(Math.max(corpus, 1_000), 100_000_000));
      const result = await runMacroAwareBacktest(corpus);
      return json(res, 200, result);
    }

    // --- chatbot ---
    if (route === 'chatbot/message' && method === 'POST') {
      if (!authOk(req)) return json(res, 401, { error: 'Unauthorized' });
      const body = await readBody(req);
      const last = [...(body.messages || [])].reverse().find((m) => m?.role === 'user');
      const q = String(last?.content || '').trim();
      const base =
        'Demo mode: this assistant runs without external APIs. I can explain the dashboard KPIs, the Health Score, the macro regime badge, and how the macro-aware momentum backtest switches between Risk-On, Moderate, and Risk-Off.';
      const followup =
        q.length > 0
          ? `\n\nYou asked: "${q}". For the demo deployment, prices and macro values are deterministic snapshots (not live market data).`
          : '\n\nAsk me about the portfolio, macro regime, or the backtest.';
      return json(res, 200, { reply: `${base}${followup}` });
    }

    // --- ai ---
    if (route === 'ai/chart-analysis' && method === 'POST') {
      if (!authOk(req)) return json(res, 401, { error: 'Unauthorized' });
      const body = await readBody(req);
      const {
        symbol,
        timeframe,
        firstClose,
        lastClose,
        high,
        low,
        bullCount,
        bearCount,
        trend,
      } = body || {};
      if (
        !symbol ||
        firstClose == null ||
        lastClose == null ||
        high == null ||
        low == null ||
        bullCount == null ||
        bearCount == null ||
        !trend
      ) {
        return json(res, 400, { error: 'Missing required fields' });
      }
      const tf = String(timeframe || 'the selected period');
      const dir =
        trend === 'uptrend' ? 'up' : trend === 'downtrend' ? 'down' : 'sideways';
      const change =
        Number(firstClose) > 0 ? (Number(lastClose) - Number(firstClose)) / Number(firstClose) : 0;
      const sign = change >= 0 ? 'up' : 'down';
      const pct = `${Math.abs(change * 100).toFixed(1)}%`;
      const candles = Number(bullCount) + Number(bearCount);
      const analysis =
        `Over ${tf}, **${String(symbol).toUpperCase()}** moved ${sign} about ${pct} from ${fmtUsd(firstClose)} to ${fmtUsd(lastClose)}. ` +
        `The range was ${fmtUsd(low)} to ${fmtUsd(high)}, and the candle mix (${bullCount} bullish vs ${bearCount} bearish out of ${candles}) supports a ${dir} bias. ` +
        `For the demo deployment, this is a deterministic summary generated locally, not a live AI model.`;
      return json(res, 200, { analysis });
    }

    return json(res, 404, { error: 'Not found', path: route, method });
  } catch (e) {
    return json(res, 400, { error: e.message || 'Bad request' });
  }
}

module.exports = { handleApi };
