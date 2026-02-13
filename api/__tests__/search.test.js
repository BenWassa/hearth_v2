const test = require('node:test');
const assert = require('node:assert/strict');

const searchHandler = require('../search');
const { createMockReq, createMockRes } = require('./testUtils');

const originalEnv = { ...process.env };
const originalFetch = global.fetch;

test.afterEach(() => {
  process.env = { ...originalEnv };
  global.fetch = originalFetch;
});

test('search rejects short query', async () => {
  const req = createMockReq({
    query: { q: 'a' },
  });
  const res = createMockRes();

  await searchHandler(req, res);

  assert.equal(res.output.statusCode, 400);
  assert.equal(res.output.body.ok, false);
  assert.equal(res.output.body.error.code, 'BAD_REQUEST');
});

test('search returns normalized results', async () => {
  process.env.MEDIA_PROVIDER_API_KEY = 'test-key';
  global.fetch = async () => ({
    ok: true,
    json: async () => ({
      page: 1,
      total_pages: 1,
      total_results: 1,
      results: [
        {
          id: 123,
          media_type: 'movie',
          title: 'Spirited Away',
          release_date: '2001-07-20',
          poster_path: '/abc.jpg',
          backdrop_path: '/def.jpg',
          overview: 'A classic.',
        },
      ],
    }),
  });

  const req = createMockReq({
    query: { q: 'spirited away', type: 'movie', page: '1' },
  });
  const res = createMockRes();

  await searchHandler(req, res);

  assert.equal(res.output.statusCode, 200);
  assert.equal(res.output.body.ok, true);
  assert.equal(res.output.body.data.results.length, 1);
  assert.equal(res.output.body.data.results[0].providerId, '123');
  assert.equal(res.output.body.data.results[0].type, 'movie');
  assert.equal(res.output.body.data.results[0].year, '2001');
});

test('search maps upstream failure', async () => {
  process.env.MEDIA_PROVIDER_API_KEY = 'test-key';
  global.fetch = async () => ({
    ok: false,
    status: 503,
    json: async () => ({}),
  });

  const req = createMockReq({
    query: { q: 'severance', type: 'show' },
  });
  const res = createMockRes();

  await searchHandler(req, res);

  assert.equal(res.output.statusCode, 503);
  assert.equal(res.output.body.ok, false);
  assert.equal(res.output.body.error.code, 'UPSTREAM_UNAVAILABLE');
});
