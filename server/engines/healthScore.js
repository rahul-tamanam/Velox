function computeHealthScore({
  holdingsWithWeights,
  portfolioVolatility,
  goalProgress,
  maxDrawdownEstimate,
  regime,
}) {
  const n = holdingsWithWeights?.length || 0;
  const herfindahl =
    holdingsWithWeights?.reduce((s, h) => s + (h.weight || 0) ** 2, 0) || 1;
  const effectiveN = herfindahl > 0 ? 1 / herfindahl : 1;
  const diversificationScore = Math.min(
    100,
    ((effectiveN - 1) / Math.max(n - 1, 9)) * 100
  );

  const portfolioVol =
    portfolioVolatility ??
    (holdingsWithWeights ?? []).reduce(
      (s, h) => s + (h.weight || 0) * (h.beta ?? 1),
      0
    ) * 0.16;
  const vol = Math.min(Math.max(portfolioVol ?? 0.15, 0.05), 0.6);
  const volatilityScore = Math.max(0, 100 - ((vol - 0.1) / 0.35) * 100);

  const gp = Math.min(Math.max(goalProgress ?? 0.5, 0), 1);
  const goalScore = gp * 100;

  const dd = Math.min(Math.max(maxDrawdownEstimate ?? 0.15, 0), 0.5);
  const bufferScore = Math.max(0, 100 - (dd / 0.35) * 100);

  const score =
    diversificationScore * 0.3 +
    volatilityScore * 0.25 +
    goalScore * 0.25 +
    bufferScore * 0.2;

  const rounded = Math.round(Math.min(100, Math.max(0, score)));

  let explanation =
    'Your portfolio blends diversification, volatility, goal progress, and drawdown cushion.';
  if (rounded >= 71) explanation = 'Strong shape: diversified and aligned with your goal.';
  else if (rounded >= 41)
    explanation = 'Room to improve: consider broader diversification or volatility balance.';
  else explanation = 'Elevated risk posture — review concentration and timeline.';

  return {
    score: rounded,
    breakdown: {
      diversification: Math.round(diversificationScore),
      volatility: Math.round(volatilityScore),
      goalAlignment: Math.round(goalScore),
      drawdownBuffer: Math.round(bufferScore),
    },
    explanation,
  };
}

module.exports = { computeHealthScore };
