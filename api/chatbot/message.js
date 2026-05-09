const { json, readBody, authOk } = require('../_demo');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  if (!authOk(req)) return json(res, 401, { error: 'Unauthorized' });
  try {
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
  } catch (e) {
    return json(res, 400, { error: e.message || 'Invalid JSON' });
  }
};

