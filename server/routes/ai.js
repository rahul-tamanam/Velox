const express = require('express');

const router = express.Router();

function fmtUsd(n) {
  if (n == null || Number.isNaN(Number(n))) return '—';
  return `$${Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

router.post('/chart-analysis', async (req, res) => {
  try {
    const {
      symbol,
      timeframe,
      firstClose,
      lastClose,
      high,
      low,
      bullCount,
      bearCount,
      trend,
    } = req.body;

    if (
      !symbol ||
      firstClose == null ||
      lastClose == null ||
      high == null ||
      low == null ||
      bullCount == null ||
      bearCount == null ||
      !trend
    ) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const apiKey = process.env.GROQ_API_KEY;
    const apiUrl =
      process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions';
    const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

    if (!apiKey) {
      return res.status(503).json({ error: 'Groq not configured' });
    }

    const trendLabel =
      trend === 'uptrend' ? 'up' : trend === 'downtrend' ? 'down' : 'sideways';

    const tf = String(timeframe || 'the selected period');

    const prompt = `You are a concise financial analyst. Given this candlestick data for ${symbol} over ${tf}:
- First price: ${fmtUsd(firstClose)}
- Last price: ${fmtUsd(lastClose)}
- High: ${fmtUsd(high)}, Low: ${fmtUsd(low)}
- Trend: ${trendLabel} (up/down/sideways)
- Bullish candles: ${bullCount}, Bearish candles: ${bearCount}

Write 2-3 sentences explaining what is happening in plain English for a retail investor. 
Be specific about price action, momentum, and any notable pattern. No jargon.`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 180,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[ai/chart-analysis] Groq error', data);
      return res.status(502).json({
        error: data?.error?.message || 'Groq request failed',
      });
    }

    const analysis = data?.choices?.[0]?.message?.content?.trim();
    if (!analysis) {
      return res.status(502).json({ error: 'Empty Groq response' });
    }

    res.json({ analysis });
  } catch (e) {
    console.error('[ai/chart-analysis]', e);
    res.status(500).json({ error: e.message || 'Server error' });
  }
});

module.exports = router;
