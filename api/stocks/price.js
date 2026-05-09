const { json, demoQuoteRow, authOk } = require('../_demo');

module.exports = (req, res) => {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });
  if (!authOk(req)) return json(res, 401, { error: 'Unauthorized' });

  const url = new URL(req.url, 'http://localhost');
  const ticker = String(url.searchParams.get('ticker') || '').toUpperCase();
  if (!ticker) return json(res, 400, { error: 'ticker required' });

  const q = demoQuoteRow(ticker);
  return json(res, 200, {
    ticker,
    price: q.regularMarketPrice ?? q.postMarketPrice,
    currency: q.currency || 'USD',
    marketTime: q.regularMarketTime,
  });
};

