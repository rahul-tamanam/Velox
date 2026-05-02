const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { runMonteCarloEngine } = require('../engines/monteCarlo');
const { runMacroAwareBacktest } = require('../engines/macroAwareMomentum');

const router = express.Router();
router.use(authMiddleware);

router.post('/montecarlo', async (req, res) => {
  try {
    const { holdings, horizon, contribution, goalAmount } = req.body;
    const result = await runMonteCarloEngine({
      holdings,
      horizonYears: horizon,
      monthlyContribution: contribution,
      goalAmount,
    });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/backtest', async (req, res) => {
  try {
    const corpus = Number(req.query.corpus) === 50000 ? 50000 : 100000;
    const result = await runMacroAwareBacktest(corpus);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
