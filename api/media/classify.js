const { getAuth } = require('firebase-admin/auth');
const { initializeFirebaseAdmin } = require('../../server/firebaseAdmin');
const {
  createClassificationService,
} = require('../_lib/classificationService');
const { checkRateLimit, setRateLimitHeaders } = require('../_lib/rateLimit');
const { fail, ok } = require('../_lib/response');
const service = createClassificationService();
const createHandler =
  ({
    verify = (token) => {
      initializeFirebaseAdmin();
      return getAuth().verifyIdToken(token, true);
    },
    classify = service.classify,
  } = {}) =>
  async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method !== 'POST')
      return fail(req, res, 405, 'METHOD_NOT_ALLOWED', 'Use POST.');
    const token = /^Bearer (\S+)$/.exec(req.headers?.authorization || '')?.[1];
    if (!token)
      return fail(req, res, 401, 'UNAUTHENTICATED', 'Sign in to continue.');
    let user;
    try {
      user = await verify(token);
    } catch {
      return fail(req, res, 401, 'UNAUTHENTICATED', 'Sign in to continue.');
    }
    const { isWhitelistedUid } = await import('../../src/config/access.js');
    if (
      user.firebase?.sign_in_provider === 'anonymous' ||
      !isWhitelistedUid(user.uid)
    )
      return fail(req, res, 403, 'FORBIDDEN', 'Account not approved.');
    const rate = checkRateLimit(req, 'classification');
    setRateLimitHeaders(res, rate);
    if (!rate.allowed)
      return fail(req, res, 429, 'RATE_LIMITED', 'Try again later.');
    const { id, type } = req.body || {};
    if (
      typeof id !== 'string' ||
      !/^[1-9]\d{0,9}$/.test(id) ||
      !['movie', 'show'].includes(type) ||
      Object.keys(req.body).some((key) => !['id', 'type'].includes(key))
    )
      return fail(
        req,
        res,
        400,
        'BAD_REQUEST',
        'Provide only a TMDB id and movie/show type.',
      );
    try {
      const result = await classify({
        id,
        type,
        appId: process.env.APP_ID || 'hearth-default',
      });
      return ok(req, res, result);
    } catch (error) {
      // Never log upstream bodies, headers, prompts or user data.
      return fail(
        req,
        res,
        error.status || 503,
        error.code || 'CLASSIFICATION_UNAVAILABLE',
        'Classification will retry later. Your title is saved.',
      );
    }
  };
module.exports = createHandler();
module.exports.createHandler = createHandler;
