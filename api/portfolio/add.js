const { json, readBody, authOk, demoHoldings } = require('../_demo');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  if (!authOk(req)) return json(res, 401, { error: 'Unauthorized' });
  try {
    const body = await readBody(req);
    const ticker = String(body.ticker || 'DEMO').toUpperCase();
    const type = body.type || 'stock';
    const quantity = Number(body.quantity) || 0;
    const avg_buy_price = Number(body.avg_buy_price) || 100;
    const buy_date = String(body.buy_date || new Date().toISOString().slice(0, 10));
    // Stateless demo: return the "created" row but do not persist.
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
  } catch (e) {
    return json(res, 400, { error: e.message || 'Invalid JSON' });
  }
};

