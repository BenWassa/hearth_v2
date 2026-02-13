const test = require('node:test');
const assert = require('node:assert/strict');

const seasonsHandler = require('../media/[provider]/[id]/seasons');
const { createMockReq, createMockRes } = require('./testUtils');

const originalEnv = { ...process.env };
const originalFetch = global.fetch;

test.afterEach(() => {
  process.env = { ...originalEnv };
  global.fetch = originalFetch;
});

test('seasons endpoint returns normalized seasons list', async () => {
  process.env.MEDIA_PROVIDER_API_KEY = 'test-key';
  global.fetch = async () => ({
    ok: true,
    json: async () => ({
      number_of_seasons: 2,
      seasons: [
        {
          season_number: 1,
          name: 'Season 1',
          episode_count: 10,
          air_date: '2011-04-17',
          poster_path: '/s1.jpg',
        },
      ],
    }),
  });

  const req = createMockReq({
    query: { provider: 'tmdb', id: '1399' },
  });
  const res = createMockRes();

  await seasonsHandler(req, res);

  assert.equal(res.output.statusCode, 200);
  assert.equal(res.output.body.ok, true);
  assert.equal(res.output.body.data.seasonCount, 2);
  assert.equal(res.output.body.data.seasons[0].seasonNumber, 1);
});
