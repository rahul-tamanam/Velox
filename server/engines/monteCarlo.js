const { getQuoteRow, chartHistory } = require('../services/yahooMarket');

function randn() {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function mean(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stdev(arr) {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  const v = arr.reduce((a, r) => a + (r - m) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(Math.max(v, 0));
}

async function fetchAnnualStats(ticker) {
  const end = new Date();
  const start = new Date();
  start.setFullYear(start.getFullYear() - 5);
  let rows = [];
  try {
    rows = await chartHistory(ticker, start, end, '1d');
  } catch {
    return { mu: 0.07, sigma: 0.18 };
  }
  const sorted = (rows || []).sort((a, b) => new Date(a.date) - new Date(b.date));
  const rets = [];
  for (let i = 1; i < sorted.length; i++) {
    const p0 = sorted[i - 1].adjClose ?? sorted[i - 1].close;
    const p1 = sorted[i].adjClose ?? sorted[i].close;
    if (p0 > 0 && p1 > 0) rets.push(Math.log(p1 / p0));
  }
  const dailyMean = mean(rets);
  const dailySigma = stdev(rets);
  const mu = Math.exp(dailyMean * 252) - 1;
  const sigma = dailySigma * Math.sqrt(252);
  return {
    mu: Number.isFinite(mu) ? mu : 0.07,
    sigma: Number.isFinite(sigma) && sigma > 0 ? sigma : 0.18,
  };
}

async function runMonteCarloEngine({
  holdings,
  horizonYears,
  monthlyContribution = 0,
  goalAmount,
}) {
  const horizon = Math.min(Math.max(Number(horizonYears) || 10, 1), 30);
  const contrib = Math.max(Number(monthlyContribution) || 0, 0);

  const priced = [];
  let totalVal = 0;
  for (const h of holdings || []) {
    const qty = Number(h.quantity) || 0;
    let price = Number(h.currentPrice);
    if (!price && h.ticker) {
      try {
        const q = await getQuoteRow(h.ticker);
        price = q.regularMarketPrice ?? q.postMarketPrice ?? (qty ? 100 : 0);
      } catch {
        price = h.avg_buy_price || 0;
      }
    }
    const v = qty * price;
    totalVal += v;
    priced.push({ ticker: h.ticker, value: v });
  }
  if (totalVal <= 0) totalVal = 1;

  const statsByTicker = {};
  await Promise.all(
    priced.map(async (p) => {
      if (!p.ticker) return;
      statsByTicker[p.ticker] = await fetchAnnualStats(p.ticker);
    })
  );

  let muP = 0;
  let varP = 0;
  for (const p of priced) {
    const w = p.value / totalVal;
    const s = statsByTicker[p.ticker] || { mu: 0.07, sigma: 0.18 };
    muP += w * s.mu;
    varP += (w * s.sigma) ** 2;
  }
  const sigmaP = Math.sqrt(Math.max(varP, 1e-8));

  const steps = Math.round(horizon * 12);
  const dt = 1 / 12;
  const pathCount = 1000;
  const pathEnds = [];
  const byMonth = Array.from({ length: steps + 1 }, () => []);

  function pct(arr, q) {
    const s = [...arr].sort((a, b) => a - b);
    if (!s.length) return totalVal;
    const idx = Math.min(s.length - 1, Math.max(0, Math.floor((s.length - 1) * q)));
    return s[idx];
  }

  for (let p = 0; p < pathCount; p++) {
    let v = totalVal;
    byMonth[0].push(v);
    for (let t = 0; t < steps; t++) {
      v += contrib;
      const z = randn();
      const drift = (Math.log1p(muP) - 0.5 * sigmaP ** 2) * dt;
      const shock = sigmaP * Math.sqrt(dt) * z;
      v = v * Math.exp(drift + shock);
      byMonth[t + 1].push(v);
    }
    pathEnds.push(v);
  }

  const fanChart = byMonth.map((arr, i) => ({
    month: i,
    p10: pct(arr, 0.1),
    p25: pct(arr, 0.25),
    p50: pct(arr, 0.5),
    p75: pct(arr, 0.75),
    p90: pct(arr, 0.9),
  }));

  const sortedEnds = [...pathEnds].sort((a, b) => a - b);
  const medianFinal = sortedEnds[Math.floor(sortedEnds.length / 2)];
  const p10Final = sortedEnds[Math.floor(sortedEnds.length * 0.1)];
  const goal = Number(goalAmount);
  let hitGoal = 0;
  if (goal > 0) {
    hitGoal = pathEnds.filter((x) => x >= goal).length / pathEnds.length;
  }

  return {
    fanChart,
    medianFinal,
    probHitGoal: hitGoal,
    worstCaseP10: p10Final,
    initialValue: totalVal,
    horizonYears: horizon,
  };
}

module.exports = { runMonteCarloEngine, fetchAnnualStats };
