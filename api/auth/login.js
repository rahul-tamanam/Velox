const { json, readBody, demoUser } = require('../_demo');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  try {
    const body = await readBody(req);
    const email = String(body.email || 'demo@velox.com').trim().toLowerCase();
    // Demo token: client just stores it and sends it back.
    return json(res, 200, {
      token: 'demo-token',
      user: demoUser({ email }),
    });
  } catch (e) {
    return json(res, 400, { error: e.message || 'Invalid JSON' });
  }
};

