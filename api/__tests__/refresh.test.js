const test = require('node:test');
const assert = require('node:assert/strict');

const refreshHandler = require('../media/refresh');
const { createMockReq, createMockRes } = require('./testUtils');

const originalEnv = { ...process.env };
const originalFetch = global.fetch;

const okResponse = (data) => ({
  ok: true,
  status: 200,
  json: async () => data,
});

const rateLimitedResponse = (retryAfter = '0') => ({
  ok: false,
  status: 429,
  headers: { get: () => retryAfter },
  json: async () => ({ status_message: 'Rate limited' }),
});

test.afterEach(() => {
  process.env = { ...originalEnv };
  global.fetch = originalFetch;
});

test('refresh retries an upstream 429 before returning metadata', async () => {
  process.env.MEDIA_PROVIDER_API_KEY = 'test-key';
  let calls = 0;
  global.fetch = async () => {
    calls += 1;
    if (calls === 1) return rateLimitedResponse();
    return okResponse({
      id: 329865,
      title: 'Arrival',
      release_date: '2016-11-11',
      runtime: 116,
      overview: 'A linguist meets visitors.',
    });
  };

  const req = createMockReq({
    method: 'POST',
    body: { provider: 'tmdb', providerId: '329865', type: 'movie' },
  });
  const res = createMockRes();

  await refreshHandler(req, res);

  assert.equal(res.output.statusCode, 200);
  assert.equal(res.output.body.data.media.title, 'Arrival');
  assert.equal(calls, 2);
});

test('refresh limits concurrent TV season requests', async () => {
  process.env.MEDIA_PROVIDER_API_KEY = 'test-key';
  let activeSeasonRequests = 0;
  let maxActiveSeasonRequests = 0;

  global.fetch = async (url) => {
    const parsed = new URL(String(url));
    if (
      parsed.pathname === '/3/tv/456' &&
      parsed.searchParams.has('append_to_response')
    ) {
      return okResponse({
        id: 456,
        name: 'Show',
        first_air_date: '2020-01-01',
        number_of_seasons: 5,
      });
    }
    if (parsed.pathname === '/3/tv/456') {
      return okResponse({
        number_of_seasons: 5,
        seasons: Array.from({ length: 5 }, (_, index) => ({
          season_number: index + 1,
          name: `Season ${index + 1}`,
          episode_count: 1,
        })),
      });
    }
    if (parsed.pathname.includes('/season/')) {
      activeSeasonRequests += 1;
      maxActiveSeasonRequests = Math.max(
        maxActiveSeasonRequests,
        activeSeasonRequests,
      );
      await new Promise((resolve) => setTimeout(resolve, 5));
      activeSeasonRequests -= 1;
      return okResponse({ episodes: [] });
    }
    throw new Error(`Unexpected URL: ${url}`);
  };

  const req = createMockReq({
    method: 'POST',
    body: { provider: 'tmdb', providerId: '456', type: 'show' },
  });
  const res = createMockRes();

  await refreshHandler(req, res);

  assert.equal(res.output.statusCode, 200);
  assert.equal(res.output.body.data.showData.seasons.length, 5);
  assert.equal(maxActiveSeasonRequests, 2);
});

test('refresh returns Retry-After instead of writing partial season data', async () => {
  process.env.MEDIA_PROVIDER_API_KEY = 'test-key';
  process.env.MEDIA_PROVIDER_MAX_RETRIES = '0';

  global.fetch = async (url) => {
    const parsed = new URL(String(url));
    if (
      parsed.pathname === '/3/tv/789' &&
      parsed.searchParams.has('append_to_response')
    ) {
      return okResponse({
        id: 789,
        name: 'Limited Show',
        first_air_date: '2020-01-01',
        number_of_seasons: 1,
      });
    }
    if (parsed.pathname === '/3/tv/789') {
      return okResponse({
        number_of_seasons: 1,
        seasons: [{ season_number: 1, name: 'Season 1', episode_count: 8 }],
      });
    }
    return rateLimitedResponse('2');
  };

  const req = createMockReq({
    method: 'POST',
    body: { provider: 'tmdb', providerId: '789', type: 'show' },
  });
  const res = createMockRes();

  await refreshHandler(req, res);

  assert.equal(res.output.statusCode, 429);
  assert.equal(res.output.headers['Retry-After'], '2');
  assert.equal(res.output.body.data, null);
});
