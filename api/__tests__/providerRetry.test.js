const test = require('node:test');
const assert = require('node:assert/strict');
const { getMediaDetails } = require('../_lib/providerClient');

test('TMDB detail with appended keywords retries 429 after Retry-After', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  t.mock.method(global, 'fetch', async () => {
    calls++;
    return calls === 1
      ? {
          ok: false,
          status: 429,
          headers: { get: (name) => (name === 'Retry-After' ? '2' : null) },
          json: async () => ({}),
        }
      : {
          ok: true,
          json: async () => ({
            id: 603,
            title: 'Film',
            keywords: { keywords: [{ name: 'heist' }] },
          }),
        };
  });
  const previousEnv = process.env;
  process.env = {
    MEDIA_PROVIDER_API_KEY: 'stub',
    MEDIA_PROVIDER_MAX_RETRIES: '1',
    API_TIMEOUT_MS: '7000',
  };
  let calls = 0;
  try {
    const pending = getMediaDetails({ id: '603', type: 'movie' });
    await new Promise(setImmediate);
    assert.equal(calls, 1);
    t.mock.timers.tick(1999);
    await new Promise(setImmediate);
    assert.equal(calls, 1);
    t.mock.timers.tick(1);
    const result = await pending;
    assert.equal(result.ok, true);
    assert.equal(calls, 2);
    for (const call of global.fetch.mock.calls) {
      const url = new URL(call.arguments[0]);
      assert.equal(url.pathname, '/3/movie/603');
      assert.equal(
        url.searchParams.get('append_to_response'),
        'credits,release_dates,images,keywords',
      );
    }
    assert.deepEqual(result.data.keywords, ['heist']);
  } finally {
    process.env = previousEnv;
    t.mock.timers.reset();
  }
});
