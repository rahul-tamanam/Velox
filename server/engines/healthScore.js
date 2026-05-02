function computeHealthScore({
  holdingsWithWeights,
  portfolioVolatility,
  goalProgress,
  maxDrawdownEstimate,
  regime = 'MODERATE',
  riskProfile = 'moderate',
  concentrationPenalty = 0,
}) {
  const hw = holdingsWithWeights ?? [];
  const n = hw.length || 0;
  const herfindahl = hw.reduce((s, h) => s + (h.weight || 0) ** 2, 0) || 1;
  const effectiveN = herfindahl > 0 ? 1 / herfindahl : 1;
  const diversificationScore = Math.min(
    100,
    ((effectiveN - 1) / Math.max(n - 1, 9)) * 100
  );

  const portfolioVol =
    portfolioVolatility ??
    hw.reduce((s, h) => s + (h.weight || 0) * (h.beta ?? 1), 0) * 0.16;
  const vol = Math.min(Math.max(portfolioVol ?? 0.15, 0.05), 0.6);
  const volatilityScore = Math.max(0, 100 - ((vol - 0.1) / 0.35) * 100);

  const gp = Math.min(Math.max(goalProgress ?? 0.5, 0), 1);
  const goalScore = gp * 100;

  const estimatedDD = Math.min(
    0.5,
    hw.reduce(
      (s, h) =>
        s + (h.weight || 0) * Math.min((h.beta ?? 1) * 0.25, 0.5),
      0
    )
  );
  const dd =
    maxDrawdownEstimate != null && Number.isFinite(maxDrawdownEstimate)
      ? Math.min(Math.max(maxDrawdownEstimate, 0), 0.5)
      : estimatedDD;
  const bufferScore = Math.max(0, 100 - (dd / 0.35) * 100);

  let score =
    diversificationScore * 0.3 +
    volatilityScore * 0.25 +
    goalScore * 0.25 +
    bufferScore * 0.2;

  const regimeKey = regime ?? 'MODERATE';
  if (regimeKey === 'RISK_ON') score = Math.min(100, score + 3);
  else if (regimeKey === 'RISK_OFF') score = Math.max(0, score - 5);

  const profile = String(riskProfile ?? 'moderate').toLowerCase();
  if (profile === 'conservative' && volatilityScore < 50) score -= 5;
  else if (profile === 'aggressive' && volatilityScore > 70) score += 3;

  const cp = Math.max(0, Math.min(20, Number(concentrationPenalty) || 0));
  score -= cp;

  const rounded = Math.round(Math.min(100, Math.max(0, score)));

  let explanation =
    'Your portfolio blends diversification, volatility, goal progress, and drawdown cushion.';
  if (regimeKey === 'RISK_OFF' && rounded < 50) {
    explanation = 'Macro headwinds detected — defensive posture recommended.';
  } else if (regimeKey === 'RISK_ON' && rounded >= 71) {
    explanation = 'Strong portfolio shape with favorable macro tailwinds.';
  } else if (rounded >= 71) {
    explanation = 'Strong shape: diversified and aligned with your goal.';
  } else if (rounded >= 41) {
    explanation =
      'Room to improve: consider broader diversification or volatility balance.';
  } else {
    explanation = 'Elevated risk posture — review concentration and timeline.';
  }

  return {
    score: rounded,
    breakdown: {
      diversification: Math.round(diversificationScore),
      volatility: Math.round(volatilityScore),
      goalAlignment: Math.round(goalScore),
      drawdownBuffer: Math.round(bufferScore),
      concentration: Math.round(100 - cp * 5),
    },
    explanation,
  };
}

module.exports = { computeHealthScore };
