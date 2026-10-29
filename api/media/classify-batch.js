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
    isAllowedUser = async (user) => {
      const { isWhitelistedUid } = await import('../../src/config/access.js');
      return (
        user.firebase?.sign_in_provider !== 'anonymous' &&
        isWhitelistedUid(user.uid)
      );
    },
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
    if (!(await isAllowedUser(user)))
      return fail(req, res, 403, 'FORBIDDEN', 'Account not approved.');
    const rate = checkRateLimit(req, 'classification');
    setRateLimitHeaders(res, rate);
    if (!rate.allowed)
      return fail(req, res, 429, 'RATE_LIMITED', 'Try again later.');
    const body = req.body;
    const items = body?.items;
    if (
      !body ||
      Array.isArray(body) ||
      Object.keys(body).some((key) => key !== 'items') ||
      !Array.isArray(items) ||
      items.length < 1 ||
      items.length > 10 ||
      items.some(
        (item) =>
          !item ||
          Array.isArray(item) ||
          typeof item.id !== 'string' ||
          !/^[1-9]\d{0,9}$/.test(item.id) ||
          !['movie', 'show'].includes(item.type) ||
          Object.keys(item).some((key) => !['id', 'type'].includes(key)),
      ) ||
      new Set(items.map(({ id, type }) => `${type}:${id}`)).size !==
        items.length
    )
      return fail(
        req,
        res,
        400,
        'BAD_REQUEST',
        'Provide 1..10 unique TMDB identities only.',
      );
    const results = new Array(items.length);
    let next = 0;
    await Promise.all(
      Array.from({ length: Math.min(3, items.length) }, async () => {
        while (next < items.length) {
          const index = next++;
          const { id, type } = items[index];
          try {
            const data = await classify({
              id,
              type,
              appId: process.env.APP_ID || 'hearth-default',
            });
            results[index] = { id, type, ok: true, data };
          } catch (error) {
            // Never expose upstream messages, bodies or prompts.
            results[index] = {
              id,
              type,
              ok: false,
              code: error?.code || 'CLASSIFICATION_UNAVAILABLE',
            };
          }
        }
      }),
    );
    return ok(req, res, results);
  };
module.exports = createHandler();
module.exports.createHandler = createHandler;
