const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { createHandler } = require('../media/classify-batch');
const { isDemoUser } = require('../media/classify-demo');
const { __resetRateLimitStore } = require('../_lib/rateLimit');
const { createMockReq, createMockRes } = require('./testUtils');
const savedEnv = { ...process.env };
afterEach(() => {
  process.env = { ...savedEnv };
  __resetRateLimitStore();
});
const makeHandler = (classify) =>
  createHandler({
    isAllowedUser: isDemoUser,
    classify,
    verify: async (token) => {
      if (token === 'invalid') throw new Error('invalid');
      return {
        uid: 'demo-user',
        firebase: {
          sign_in_provider: token === 'anonymous' ? 'anonymous' : 'google.com',
        },
      };
    },
  });
const invoke = async (
  handler,
  token,
  body = { items: [{ id: '603', type: 'movie' }] },
) => {
  const res = createMockRes();
  await handler(
    createMockReq({
      method: 'POST',
      headers: { authorization: token ? `Bearer ${token}` : '' },
      body,
    }),
    res,
  );
  return res.output;
};
test('demo endpoint requires verified anonymous auth and sends only validated public identities', async () => {
  const calls = [];
  const handler = makeHandler(async (args) => {
    calls.push(args);
    return { key: 'tmdb:movie:603' };
  });
  for (const [token, status] of [
    ['', 401],
    ['invalid', 401],
    ['google', 403],
  ]) {
    assert.equal((await invoke(handler, token)).statusCode, status);
  }
  assert.equal(
    (
      await invoke(handler, 'anonymous', {
        items: [{ id: '603', type: 'movie', note: 'private' }],
      })
    ).statusCode,
    400,
  );
  assert.equal(calls.length, 0);
  const result = await invoke(handler, 'anonymous');
  assert.equal(result.statusCode, 200);
  assert.equal(result.headers['Cache-Control'], 'no-store');
  assert.deepEqual(calls, [
    { id: '603', type: 'movie', appId: process.env.APP_ID || 'hearth-default' },
  ]);
});
test('demo endpoint retains request rate limits', async () => {
  process.env.API_RATE_LIMIT_MAX = '1';
  delete process.env.API_RATE_LIMIT_TOKENS_PER_SEC;
  delete process.env.API_RATE_LIMIT_BURST;
  const handler = makeHandler(async () => ({}));
  assert.equal((await invoke(handler, 'anonymous')).statusCode, 200);
  assert.equal((await invoke(handler, 'anonymous')).statusCode, 429);
});
