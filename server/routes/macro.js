const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { getMacroRegimePayload } = require('../engines/macroEngine');

const router = express.Router();
router.use(authMiddleware);

router.get('/regime', async (_req, res) => {
  try {
    const payload = await getMacroRegimePayload();
    res.json(payload);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
