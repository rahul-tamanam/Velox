const { json, getDemoNewsItems, authOk } = require('../_demo');

module.exports = (req, res) => {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });
  if (!authOk(req)) return json(res, 401, { error: 'Unauthorized' });

  const url = new URL(req.url, 'http://localhost');
  const raw = String(url.searchParams.get('tickers') || '');
  const tickers = raw
    .split(',')
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean);
  if (!tickers.length) return json(res, 400, { error: 'tickers query required' });

  const items = getDemoNewsItems(tickers);
  const meta = { newsapiConfigured: false };
  return json(res, 200, { items, meta });
};

