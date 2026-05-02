const express = require('express');
const axios = require('axios');
const { authMiddleware } = require('../middleware/auth');
const db = require('../db');

const router = express.Router();
router.use(authMiddleware);

function portfolioSummaryForUser(userId) {
  const rows = db.prepare('SELECT ticker, type, quantity, avg_buy_price FROM holdings WHERE user_id = ?').all(userId);
  if (!rows.length) return 'No holdings yet.';
  return rows
    .map(
      (r) =>
        `${r.ticker} (${r.type}) — ${r.quantity} shares @ avg $${Number(r.avg_buy_price).toFixed(2)}`
    )
    .join('; ');
}

router.post('/message', async (req, res) => {
  try {
    const key = process.env.GROQ_API_KEY;
    if (!key || key === 'your_groq_api_key_here') {
      return res.json({
        reply: 'Chatbot unavailable — add GROQ_API_KEY to .env',
      });
    }

    const { messages, portfolioContext, macroRegime } = req.body;
    const portfolio =
      portfolioContext ||
      portfolioSummaryForUser(req.user.id);

    const regimeStr = macroRegime
      ? `${macroRegime.regime}: ${macroRegime.label}`
      : 'Unknown regime';

    const system = `You are Velox Assistant, a friendly financial guide for beginner investors. The user's portfolio: ${portfolio}. Current macro regime: ${regimeStr}. Explain simply. Avoid jargon. When asked about the Velox algorithm, explain how it switches between Risk-On, Moderate, and Risk-Off modes based on real GDP and Fed rate data.`;

    const url =
      process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions';
    const body = {
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: system }, ...(messages || [])],
      temperature: 0.6,
      max_tokens: 800,
    };

    const { data } = await axios.post(url, body, {
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    });

    const reply = data?.choices?.[0]?.message?.content ?? 'No response';
    res.json({ reply });
  } catch (e) {
    res.status(500).json({
      reply: `Assistant error: ${e.response?.data?.error?.message || e.message}`,
    });
  }
});

module.exports = router;
