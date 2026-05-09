const { json, getDemoMacroRegimePayload, authOk } = require('../_demo');

module.exports = (_req, res) => {
  // Frontend calls this frequently; keep it fast and deterministic.
  if (!authOk(_req)) return json(res, 401, { error: 'Unauthorized' });
  return json(res, 200, getDemoMacroRegimePayload());
};

