/**
 * Single Vercel function for all `/api/*` routes (Vite is not Next.js — bracket
 * filenames under `/api` are unreliable). Rewrites send traffic here with `?slug=...`.
 */
const { handleApi } = require('../server/vercelApiRouter');

module.exports = handleApi;
