const test = require('node:test');
const assert = require('node:assert/strict');

const collectionHandler = require('../media/[provider]/collection/[id]');
const { createMockReq, createMockRes } = require('./testUtils');

const originalEnv = { ...process.env };
const originalFetch = global.fetch;

test.afterEach(() => {
  process.env = { ...originalEnv };
  global.fetch = originalFetch;
});

test('collection endpoint returns full collection parts', async () => {
  process.env.MEDIA_PROVIDER_API_KEY = 'test-key';
  const requestedUrls = [];
  global.fetch = async (url) => {
    requestedUrls.push(String(url));
    return {
      ok: true,
      json: async () => ({
        id: 9485,
        name: 'The Fast and the Furious Collection',
        overview: 'Street racing saga.',
        poster_path: '/collection.jpg',
        backdrop_path: '/collection-backdrop.jpg',
        parts: [
          {
            id: 9799,
            title: 'The Fast and the Furious',
            original_title: 'The Fast and the Furious',
            release_date: '2001-06-22',
            poster_path: '/poster.jpg',
            backdrop_path: '/backdrop.jpg',
          },
        ],
      }),
    };
  };

  const req = createMockReq({
    query: { provider: 'tmdb', id: '9485' },
  });
  const res = createMockRes();

  await collectionHandler(req, res);

  assert.equal(res.output.statusCode, 200);
  assert.equal(res.output.body.ok, true);
  assert.equal(res.output.body.data.providerId, '9485');
  assert.equal(res.output.body.data.parts.length, 1);
  assert.equal(res.output.body.data.parts[0].providerId, '9799');
  assert.deepEqual(res.output.body.data.subCollections, []);
  assert.match(requestedUrls[0], /\/collection\/9485\?/);
});
