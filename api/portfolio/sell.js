const { json, readBody, authOk } = require('../_demo');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  if (!authOk(req)) return json(res, 401, { error: 'Unauthorized' });
  try {
    await readBody(req);
    // Stateless demo: acknowledge sell without persistence.
    return json(res, 200, { ok: true, deleted: false, remaining_quantity: 0 });
  } catch (e) {
    return json(res, 400, { error: e.message || 'Invalid JSON' });
  }
};

