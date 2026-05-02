const express = require('express');
const { fetchHoldingsNews } = require('../services/newsFeed');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const raw = req.query.tickers || '';
    const tickers = raw
      .split(',')
      .map((t) => t.trim().toUpperCase())
      .filter(Boolean);
    if (!tickers.length) return res.status(400).json({ error: 'tickers query required' });

    const items = await fetchHoldingsNews(tickers);
    const meta = {
      newsapiConfigured: Boolean(
        process.env.NEWS_API_KEY && process.env.NEWS_API_KEY !== 'your_news_api_key_here'
      ),
    };
    res.json({ items, meta });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
