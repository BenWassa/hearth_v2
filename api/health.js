const { ok } = require('./_lib/response');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  return ok(req, res, {
    status: 'healthy',
    service: 'hearth-api',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || 'unknown',
  });
};
