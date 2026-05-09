const { json, readBody, authOk } = require('../_demo');
const { computeExitCost } = require('../../server/engines/exitCost');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  if (!authOk(req)) return json(res, 401, { error: 'Unauthorized' });
  try {
    const body = await readBody(req);
    const result = computeExitCost(body);
    const holdNet = (Number(body.quantity) || 0) * (Number(body.buyPrice) || 0);
    return json(res, 200, {
      ...result,
      comparison: {
        holdLabel: 'Hold',
        sellNet: result.netProceeds,
        holdApprox: holdNet,
      },
    });
  } catch (e) {
    return json(res, 400, { error: e.message || 'Invalid JSON' });
  }
};

