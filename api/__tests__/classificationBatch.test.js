const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { createHandler } = require('../media/classify-batch');
const { __resetRateLimitStore } = require('../_lib/rateLimit');
const { createMockReq, createMockRes } = require('./testUtils');
const uid = 'CdP5YrCYW1d1RjqVQVbnm5QJCLV2';
const savedEnv = { ...process.env };
afterEach(() => {
  process.env = { ...savedEnv };
  __resetRateLimitStore();
});
const items = Array.from({ length: 10 }, (_, i) => ({
  id: String(i + 1),
  type: 'movie',
}));
const verify = async (token) => {
  if (token === 'invalid') throw new Error('invalid');
  return {
    uid: token === 'outsider' ? 'other' : uid,
    firebase: {
      sign_in_provider: token === 'anonymous' ? 'anonymous' : 'google.com',
    },
  };
};
const invoke = async (
  handler,
  body = { items },
  authorization = 'Bearer allowed',
  method = 'POST',
) => {
  const res = createMockRes();
  await handler(
    createMockReq({ method, headers: { authorization }, body }),
    res,
  );
  assert.equal(res.output.headers['Cache-Control'], 'no-store');
  return res.output;
};
test('batch authentication, method and strict identity validation', async () => {
  let calls = 0;
  const handler = createHandler({
    verify,
    classify: async () => {
      calls++;
      return {};
    },
  });
  for (const [token, status] of [
    ['', 401],
    ['invalid', 401],
    ['outsider', 403],
    ['anonymous', 403],
  ]) {
    assert.equal(
      (await invoke(handler, { items }, token && `Bearer ${token}`)).statusCode,
      status,
    );
  }
  assert.equal(
    (await invoke(handler, { items }, 'Bearer allowed', 'GET')).statusCode,
    405,
  );
  for (const body of [
    null,
    [],
    {},
    { items: [] },
    { items: [...items, items[0]] },
    { items, note: 'private' },
    { items: [items[0], items[0]] },
    ...[
      null,
      [],
      { id: 1, type: 'movie' },
      { id: '0', type: 'movie' },
      { id: '12345678901', type: 'movie' },
      { id: '../x', type: 'movie' },
      { id: '1', type: 'tv' },
      { ...items[0], note: 'private' },
    ].map((item) => ({ items: [item] })),
  ]) {
    assert.equal((await invoke(handler, body)).statusCode, 400);
  }
  assert.equal(calls, 0);
});
test('batch isolates failures, bounds concurrency to three and charges one rate limit hit', async () => {
  process.env.API_RATE_LIMIT_MAX = '1';
  delete process.env.API_RATE_LIMIT_TOKENS_PER_SEC;
  delete process.env.API_RATE_LIMIT_BURST;
  let active = 0;
  let peak = 0;
  const handler = createHandler({
    verify,
    classify: async ({ id }) => {
      peak = Math.max(peak, ++active);
      await new Promise((resolve) => setImmediate(resolve));
      active--;
      if (id === '2')
        throw Object.assign(new Error('private upstream'), {
          code: 'UNAVAILABLE',
        });
      return { key: id };
    },
  });
  const response = await invoke(handler);
  assert.equal(response.statusCode, 200);
  assert.equal(peak, 3);
  assert.equal(response.headers['X-RateLimit-Remaining'], '0');
  const payload = response.body;
  assert.equal(payload.data.length, 10);
  assert.deepEqual(payload.data[1], {
    id: '2',
    type: 'movie',
    ok: false,
    code: 'UNAVAILABLE',
  });
  assert.deepEqual(payload.data[0], {
    id: '1',
    type: 'movie',
    ok: true,
    data: { key: '1' },
  });
  assert.equal((await invoke(handler)).statusCode, 429);
});
