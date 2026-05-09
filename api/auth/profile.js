const { json, readBody, demoUser, authOk } = require('../_demo');

module.exports = async (req, res) => {
  if (req.method !== 'PATCH') return json(res, 405, { error: 'Method not allowed' });
  if (!authOk(req)) return json(res, 401, { error: 'Unauthorized' });
  try {
    const body = await readBody(req);
    // Stateless demo: just echo updates into the returned user object.
    return json(res, 200, { user: demoUser(body || {}) });
  } catch (e) {
    return json(res, 400, { error: e.message || 'Invalid JSON' });
  }
};

