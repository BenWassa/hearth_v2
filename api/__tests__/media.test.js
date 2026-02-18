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
  let requestedUrl = '';
  global.fetch = async (url) => {
    requestedUrl = String(url);
    return {
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
        images: {
          logos: [
            { iso_639_1: 'fr', file_path: '/fr-logo.png' },
            { iso_639_1: 'en', file_path: '/en-logo.png' },
          ],
        },
        original_language: 'en',
        origin_country: ['US'],
        vote_average: 8.4,
        number_of_seasons: 8,
        seasons: [
          {
            season_number: 1,
            name: 'Season 1',
            episode_count: 10,
            air_date: '2011-04-17',
            poster_path: '/season1.jpg',
          },
        ],
      }),
    };
  };

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
  assert.equal(res.output.body.data.seasonSummaries.length, 1);
  assert.equal(res.output.body.data.seasonSummaries[0].seasonNumber, 1);
  assert.equal(
    res.output.body.data.logoUrl,
    'https://image.tmdb.org/t/p/w500/en-logo.png',
  );
  assert.match(
    requestedUrl,
    /append_to_response=credits%2Ccontent_ratings%2Cimages/,
  );
  assert.match(
    requestedUrl,
    /include_image_language=en-US%2Cen%2Cnull/,
  );
});

test('media details logoUrl falls back to first logo when english is unavailable', async () => {
  process.env.MEDIA_PROVIDER_API_KEY = 'test-key';
  global.fetch = async () => ({
    ok: true,
    json: async () => ({
      id: 550,
      title: 'Fight Club',
      original_title: 'Fight Club',
      release_date: '1999-10-15',
      runtime: 139,
      overview: 'Rule one.',
      poster_path: '/poster.jpg',
      backdrop_path: '/backdrop.jpg',
      images: {
        logos: [{ iso_639_1: 'de', file_path: '/de-logo.png' }],
      },
    }),
  });

  const req = createMockReq({
    query: { provider: 'tmdb', id: '550', type: 'movie' },
  });
  const res = createMockRes();

  await mediaHandler(req, res);

  assert.equal(res.output.statusCode, 200);
  assert.equal(
    res.output.body.data.logoUrl,
    'https://image.tmdb.org/t/p/w500/de-logo.png',
  );
});

test('media details returns null logoUrl when logos are unavailable', async () => {
  process.env.MEDIA_PROVIDER_API_KEY = 'test-key';
  global.fetch = async () => ({
    ok: true,
    json: async () => ({
      id: 13,
      title: 'Forrest Gump',
      original_title: 'Forrest Gump',
      release_date: '1994-06-23',
      runtime: 142,
      overview: 'Life is like a box of chocolates.',
      poster_path: '/poster.jpg',
      backdrop_path: '/backdrop.jpg',
      images: { logos: [] },
    }),
  });

  const req = createMockReq({
    query: { provider: 'tmdb', id: '13', type: 'movie' },
  });
  const res = createMockRes();

  await mediaHandler(req, res);

  assert.equal(res.output.statusCode, 200);
  assert.equal(res.output.body.data.logoUrl, null);
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
