const test = require('node:test');
const assert = require('node:assert/strict');

const {
  __resetRateLimitStore,
  checkRateLimit,
  setRateLimitHeaders,
} = require('../_lib/rateLimit');
const { createMockReq, createMockRes } = require('./testUtils');

const originalEnv = { ...process.env };
const originalNow = Date.now;

test.afterEach(() => {
  process.env = { ...originalEnv };
  Date.now = originalNow;
  __resetRateLimitStore();
});

test('token bucket rate limiter applies weighted costs and retry-after', () => {
  process.env.API_RATE_LIMIT_TOKENS_PER_SEC = '10';
  process.env.API_RATE_LIMIT_BURST = '10';
  process.env.API_RATE_LIMIT_SCOPE_WEIGHTS = JSON.stringify({
    default: 1,
    'media-episodes': 2,
  });
  Date.now = () => 1_000;

  const req = createMockReq({ headers: { 'x-forwarded-for': '1.1.1.1' } });

  for (let index = 0; index < 5; index += 1) {
    const rate = checkRateLimit(req, 'media-episodes');
    assert.equal(rate.allowed, true);
  }

  const blocked = checkRateLimit(req, 'media-episodes');
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.remaining, 0);
  assert.ok(blocked.retryAfterMs >= 190 && blocked.retryAfterMs <= 250);

  const res = createMockRes();
  setRateLimitHeaders(res, blocked);
  assert.equal(res.output.headers['X-RateLimit-Scope'], 'media-episodes');
  assert.equal(res.output.headers['X-RateLimit-Remaining'], '0');
  assert.equal(res.output.headers['Retry-After'], '1');
});

test('falls back to fixed window limiter when token bucket env is missing', () => {
  delete process.env.API_RATE_LIMIT_TOKENS_PER_SEC;
  delete process.env.API_RATE_LIMIT_BURST;
  process.env.API_RATE_LIMIT_WINDOW_MS = '1000';
  process.env.API_RATE_LIMIT_MAX = '2';
  Date.now = () => 2_000;

  const req = createMockReq({ headers: { 'x-forwarded-for': '2.2.2.2' } });
  assert.equal(checkRateLimit(req, 'search').allowed, true);
  assert.equal(checkRateLimit(req, 'search').allowed, true);
  const blocked = checkRateLimit(req, 'search');
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterMs > 0);
});
