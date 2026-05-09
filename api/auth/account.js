const { json, authOk } = require('../_demo');

module.exports = (req, res) => {
  if (req.method !== 'DELETE') return json(res, 405, { error: 'Method not allowed' });
  if (!authOk(req)) return json(res, 401, { error: 'Unauthorized' });
  return json(res, 200, { ok: true });
};

