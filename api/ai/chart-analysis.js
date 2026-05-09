const { json, readBody, authOk } = require('../_demo');

function fmtUsd(n) {
  if (n == null || Number.isNaN(Number(n))) return 'N/A';
  return `$${Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  if (!authOk(req)) return json(res, 401, { error: 'Unauthorized' });
  try {
    const body = await readBody(req);
    const {
      symbol,
      timeframe,
      firstClose,
      lastClose,
      high,
      low,
      bullCount,
      bearCount,
      trend,
    } = body || {};

    if (
      !symbol ||
      firstClose == null ||
      lastClose == null ||
      high == null ||
      low == null ||
      bullCount == null ||
      bearCount == null ||
      !trend
    ) {
      return json(res, 400, { error: 'Missing required fields' });
    }

    const tf = String(timeframe || 'the selected period');
    const dir =
      trend === 'uptrend' ? 'up' : trend === 'downtrend' ? 'down' : 'sideways';
    const change = Number(firstClose) > 0 ? (Number(lastClose) - Number(firstClose)) / Number(firstClose) : 0;
    const sign = change >= 0 ? 'up' : 'down';
    const pct = `${Math.abs(change * 100).toFixed(1)}%`;
    const candles = Number(bullCount) + Number(bearCount);

    const analysis =
      `Over ${tf}, **${String(symbol).toUpperCase()}** moved ${sign} about ${pct} from ${fmtUsd(firstClose)} to ${fmtUsd(lastClose)}. ` +
      `The range was ${fmtUsd(low)} to ${fmtUsd(high)}, and the candle mix (${bullCount} bullish vs ${bearCount} bearish out of ${candles}) supports a ${dir} bias. ` +
      `For the demo deployment, this is a deterministic summary generated locally, not a live AI model.`;

    return json(res, 200, { analysis });
  } catch (e) {
    return json(res, 400, { error: e.message || 'Invalid JSON' });
  }
};

