/**
 * Compute narrative stats from OHLC candles (same shape as lightweight-charts).
 */

export function computeTrend(firstClose, lastClose) {
  if (!firstClose || firstClose <= 0) return 'sideways';
  if (lastClose > firstClose * 1.02) return 'uptrend';
  if (lastClose < firstClose * 0.98) return 'downtrend';
  return 'sideways';
}

export function computeChartStats(candles) {
  if (!candles?.length) return null;

  const first = candles[0];
  const last = candles[candles.length - 1];
  const firstClose = first.close;
  const lastClose = last.close;

  let high = -Infinity;
  let low = Infinity;
  let bullCount = 0;
  let bearCount = 0;

  for (const c of candles) {
    high = Math.max(high, c.high);
    low = Math.min(low, c.low);
    if (c.close > c.open) bullCount += 1;
    else if (c.close < c.open) bearCount += 1;
  }

  const trend = computeTrend(firstClose, lastClose);

  const periodReturnPct =
    firstClose > 0 ? ((lastClose - firstClose) / firstClose) * 100 : 0;

  const ranges = candles.map((c) => {
    const mid = c.close || (c.high + c.low) / 2 || 1;
    return (c.high - c.low) / mid;
  });
  const avgRange = ranges.reduce((a, b) => a + b, 0) / ranges.length;

  let volatility = 'Low';
  if (avgRange > 0.03) volatility = 'High';
  else if (avgRange > 0.015) volatility = 'Medium';

  const last3 = candles.slice(-3);
  let momentum = 'Neutral';
  if (last3.length >= 2) {
    const bulls = last3.filter((c) => c.close > c.open).length;
    const bears = last3.filter((c) => c.close < c.open).length;
    if (bulls >= 2 && bulls > bears) momentum = 'Bullish';
    else if (bears >= 2 && bears > bulls) momentum = 'Bearish';
    else momentum = 'Mixed';
  }

  return {
    firstClose,
    lastClose,
    high,
    low,
    bullCount,
    bearCount,
    trend,
    periodReturnPct,
    volatility,
    momentum,
  };
}
