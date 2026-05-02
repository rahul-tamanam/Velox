import api from './api';

/**
 * Calls backend POST /api/ai/chart-analysis - Groq key stays server-side only.
 *
 * @param {object} payload
 * @param {string} payload.symbol
 * @param {string} payload.timeframe
 * @param {number} payload.firstClose
 * @param {number} payload.lastClose
 * @param {number} payload.high
 * @param {number} payload.low
 * @param {number} payload.bullCount
 * @param {number} payload.bearCount
 * @param {string} payload.trend - 'uptrend' | 'downtrend' | 'sideways'
 */
export async function fetchChartInsight(payload) {
  const { data } = await api.post('/ai/chart-analysis', payload);
  return data.analysis;
}
