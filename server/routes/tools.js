const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { computeExitCost } = require('../engines/exitCost');
const { computeHealthScore } = require('../engines/healthScore');

const router = express.Router();
router.use(authMiddleware);

router.post('/exitcost', (req, res) => {
  try {
    const result = computeExitCost(req.body);
    const holdNet = req.body.quantity * (req.body.buyPrice || 0);
    res.json({
      ...result,
      comparison: {
        holdLabel: 'Hold',
        sellNet: result.netProceeds,
        holdApprox: holdNet,
      },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/whatif', (req, res) => {
  try {
    const { scenario, customPct, totalValue, costBasis, holdingsCount, goalAmount } = req.body;
    let shock = 0;
    let label = '';
    switch (scenario) {
      case 'market_drop_20':
        shock = -0.2;
        label = 'Broad market falls ~20%';
        break;
      case 'inflation_high':
        shock = -0.08;
        label = 'Elevated inflation pressures valuations';
        break;
      case 'withdraw_20':
        shock = -0.2;
        label = 'You withdraw ~20% next year';
        break;
      case 'rates_up_2':
        shock = -0.12;
        label = 'Rates rise ~200 bps';
        break;
      case 'custom':
        shock = -(Math.abs(Number(customPct) || 0) / 100);
        label = `Custom shock ${customPct}%`;
        break;
      default:
        shock = -0.1;
        label = 'Stress scenario';
    }

    const tv = Number(totalValue) || 0;
    const cb = Number(costBasis) || 1;
    const newValue = Math.max(0, tv * (1 + shock));
    const hc = Math.max(1, Number(holdingsCount) || 5);
    const ga = Number(goalAmount) || tv || 1;

    const beforeHealth = computeHealthScore({
      holdingsWithWeights: Array.from({ length: hc }).map((_, i) => ({
        weight: 1 / hc,
        beta: 1,
      })),
      portfolioVolatility: 0.18,
      goalProgress: Math.min(1, tv / ga),
      maxDrawdownEstimate: 0.15,
    });

    const afterHealth = computeHealthScore({
      holdingsWithWeights: Array.from({ length: hc }).map((_, i) => ({
        weight: 1 / hc,
        beta: 1,
      })),
      portfolioVolatility: 0.22,
      goalProgress: Math.min(1, newValue / ga),
      maxDrawdownEstimate: Math.min(0.45, 0.15 - shock * 0.3),
    });

    let rebalance = 'Stay the course — moves are modest.';
    if (shock <= -0.15) {
      rebalance =
        'Consider trimming concentrated winners and adding quality bonds or diversified funds to stabilize.';
    } else if (shock <= -0.08) {
      rebalance = 'Light rebalance toward your target mix; avoid panic trades.';
    }

    res.json({
      scenarioLabel: label,
      shockPct: shock,
      newPortfolioValue: newValue,
      impliedReturnPct: cb > 0 ? (newValue - cb) / cb : 0,
      healthBefore: beforeHealth.score,
      healthAfter: afterHealth.score,
      rebalanceRecommendation: rebalance,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
