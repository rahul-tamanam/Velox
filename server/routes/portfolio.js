const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { computeHealthScore } = require('../engines/healthScore');
const { getMacroRegimePayload } = require('../engines/macroEngine');
const { getQuoteRow, publicQuoteSummaryBeta } = require('../services/yahooMarket');

const router = express.Router();
router.use(authMiddleware);

async function enrichQuote(ticker) {
  try {
    const q = await getQuoteRow(ticker);
    let beta = 1;
    try {
      beta = await publicQuoteSummaryBeta(ticker);
    } catch {
      if (typeof q.beta === 'number' && Number.isFinite(q.beta)) beta = q.beta;
    }
    return {
      price:
        q.regularMarketPrice ??
        q.postMarketPrice ??
        q.regularMarketPreviousClose ??
        0,
      beta,
    };
  } catch {
    return { price: 0, beta: 1 };
  }
}

router.get('/', async (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM holdings WHERE user_id = ? ORDER BY id ASC').all(req.user.id);
    const out = [];
    for (const h of rows) {
      const { price, beta } = await enrichQuote(h.ticker);
      const current = price * h.quantity;
      const cost = h.avg_buy_price * h.quantity;
      out.push({
        ...h,
        current_price: price,
        beta,
        market_value: current,
        cost_basis: cost,
        pl: current - cost,
        pl_pct: cost > 0 ? (current - cost) / cost : 0,
      });
    }
    res.json(out);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/add', (req, res) => {
  try {
    const { ticker, type, quantity, avg_buy_price, buy_date } = req.body;
    if (!ticker || !type || quantity == null || avg_buy_price == null || !buy_date) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    const allowed = ['stock', 'etf', 'fund'];
    const holdType = allowed.includes(type) ? type : 'stock';
    const info = db
      .prepare(
        `INSERT INTO holdings (user_id, ticker, type, quantity, avg_buy_price, buy_date) VALUES (?,?,?,?,?,?)`
      )
      .run(req.user.id, String(ticker).toUpperCase(), holdType, quantity, avg_buy_price, buy_date);

    db.prepare(
      `INSERT INTO transactions (user_id, ticker, action, quantity, price, date) VALUES (?,?,?,?,?,?)`
    ).run(req.user.id, String(ticker).toUpperCase(), 'buy', quantity, avg_buy_price, buy_date);

    const newId = Number(info.lastInsertRowid);
    const row = db.prepare('SELECT * FROM holdings WHERE id = ?').get(newId);
    res.json(row);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/sell', (req, res) => {
  try {
    const { holding_id, quantity, sell_price, sell_date } = req.body;
    const hid = Number(holding_id);
    const qty = Number(quantity);
    const price = Number(sell_price);
    if (!Number.isFinite(hid) || !sell_date) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      return res.status(400).json({ error: 'Invalid quantity' });
    }
    if (!Number.isFinite(price) || price < 0) {
      return res.status(400).json({ error: 'Invalid sell price' });
    }
    const row = db.prepare('SELECT * FROM holdings WHERE id = ? AND user_id = ?').get(hid, req.user.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    if (qty > row.quantity) {
      return res.status(400).json({ error: 'Quantity exceeds holding' });
    }
    const newQty = row.quantity - qty;
    if (newQty <= 0) {
      db.prepare('DELETE FROM holdings WHERE id = ?').run(hid);
    } else {
      db.prepare('UPDATE holdings SET quantity = ? WHERE id = ?').run(newQty, hid);
    }
    db.prepare(
      `INSERT INTO transactions (user_id, ticker, action, quantity, price, date) VALUES (?,?,?,?,?,?)`
    ).run(req.user.id, row.ticker, 'sell', qty, price, sell_date);
    res.json({
      ok: true,
      deleted: newQty <= 0,
      remaining_quantity: newQty > 0 ? newQty : 0,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM holdings WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    db.prepare('DELETE FROM holdings WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/summary', async (req, res) => {
  try {
    const macroData = await getMacroRegimePayload().catch(() => ({
      regime: 'MODERATE',
    }));
    const rows = db.prepare('SELECT * FROM holdings WHERE user_id = ?').all(req.user.id);
    let totalValue = 0;
    let costBasis = 0;
    let weightedBeta = 0;
    const enriched = [];

    for (const h of rows) {
      const { price, beta } = await enrichQuote(h.ticker);
      const mv = price * h.quantity;
      const cb = h.avg_buy_price * h.quantity;
      totalValue += mv;
      costBasis += cb;
      enriched.push({ ...h, current_price: price, beta, market_value: mv });
    }

    let todayChangePct = 0;
    for (const h of enriched) {
      const w = totalValue > 0 ? h.market_value / totalValue : 0;
      weightedBeta += w * (h.beta || 1);
      try {
        const q = await getQuoteRow(h.ticker);
        const prev = q.regularMarketPreviousClose ?? q.chartPreviousClose;
        const cur = q.regularMarketPrice ?? q.postMarketPrice;
        if (prev && cur && prev > 0) {
          const ch = (cur - prev) / prev;
          todayChangePct += w * ch;
        }
      } catch {
        /* skip */
      }
    }

    const totalReturnPct = costBasis > 0 ? (totalValue - costBasis) / costBasis : 0;

    const user = db
      .prepare(
        'SELECT goal_target_amount, goal_target_year, risk_profile FROM users WHERE id = ?'
      )
      .get(req.user.id);
    const goalAmt = user?.goal_target_amount ?? 1;
    const goalProgress = Math.min(1, totalValue / goalAmt);

    const maxWeight =
      enriched.length > 0
        ? Math.max(
            ...enriched.map((h) =>
              totalValue > 0 ? h.market_value / totalValue : 0
            )
          )
        : 0;
    const concentrationPenalty = Math.max(
      0,
      Math.min(20, ((maxWeight - 0.3) / 0.7) * 20)
    );

    const health = computeHealthScore({
      holdingsWithWeights: enriched.map((h) => ({
        ticker: h.ticker,
        weight: totalValue > 0 ? h.market_value / totalValue : 0,
        beta: h.beta,
      })),
      goalProgress,
      regime: macroData.regime,
      riskProfile: user?.risk_profile ?? 'moderate',
      concentrationPenalty,
    });

    const stocksShare = enriched
      .filter((h) => h.type === 'stock')
      .reduce((s, h) => s + h.market_value, 0);
    const fundsShare = enriched
      .filter((h) => h.type === 'etf' || h.type === 'fund')
      .reduce((s, h) => s + h.market_value, 0);

    res.json({
      totalValue,
      costBasis,
      totalReturnPct,
      todayChangePct,
      portfolioBeta: weightedBeta,
      health,
      stocksVsFunds: {
        stocksPct: totalValue > 0 ? stocksShare / totalValue : 0,
        fundsPct: totalValue > 0 ? fundsShare / totalValue : 0,
      },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
