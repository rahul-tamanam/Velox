const express = require('express');
const { getQuoteRow, chartHistory } = require('../services/yahooMarket');

const router = express.Router();

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

router.get('/price', async (req, res) => {
  try {
    const ticker = String(req.query.ticker || '').toUpperCase();
    if (!ticker) return res.status(400).json({ error: 'ticker required' });
    const q = await getQuoteRow(ticker);
    res.json({
      ticker,
      price: q.regularMarketPrice ?? q.postMarketPrice,
      currency: q.currency,
      marketTime: q.regularMarketTime,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/history', async (req, res) => {
  try {
    const ticker = String(req.query.ticker || '').toUpperCase();
    const period = req.query.period || '1mo';
    if (!ticker) return res.status(400).json({ error: 'ticker required' });

    const { start, end, interval } = periodConfig(period);
    const quotes = await chartHistory(ticker, start, end, interval);

    const candles = quotes
      .filter((q) => q.close != null)
      .map((q) => ({
        time: Math.floor(new Date(q.date).getTime() / 1000),
        open: q.open ?? q.close,
        high: q.high ?? q.close,
        low: q.low ?? q.close,
        close: q.close,
      }));

    res.json({ ticker, period, candles });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
