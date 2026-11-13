const test = require('node:test');
const assert = require('node:assert/strict');
const { mapDirector } = require('../_lib/directorMapper');
const directorHandler = require('../directors/[id]');
const { createMockReq, createMockRes } = require('./testUtils');

const director = {
  id: 'director-example',
  personId: 525,
  name: 'Christopher Nolan',
  description: 'Director',
  entryFilmIds: [77, 999],
};
const release = (id, extras = {}) => ({
  id,
  title: `Film ${id}`,
  release_date: '2001-03-18',
  job: 'Director',
  department: 'Directing',
  poster_path: '/poster.jpg',
  ...extras,
});

test('director mapper includes only credited released directed titles', () => {
  const raw = {
    id: 525,
    movie_credits: {
      crew: [
        release(77),
        release(77, { title: 'Duplicate credit' }),
        release(88, { job: 'Producer', department: 'Production' }),
        release(89, { job: 'Writer', department: 'Writing' }),
        release(90, { release_date: '2027-05-05' }),
        release(91, { release_date: '' }),
        release(92, { adult: true }),
        release(93, { video: true }),
        release(94, { department: 'Production' }),
        release(96, { release_date: '2000-01-01', poster_path: null }),
      ],
    },
  };
  const output = mapDirector(raw, director, new Date('2026-11-12T00:00:00Z'));
  assert.deepEqual(
    output.films.map((film) => film.providerId),
    ['96', '77'],
  );
  assert.deepEqual(
    output.startHere.map((film) => film.providerId),
    ['77'],
  );
  assert.deepEqual(output.missingStarterIds, ['999']);
  assert.equal(
    output.films[1].poster,
    'https://image.tmdb.org/t/p/w342/poster.jpg',
  );
  assert.equal(output.films[0].poster, '');
  assert.equal(output.filmographyLabel, 'Directed film credits');
});

test('director mapper rejects mismatched person identity', () => {
  assert.throws(
    () => mapDirector({ id: 488 }, director),
    /identity does not match/,
  );
});

const originalFetch = global.fetch;
const originalEnv = { ...process.env };
test.afterEach(() => {
  global.fetch = originalFetch;
  process.env = { ...originalEnv };
});

test('director endpoint rejects catalog-unknown IDs without provider call', async () => {
  global.fetch = () => {
    throw new Error('Provider should not be reached');
  };
  const req = createMockReq({ query: { id: '123456789' } });
  const res = createMockRes();
  await directorHandler(req, res);
  assert.equal(res.output.statusCode, 404);
});

test('director endpoint returns only verified directorial credits', async () => {
  process.env.MEDIA_PROVIDER_API_KEY = 'test-key';
  let requested = '';
  global.fetch = async (url) => {
    requested = String(url);
    return {
      ok: true,
      json: async () => ({
        id: 5026,
        name: 'Akira Kurosawa',
        movie_credits: {
          crew: [
            release(77),
            release(101, { job: 'Producer', department: 'Production' }),
          ],
        },
      }),
    };
  };
  const req = createMockReq({ query: { id: '5026' } });
  const res = createMockRes();
  await directorHandler(req, res);
  assert.equal(res.output.statusCode, 200);
  assert.equal(res.output.body.ok, true);
  assert.deepEqual(
    res.output.body.data.films.map((film) => film.providerId),
    ['77'],
  );
  assert.match(requested, /\/person\/5026\?/);
  assert.match(requested, /append_to_response=movie_credits/);
});
