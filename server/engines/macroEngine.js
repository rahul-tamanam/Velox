const axios = require('axios');
const NodeCache = require('node-cache');

const macroCache = new NodeCache({ stdTTL: 86400, checkperiod: 600 });

function classifyRegime(gdpGrowth, currentRate, prevRate) {
  const gdpOk = gdpGrowth > 0;
  const rateChange = currentRate - prevRate;
  const ratesOk = rateChange <= 0.25;
  if (gdpOk && ratesOk) return 'RISK_ON';
  if (gdpOk && !ratesOk) return 'MODERATE';
  return 'RISK_OFF';
}

const REGIME_LABELS = {
  RISK_ON: 'Economy growing, rates stable - full momentum mode',
  MODERATE: 'Growth OK but rates rising - diversified momentum',
  RISK_OFF: 'Weak growth or restrictive rates - defensive positioning',
};

async function fetchFredSeries(seriesId, apiKey) {
  const cacheKey = `fred:${seriesId}`;
  const cached = macroCache.get(cacheKey);
  if (cached) return cached;

  const url = `https://api.stlouisfed.org/fred/series/observations`;
  const { data } = await axios.get(url, {
    params: {
      series_id: seriesId,
      api_key: apiKey,
      file_type: 'json',
      sort_order: 'desc',
      limit: 24,
    },
    timeout: 15000,
  });
  macroCache.set(cacheKey, data);
  return data;
}

function latestObservation(observations) {
  if (!observations || !observations.length) return null;
  for (const o of observations) {
    if (o.value !== '.' && o.value !== '' && !Number.isNaN(Number(o.value))) {
      return { date: o.date, value: Number(o.value) };
    }
  }
  return null;
}

/** FRED returns observations newest-first when sort_order=desc */
function twoLatestValid(observations) {
  const out = [];
  for (const o of observations || []) {
    if (o.value === '.' || o.value === '' || Number.isNaN(Number(o.value))) continue;
    out.push({ date: o.date, value: Number(o.value) });
    if (out.length >= 2) break;
  }
  return out;
}

async function getMacroRegimePayload() {
  const apiKey = process.env.FRED_API_KEY;
  const fallback = {
    regime: 'MODERATE',
    gdpGrowth: null,
    fedFundsRate: null,
    rateChange: null,
    gdpOk: true,
    ratesOk: true,
    label: REGIME_LABELS.MODERATE,
    lastUpdated: new Date().toISOString().slice(0, 10),
    warning: 'FRED unavailable or API key missing - using MODERATE fallback',
  };

  if (!apiKey || apiKey === 'your_fred_api_key_here') {
    return fallback;
  }

  try {
    const [gdpData, fedData] = await Promise.all([
      fetchFredSeries('A191RL1Q225SBEA', apiKey),
      fetchFredSeries('FEDFUNDS', apiKey),
    ]);

    const gdpObs = gdpData.observations || [];
    const fedObs = fedData.observations || [];

    const latestGdp = latestObservation(gdpObs);
    const fedPair = twoLatestValid(fedObs);
    const latestFed = fedPair[0];
    const prevFed = fedPair[1];

    if (!latestGdp || !latestFed || !prevFed) {
      return fallback;
    }

    const gdpGrowth = latestGdp.value;
    const currentRate = latestFed.value;
    const prevRate = prevFed.value;
    const regime = classifyRegime(gdpGrowth, currentRate, prevRate);
    const rateChange = currentRate - prevRate;
    const gdpOk = gdpGrowth > 0;
    const ratesOk = rateChange <= 0.25;

    return {
      regime,
      gdpGrowth,
      fedFundsRate: currentRate,
      rateChange,
      gdpOk,
      ratesOk,
      label: REGIME_LABELS[regime] || REGIME_LABELS.MODERATE,
      lastUpdated: latestFed.date,
      warning: undefined,
    };
  } catch (err) {
    return { ...fallback, warning: `FRED error: ${err.message}` };
  }
}

module.exports = {
  classifyRegime,
  getMacroRegimePayload,
  REGIME_LABELS,
};
