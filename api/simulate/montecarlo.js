const { json, readBody, authOk } = require('../_demo');
const { runMonteCarloEngine } = require('../../server/engines/monteCarlo');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  if (!authOk(req)) return json(res, 401, { error: 'Unauthorized' });
  try {
    const body = await readBody(req);
    const { holdings, horizon, contribution, goalAmount } = body;
    const result = await runMonteCarloEngine({
      holdings,
      horizonYears: horizon,
      monthlyContribution: contribution,
      goalAmount,
    });
    return json(res, 200, result);
  } catch (e) {
    return json(res, 400, { error: e.message || 'Invalid JSON' });
  }
};

