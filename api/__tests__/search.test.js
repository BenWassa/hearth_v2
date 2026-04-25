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
          popularity: 42.5,
          vote_count: 900,
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
  assert.equal(res.output.body.data.results[0].releaseDate, '2001-07-20');
  assert.equal(res.output.body.data.results[0].popularity, 42.5);
  assert.equal(res.output.body.data.results[0].voteCount, 900);
});

test('search ranks exact title match above more popular partial match', async () => {
  process.env.MEDIA_PROVIDER_API_KEY = 'test-key';
  global.fetch = async () => ({
    ok: true,
    json: async () => ({
      page: 1,
      total_pages: 1,
      total_results: 2,
      results: [
        {
          id: 1,
          media_type: 'movie',
          title: 'Alien Resurrection',
          release_date: '1997-11-12',
          popularity: 500,
          vote_count: 5000,
        },
        {
          id: 2,
          media_type: 'movie',
          title: 'Alien',
          release_date: '1979-05-25',
          popularity: 10,
          vote_count: 100,
        },
      ],
    }),
  });

  const req = createMockReq({
    query: { q: 'Alien', type: 'movie' },
  });
  const res = createMockRes();

  await searchHandler(req, res);

  assert.equal(res.output.statusCode, 200);
  assert.deepEqual(
    res.output.body.data.results.map((result) => result.providerId),
    ['2', '1'],
  );
});

test('search ranks exact original title match above display-title partial match', async () => {
  process.env.MEDIA_PROVIDER_API_KEY = 'test-key';
  global.fetch = async () => ({
    ok: true,
    json: async () => ({
      page: 1,
      total_pages: 1,
      total_results: 2,
      results: [
        {
          id: 10,
          media_type: 'movie',
          title: 'Castle in the Sky',
          original_title: '天空の城ラピュタ',
          release_date: '1986-08-02',
          popularity: 20,
          vote_count: 100,
        },
        {
          id: 11,
          media_type: 'movie',
          title: 'Sky Castle',
          original_title: 'Sky Castle',
          release_date: '2024-01-01',
          popularity: 200,
          vote_count: 1000,
        },
      ],
    }),
  });

  const req = createMockReq({
    query: { q: '天空の城ラピュタ', type: 'movie' },
  });
  const res = createMockRes();

  await searchHandler(req, res);

  assert.equal(res.output.statusCode, 200);
  assert.equal(res.output.body.data.results[0].providerId, '10');
});

test('search uses popularity and vote count to break similar title matches', async () => {
  process.env.MEDIA_PROVIDER_API_KEY = 'test-key';
  global.fetch = async () => ({
    ok: true,
    json: async () => ({
      page: 1,
      total_pages: 1,
      total_results: 2,
      results: [
        {
          id: 20,
          media_type: 'movie',
          title: 'Matrix Reloaded',
          release_date: '2003-05-15',
          popularity: 5,
          vote_count: 20,
        },
        {
          id: 21,
          media_type: 'movie',
          title: 'Matrix Reloaded',
          release_date: '2003-05-15',
          popularity: 100,
          vote_count: 3000,
        },
      ],
    }),
  });

  const req = createMockReq({
    query: { q: 'Matrix Reloaded', type: 'movie' },
  });
  const res = createMockRes();

  await searchHandler(req, res);

  assert.equal(res.output.statusCode, 200);
  assert.deepEqual(
    res.output.body.data.results.map((result) => result.providerId),
    ['21', '20'],
  );
});

test('search applies modest recency boost without beating exact title match', async () => {
  process.env.MEDIA_PROVIDER_API_KEY = 'test-key';
  global.fetch = async () => ({
    ok: true,
    json: async () => ({
      page: 1,
      total_pages: 1,
      total_results: 3,
      results: [
        {
          id: 30,
          media_type: 'movie',
          title: 'Arrival Story',
          release_date: '1980-01-01',
          popularity: 10,
          vote_count: 100,
        },
        {
          id: 31,
          media_type: 'movie',
          title: 'Arrival Story',
          release_date: '2024-01-01',
          popularity: 10,
          vote_count: 100,
        },
        {
          id: 32,
          media_type: 'movie',
          title: 'Arrival',
          release_date: '2016-11-11',
          popularity: 1,
          vote_count: 1,
        },
      ],
    }),
  });

  const req = createMockReq({
    query: { q: 'Arrival', type: 'movie' },
  });
  const res = createMockRes();

  await searchHandler(req, res);

  assert.equal(res.output.statusCode, 200);
  assert.deepEqual(
    res.output.body.data.results.map((result) => result.providerId),
    ['32', '31', '30'],
  );
});

test('multi search drops non-movie and non-tv results', async () => {
  process.env.MEDIA_PROVIDER_API_KEY = 'test-key';
  global.fetch = async () => ({
    ok: true,
    json: async () => ({
      page: 1,
      total_pages: 1,
      total_results: 3,
      results: [
        {
          id: 40,
          media_type: 'person',
          name: 'Alien Actor',
          popularity: 1000,
        },
        {
          id: 41,
          media_type: 'tv',
          name: 'Alien',
          first_air_date: '2023-01-01',
          popularity: 20,
          vote_count: 200,
        },
        {
          id: 42,
          media_type: 'movie',
          title: 'Alien',
          release_date: '1979-05-25',
          popularity: 30,
          vote_count: 300,
        },
      ],
    }),
  });

  const req = createMockReq({
    query: { q: 'Alien', type: 'all' },
  });
  const res = createMockRes();

  await searchHandler(req, res);

  assert.equal(res.output.statusCode, 200);
  assert.deepEqual(
    res.output.body.data.results.map((result) => result.type),
    ['movie', 'show'],
  );
  assert.deepEqual(
    res.output.body.data.results.map((result) => result.providerId),
    ['42', '41'],
  );
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
