const { json, demoChartHistory, authOk } = require('../_demo');

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

module.exports = async (req, res) => {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });
  if (!authOk(req)) return json(res, 401, { error: 'Unauthorized' });

  const url = new URL(req.url, 'http://localhost');
  const ticker = String(url.searchParams.get('ticker') || '').toUpperCase();
  const period = String(url.searchParams.get('period') || '1mo');
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
};

