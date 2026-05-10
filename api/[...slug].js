/** Hobby plan: one Serverless Function handles every /api/* route (see server/vercelApiRouter.js). */
const { handleApi } = require('../server/vercelApiRouter');

module.exports = handleApi;
