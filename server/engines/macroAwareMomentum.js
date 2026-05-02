const axios = require('axios');
const { classifyRegime } = require('./macroEngine');
const { getDefensiveWeights } = require('./defensiveBasket');
const { chartHistory } = require('../services/yahooMarket');

const RISK_ON_UNIVERSE = ['SPY', 'QQQ', 'GLD', 'TLT', 'VNQ', 'XLK', 'XLF', 'XLE', 'XLV', 'XLI', 'XLY'];

const ALL_TICKERS = [...new Set([...RISK_ON_UNIVERSE, 'BIL', 'SPY'])];

let fredHistoricalCache = null;

async function fetchFredAscending(seriesId, apiKey, limit = 800) {
  const url = `https://api.stlouisfed.org/fred/series/observations`;
  const { data } = await axios.get(url, {
    params: {
      series_id: seriesId,
      api_key: apiKey,
      file_type: 'json',
      sort_order: 'asc',
      limit,
    },
    timeout: 20000,
  });
  return (data.observations || [])
    .filter((o) => o.value !== '.' && o.value !== '' && !Number.isNaN(Number(o.value)))
    .map((o) => ({ date: o.date, value: Number(o.value) }));
}

async function loadFredHistorical() {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey || apiKey === 'your_fred_api_key_here') return null;
  if (fredHistoricalCache) return fredHistoricalCache;
  try {
    const [gdp, fed] = await Promise.all([
      fetchFredAscending('A191RL1Q225SBEA', apiKey, 400),
      fetchFredAscending('FEDFUNDS', apiKey, 900),
    ]);
    fredHistoricalCache = { gdp, fed };
    return fredHistoricalCache;
  } catch {
    return null;
  }
}

function regimeForMonthEnd(gdpAsc, fedAsc, monthEndStr) {
  let gdpGrowth = 0;
  for (let i = gdpAsc.length - 1; i >= 0; i--) {
    if (gdpAsc[i].date <= monthEndStr) {
      gdpGrowth = gdpAsc[i].value;
      break;
    }
  }
  let currentRate = 2.5;
  let prevRate = 2.5;
  for (let i = fedAsc.length - 1; i >= 0; i--) {
    if (fedAsc[i].date <= monthEndStr) {
      currentRate = fedAsc[i].value;
      prevRate = i > 0 ? fedAsc[i - 1].value : currentRate;
      break;
    }
  }
  return classifyRegime(gdpGrowth, currentRate, prevRate);
}

function normalizeDaily(rows) {
  return rows
    .map((r) => {
      const d = r.date instanceof Date ? r.date.toISOString().slice(0, 10) : String(r.date).slice(0, 10);
      const c = r.adjClose ?? r.close ?? r.adjclose;
      return { date: d, close: Number(c) };
    })
    .filter((r) => !Number.isNaN(r.close))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

async function fetchDailyHistory(ticker, period1, period2) {
  const rows = await chartHistory(ticker, period1, period2, '1d');
  return normalizeDaily(rows || []);
}

function indexOnOrBefore(series, dateStr) {
  let lo = 0;
  let hi = series.length - 1;
  let ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (series[mid].date <= dateStr) {
      ans = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return ans;
}

function momentumWindow(series, endIdx, tradingDays = 63) {
  const startIdx = Math.max(0, endIdx - tradingDays);
  if (endIdx < 1 || series[endIdx].close <= 0 || series[startIdx].close <= 0) {
    return { ret3m: 0, vol: 0.01 };
  }
  const rets = [];
  for (let i = Math.max(1, startIdx); i <= endIdx; i++) {
    const p0 = series[i - 1].close;
    const p1 = series[i].close;
    if (p0 > 0) rets.push(p1 / p0 - 1);
  }
  if (!rets.length) return { ret3m: 0, vol: 0.01 };
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
  const variance =
    rets.reduce((a, r) => a + (r - mean) ** 2, 0) / Math.max(rets.length - 1, 1);
  const vol = Math.sqrt(Math.max(variance, 0)) * Math.sqrt(252);
  const ret3m = series[endIdx].close / series[startIdx].close - 1;
  return { ret3m, vol: Math.max(vol, 1e-6) };
}

function pickMomentumAllocation(regime, seriesByTicker, decisionDateStr) {
  if (regime === 'RISK_OFF') {
    return getDefensiveWeights();
  }

  const scored = [];
  for (const t of RISK_ON_UNIVERSE) {
    const s = seriesByTicker[t];
    if (!s || !s.length) continue;
    const idx = indexOnOrBefore(s, decisionDateStr);
    if (idx < 5) continue;
    const { ret3m, vol } = momentumWindow(s, idx, 63);
    if (regime === 'RISK_ON' && ret3m <= 0.07) continue;
    scored.push({ t, score: ret3m / vol, ret3m });
  }
  scored.sort((a, b) => b.score - a.score);
  const k = regime === 'MODERATE' ? 3 : 2;
  const winners = scored.slice(0, k);
  if (!winners.length) {
    return getDefensiveWeights();
  }
  const w = 1 / winners.length;
  const weights = {};
  for (const x of winners) weights[x.t] = w;
  return weights;
}

function monthlyReturn(series, d0, d1) {
  const i0 = indexOnOrBefore(series, d0);
  const i1 = indexOnOrBefore(series, d1);
  if (i0 < 0 || i1 < 0 || i0 >= series.length || i1 >= series.length) return 0;
  const p0 = series[i0].close;
  const p1 = series[i1].close;
  if (!p0 || !p1) return 0;
  return p1 / p0 - 1;
}

function portfolioMonthReturn(weights, seriesByTicker, monthStartStr, monthEndStr) {
  let r = 0;
  for (const [t, w] of Object.entries(weights)) {
    const s = seriesByTicker[t];
    if (!s) continue;
    r += w * monthlyReturn(s, monthStartStr, monthEndStr);
  }
  return r;
}

function formatWeights(weights) {
  const entries = Object.entries(weights).sort((a, b) => b[1] - a[1]);
  return entries.map(([t, w]) => `${t} ${(w * 100).toFixed(0)}%`).join(', ');
}

function computeStats(values, spyValues, monthsPerYear = 12) {
  const rets = [];
  for (let i = 1; i < values.length; i++) {
    rets.push(values[i] / values[i - 1] - 1);
  }
  const totalReturn = values[values.length - 1] / values[0] - 1;
  const n = values.length - 1;
  const years = n / monthsPerYear;
  const annualizedReturn = years > 0 ? (values[values.length - 1] / values[0]) ** (1 / years) - 1 : 0;
  const mean = rets.reduce((a, b) => a + b, 0) / Math.max(rets.length, 1);
  const variance =
    rets.reduce((a, r) => a + (r - mean) ** 2, 0) / Math.max(rets.length - 1, 1);
  const volMonthly = Math.sqrt(Math.max(variance, 0));
  const volatility = volMonthly * Math.sqrt(monthsPerYear);
  const sharpeRatio = volatility > 1e-9 ? (annualizedReturn - 0.02) / volatility : 0;

  let peak = values[0];
  let maxDrawdown = 0;
  for (const v of values) {
    peak = Math.max(peak, v);
    maxDrawdown = Math.min(maxDrawdown, v / peak - 1);
  }

  const spyTotal = spyValues[spyValues.length - 1] / spyValues[0] - 1;
  const vsSpyAlpha = totalReturn - spyTotal;

  return {
    totalReturn,
    annualizedReturn,
    volatility,
    sharpeRatio,
    maxDrawdown,
    finalValue: values[values.length - 1],
    vsSpyAlpha,
  };
}

/** Monthly rebalance dates from Jan 2020 through the current calendar month (end date rolls forward with “today”). */
function monthPairsFrom2020ThroughToday() {
  const pairs = [];
  const now = new Date();
  const endY = now.getFullYear();
  const endM = now.getMonth() + 1;
  for (let y = 2020; y <= endY; y++) {
    const mLo = y === 2020 ? 1 : 1;
    const mHi = y === endY ? endM : 12;
    for (let m = mLo; m <= mHi; m++) {
      pairs.push({ y, m });
    }
  }
  return pairs;
}

function calendarMonthEnd(y, m) {
  const d = new Date(y, m, 0);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** Local calendar date YYYY-MM-DD (server timezone). */
function isoDateLocal(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

async function runMacroAwareBacktest(corpus = 100000) {
  const period1 = new Date('2019-05-01');
  const period2 = new Date();

  const fred = await loadFredHistorical();
  const gdpAsc = fred?.gdp || [{ date: '2000-01-01', value: 2 }];
  const fedAsc = fred?.fed || [
    { date: '2000-01-01', value: 2 },
    { date: '2000-02-01', value: 2 },
  ];

  const seriesByTicker = {};
  await Promise.all(
    ALL_TICKERS.map(async (t) => {
      try {
        seriesByTicker[t] = await fetchDailyHistory(t, period1, period2);
      } catch {
        seriesByTicker[t] = [];
      }
    })
  );

  const spySeries = seriesByTicker.SPY;
  const monthPairs = monthPairsFrom2020ThroughToday();

  const dates = [];
  const portfolioValues = [];
  const regimeHistory = [];
  const positionHistory = [];
  const spyBenchmark = [];

  let value = corpus;
  let spyVal = corpus;

  const dec2019End = calendarMonthEnd(2019, 12);

  const runNow = new Date();
  const todayStr = isoDateLocal(runNow);
  const curYear = runNow.getFullYear();
  const curMonth = runNow.getMonth() + 1;

  for (let i = 0; i < monthPairs.length; i++) {
    const { y, m } = monthPairs[i];
    const prevY = m === 1 ? y - 1 : y;
    const prevM = m === 1 ? 12 : m - 1;
    const decisionEnd = calendarMonthEnd(prevY, prevM);
    const decisionStr = i === 0 ? dec2019End : decisionEnd;

    const startStr = m === 1 ? calendarMonthEnd(y - 1, 12) : calendarMonthEnd(y, m - 1);
    const monthEndStr = calendarMonthEnd(y, m);
    const isCurrentMonth = y === curYear && m === curMonth;
    const endStr = isCurrentMonth ? todayStr : monthEndStr;

    const regime = regimeForMonthEnd(gdpAsc, fedAsc, decisionStr);
    const weights = pickMomentumAllocation(regime, seriesByTicker, decisionStr);

    const pr = portfolioMonthReturn(weights, seriesByTicker, startStr, endStr);
    const sr =
      spySeries && spySeries.length
        ? monthlyReturn(spySeries, startStr, endStr)
        : 0;

    value *= 1 + pr;
    spyVal *= 1 + sr;

    dates.push(endStr);
    portfolioValues.push(value);
    regimeHistory.push(regime);
    spyBenchmark.push(spyVal);
    positionHistory.push({
      dateRange: `${startStr} → ${endStr}`,
      regime,
      holdings: formatWeights(weights),
      weights,
    });
  }

  const stats = computeStats(portfolioValues, spyBenchmark);

  return {
    portfolioValues,
    dates,
    regimeHistory,
    positionHistory,
    spyBenchmark,
    stats,
    corpus,
  };
}

module.exports = {
  RISK_ON_UNIVERSE,
  runMacroAwareBacktest,
};
