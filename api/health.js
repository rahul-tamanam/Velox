const { json } = require('./_demo');

module.exports = (req, res) => {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });
  return json(res, 200, { ok: true, service: 'velox-api', demoMode: true });
};

