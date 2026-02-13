const test = require('node:test');
const assert = require('node:assert/strict');

const mediaHandler = require('../media/[provider]/[id]');
const { createMockReq, createMockRes } = require('./testUtils');

const originalEnv = { ...process.env };
const originalFetch = global.fetch;

test.afterEach(() => {
  process.env = { ...originalEnv };
  global.fetch = originalFetch;
});

test('media details returns canonical show payload', async () => {
  process.env.MEDIA_PROVIDER_API_KEY = 'test-key';
  global.fetch = async () => ({
    ok: true,
    json: async () => ({
      id: 1399,
      name: 'Game of Thrones',
      original_name: 'Game of Thrones',
      first_air_date: '2011-04-17',
      episode_run_time: [57],
      overview: 'Winter is coming.',
      poster_path: '/poster.jpg',
      backdrop_path: '/backdrop.jpg',
      genres: [{ name: 'Drama' }],
      created_by: [{ name: 'David Benioff' }],
      credits: {
        cast: [{ name: 'Emilia Clarke' }],
      },
      original_language: 'en',
      origin_country: ['US'],
      vote_average: 8.4,
      number_of_seasons: 8,
    }),
  });

  const req = createMockReq({
    query: { provider: 'tmdb', id: '1399', type: 'show' },
  });
  const res = createMockRes();

  await mediaHandler(req, res);

  assert.equal(res.output.statusCode, 200);
  assert.equal(res.output.body.ok, true);
  assert.equal(res.output.body.data.type, 'show');
  assert.equal(res.output.body.data.providerId, '1399');
  assert.equal(res.output.body.data.seasonCount, 8);
});

test('media details rejects invalid provider', async () => {
  const req = createMockReq({
    query: { provider: 'other', id: '1399' },
  });
  const res = createMockRes();

  await mediaHandler(req, res);

  assert.equal(res.output.statusCode, 400);
  assert.equal(res.output.body.ok, false);
  assert.equal(res.output.body.error.code, 'BAD_REQUEST');
});
