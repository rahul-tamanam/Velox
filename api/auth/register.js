const { json, readBody, demoUser } = require('../_demo');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  try {
    const body = await readBody(req);
    const name = String(body.name || 'Demo User').trim() || 'Demo User';
    const email = String(body.email || 'demo@velox.com').trim().toLowerCase();
    return json(res, 200, {
      token: 'demo-token',
      user: demoUser({ name, email }),
    });
  } catch (e) {
    return json(res, 400, { error: e.message || 'Invalid JSON' });
  }
};

