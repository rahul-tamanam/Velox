const { json, authOk } = require('../_demo');
const { runMacroAwareBacktest } = require('../../server/engines/macroAwareMomentum');

const CORPUS_MIN = 1_000;
const CORPUS_MAX = 100_000_000;

module.exports = async (req, res) => {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });
  if (!authOk(req)) return json(res, 401, { error: 'Unauthorized' });
  try {
    const url = new URL(req.url, 'http://localhost');
    let corpus = Number(url.searchParams.get('corpus'));
    if (!Number.isFinite(corpus)) corpus = 100_000;
    corpus = Math.round(corpus);
    corpus = Math.min(Math.max(corpus, CORPUS_MIN), CORPUS_MAX);
    const result = await runMacroAwareBacktest(corpus);
    return json(res, 200, result);
  } catch (e) {
    return json(res, 500, { error: e.message || 'Backtest failed' });
  }
};

