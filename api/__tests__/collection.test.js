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

test('collection endpoint hydrates part details when requested', async () => {
  process.env.MEDIA_PROVIDER_API_KEY = 'test-key';
  const requestedUrls = [];
  global.fetch = async (url) => {
    requestedUrls.push(String(url));
    if (String(url).includes('/movie/9799')) {
      return {
        ok: true,
        json: async () => ({
          id: 9799,
          title: 'The Fast and the Furious',
          original_title: 'The Fast and the Furious',
          release_date: '2001-06-22',
          runtime: 106,
          overview: 'Undercover street racing.',
          poster_path: '/poster-detail.jpg',
          backdrop_path: '/backdrop-detail.jpg',
          genres: [{ name: 'Action' }],
          credits: {
            cast: [{ name: 'Vin Diesel' }],
            crew: [{ job: 'Director', name: 'Rob Cohen' }],
          },
          images: { logos: [{ iso_639_1: 'en', file_path: '/logo.png' }] },
          production_countries: [{ name: 'United States of America' }],
          vote_average: 6.9,
        }),
      };
    }

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
    query: { provider: 'tmdb', id: '9485', details: 'true' },
  });
  const res = createMockRes();

  await collectionHandler(req, res);

  assert.equal(res.output.statusCode, 200);
  assert.equal(res.output.body.ok, true);
  assert.equal(res.output.body.data.parts[0].runtimeMinutes, 106);
  assert.equal(
    res.output.body.data.parts[0].overview,
    'Undercover street racing.',
  );
  assert.deepEqual(res.output.body.data.parts[0].genres, ['Action']);
  assert.deepEqual(res.output.body.data.parts[0].directors, ['Rob Cohen']);
  assert.match(requestedUrls[0], /\/collection\/9485\?/);
  assert.match(requestedUrls[1], /\/movie\/9799\?/);
});

test('optional collection endpoint returns empty details for missing collection', async () => {
  process.env.MEDIA_PROVIDER_API_KEY = 'test-key';
  global.fetch = async () => ({
    ok: false,
    status: 404,
    json: async () => ({ status_message: 'Not found' }),
  });

  const req = createMockReq({
    query: { provider: 'tmdb', id: '1680034', optional: 'true' },
  });
  const res = createMockRes();

  await collectionHandler(req, res);

  assert.equal(res.output.statusCode, 200);
  assert.equal(res.output.body.ok, true);
  assert.equal(res.output.body.data.providerId, '1680034');
  assert.deepEqual(res.output.body.data.parts, []);
  assert.equal(res.output.body.meta.found, false);
});
