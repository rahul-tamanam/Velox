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

const CORPUS_MIN = 1_000;
const CORPUS_MAX = 100_000_000;

router.get('/backtest', async (req, res) => {
  try {
    let corpus = Number(req.query.corpus);
    if (!Number.isFinite(corpus)) corpus = 100_000;
    corpus = Math.round(corpus);
    corpus = Math.min(Math.max(corpus, CORPUS_MIN), CORPUS_MAX);
    const result = await runMacroAwareBacktest(corpus);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
