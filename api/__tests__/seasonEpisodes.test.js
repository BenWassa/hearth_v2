const test = require('node:test');
const assert = require('node:assert/strict');

const seasonEpisodesHandler = require('../media/[provider]/[id]/season/[seasonNumber]');
const { createMockReq, createMockRes } = require('./testUtils');

const originalEnv = { ...process.env };
const originalFetch = global.fetch;

test.afterEach(() => {
  process.env = { ...originalEnv };
  global.fetch = originalFetch;
});

test('season episodes returns normalized episodes', async () => {
  process.env.MEDIA_PROVIDER_API_KEY = 'test-key';
  global.fetch = async () => ({
    ok: true,
    json: async () => ({
      episodes: [
        {
          id: 101,
          episode_number: 1,
          name: 'Pilot',
          overview: 'Start',
          air_date: '2011-04-17',
          runtime: 62,
          still_path: '/still.jpg',
        },
      ],
    }),
  });

  const req = createMockReq({
    query: { provider: 'tmdb', id: '1399', seasonNumber: '1' },
  });
  const res = createMockRes();

  await seasonEpisodesHandler(req, res);

  assert.equal(res.output.statusCode, 200);
  assert.equal(res.output.body.ok, true);
  assert.equal(res.output.body.data.seasonNumber, 1);
  assert.equal(res.output.body.data.episodes[0].episodeId, 's1e1');
});

test('season episodes validates season number', async () => {
  const req = createMockReq({
    query: { provider: 'tmdb', id: '1399', seasonNumber: '0' },
  });
  const res = createMockRes();

  await seasonEpisodesHandler(req, res);

  assert.equal(res.output.statusCode, 400);
  assert.equal(res.output.body.error.code, 'BAD_REQUEST');
});
