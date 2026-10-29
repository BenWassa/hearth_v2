const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { createHandler } = require('../media/classify');
const {
  createClassificationService,
} = require('../_lib/classificationService');
const gemini = require('../_lib/geminiClassifier');
const {
  mapMovieDetails,
  mapShowDetails,
} = require('../_lib/mappers/mediaMapper');
const { createMockReq, createMockRes } = require('./testUtils');
const uid = 'CdP5YrCYW1d1RjqVQVbnm5QJCLV2';
const movie = {
  provider: 'tmdb',
  providerId: '603',
  type: 'movie',
  title: 'The Matrix',
  year: '1999',
  genres: ['Action', 'Science Fiction'],
  keywords: ['time paradox'],
};
const savedEnv = { ...process.env };
afterEach(() => {
  process.env = { ...savedEnv };
});
const fakeDb = (initial = {}) => {
  const records = new Map(Object.entries(structuredClone(initial)));
  let chain = Promise.resolve();
  const store = {
    records,
    doc: (path) => ({ path }),
    runTransaction: (operation) => {
      const result = chain.then(() =>
        operation({
          get: async (ref) => ({
            data: () => structuredClone(records.get(ref.path)),
          }),
          set: (ref, data, options) =>
            records.set(
              ref.path,
              options?.merge
                ? { ...records.get(ref.path), ...structuredClone(data) }
                : structuredClone(data),
            ),
          update: (ref, fields) => {
            const data = structuredClone(records.get(ref.path));
            for (const [path, value] of Object.entries(fields)) {
              const keys = path.split('.');
              let object = data;
              for (const key of keys.slice(0, -1)) object = object[key] ||= {};
              object[keys.at(-1)] = structuredClone(value);
            }
            records.set(ref.path, data);
          },
        }),
      );
      chain = result.catch(() => {});
      return result;
    },
  };
  return store;
};
const details = async () => ({ ok: true, data: movie });
const disabled = {
  policyKey: () => 'rules',
  infer: async () => ({ status: 'disabled' }),
};

test('movie and TV keyword payloads normalize without extra requests', () => {
  assert.deepEqual(
    mapMovieDetails({ keywords: { keywords: [{ name: 'heist' }] } }).keywords,
    ['heist'],
  );
  assert.deepEqual(
    mapShowDetails({ keywords: { results: [{ name: 'sitcom' }] } }).keywords,
    ['sitcom'],
  );
  assert.deepEqual(mapShowDetails({ keywords: null }).keywords, []);
});
test('classification endpoint requires approved authenticated users and rejects private payload fields', async () => {
  let calls = 0;
  const handler = createHandler({
    verify: async (token) => ({
      uid: token === 'allowed' ? uid : 'other',
      firebase: {
        sign_in_provider: token === 'anonymous' ? 'anonymous' : 'google.com',
      },
    }),
    classify: async () => {
      calls++;
      return {};
    },
  });
  for (const [authorization, body, expected] of [
    ['', { id: '603', type: 'movie' }, 401],
    ['Bearer outsider', { id: '603', type: 'movie' }, 403],
    ['Bearer anonymous', { id: '603', type: 'movie' }, 403],
    ['Bearer allowed', { id: '../private', type: 'movie' }, 400],
    ['Bearer allowed', { id: '603', type: 'movie', note: 'private' }, 400],
    ['Bearer allowed', { id: '603', type: 'movie' }, 200],
  ]) {
    const response = createMockRes();
    await handler(
      createMockReq({ method: 'POST', headers: { authorization }, body }),
      response,
    );
    assert.equal(response.output.statusCode, expected);
    assert.equal(response.output.headers['Cache-Control'], 'no-store');
  }
  assert.equal(calls, 1);
});
test('dedupes concurrent work, caches revisions and preserves user data across shared spaces', async () => {
  const store = fakeDb({
    'artifacts/app/media_catalog/tmdb:603': {
      source: { provider: 'tmdb', providerId: '603' },
      type: 'movie',
      media: {
        type: 'movie',
        classificationOverride: { attributes: { comfort: 'low' } },
      },
      updatedAt: 123,
    },
    'artifacts/app/spaces/a/watchlist_items/tmdb:603': {
      vibe: 'visual',
      note: 'private',
      episodeProgress: { s1e1: true },
    },
    'artifacts/app/spaces/b/watchlist_items/tmdb:603': { vibe: 'gripping' },
  });
  const before = structuredClone([...store.records]);
  let calls = 0;
  let keywords = ['time paradox'];
  const service = createClassificationService({
    db: () => store,
    getDetails: async () => ({ ok: true, data: { ...movie, keywords } }),
    ai: {
      ...disabled,
      infer: async () => {
        calls++;
        return { status: 'disabled' };
      },
    },
  });
  const args = { id: '603', type: 'movie', appId: 'app' };
  const [a, b] = await Promise.all([
    service.classify(args),
    service.classify(args),
  ]);
  assert.deepEqual(a, b);
  await service.classify(args);
  assert.equal(calls, 1);
  keywords = ['heist'];
  await service.classify(args);
  assert.equal(calls, 2, 'source changes invalidate cache');
  const catalog = store.records.get('artifacts/app/media_catalog/tmdb:603');
  assert.equal(catalog.updatedAt, 123);
  assert.equal(catalog.media.classificationOverride.attributes.comfort, 'low');
  for (const [path, value] of before.filter(([path]) =>
    path.includes('/spaces/'),
  ))
    assert.deepEqual(store.records.get(path), value);
});
test('leases recover after process exit and partial metadata failures do not poison cache', async () => {
  let time = 1000;
  const store = fakeDb({
    'classification_cache/tmdb:movie:603': { owner: 'dead', leaseUntil: 2000 },
  });
  const service = createClassificationService({
    db: () => store,
    getDetails: details,
    ai: disabled,
    now: () => time,
  });
  await assert.rejects(
    service.classify({ id: '603', type: 'movie', appId: 'app' }),
    { code: 'CLASSIFICATION_PENDING' },
  );
  time = 3000;
  assert.equal(
    (await service.classify({ id: '603', type: 'movie', appId: 'app' }))
      .version,
    'viewing-2',
  );
  const broken = createClassificationService({
    db: () => fakeDb(),
    getDetails: async () => ({ ok: false, status: 429 }),
    ai: disabled,
  });
  await assert.rejects(
    broken.classify({ id: '603', type: 'movie', appId: 'app' }),
    { status: 429 },
  );
});
test('daily Gemini budget counts concurrent requests atomically, including retries', async () => {
  process.env.GEMINI_DAILY_REQUEST_LIMIT = '2';
  const store = fakeDb();
  const service = createClassificationService({ db: () => store });
  assert.deepEqual(
    await Promise.all(
      Array.from({ length: 5 }, () => service.reserveAttempt()),
    ),
    [true, true, false, false, false],
  );
  process.env.GEMINI_DAILY_REQUEST_LIMIT = '0';
  assert.equal(await service.reserveAttempt(), false);
});
const enable = () =>
  Object.assign(process.env, {
    GEMINI_CLASSIFICATION_ENABLED: 'true',
    GEMINI_METADATA_SHARING_APPROVED: 'true',
    GEMINI_API_KEY: 'fake-key',
    GEMINI_MODEL: 'test-model',
  });
const attributes = async () => {
  const { FACETS } = await import('../../src/domain/media/classification.mjs');
  return Object.fromEntries(
    FACETS.map((name) => [name, { value: 'unknown', confidence: 'unknown' }]),
  );
};
test('Gemini is opt-in and projects only public fields, never credentials in URL or private fields in body', async () => {
  delete process.env.GEMINI_CLASSIFICATION_ENABLED;
  let count = 0;
  assert.equal(
    (
      await gemini.infer({
        input: movie,
        reserveAttempt: async () => true,
        fetchImpl: async () => {
          count++;
        },
      })
    ).status,
    'disabled',
  );
  enable();
  const expected = await attributes();
  const result = await gemini.infer({
    input: {
      ...movie,
      note: 'secret',
      userState: { uid },
      overview: 'licensed synopsis',
      watchlist: ['private'],
    },
    reserveAttempt: async () => true,
    fetchImpl: async (url, options) => {
      count++;
      assert.equal(url.includes('fake-key'), false);
      assert.equal(options.headers['x-goog-api-key'], 'fake-key');
      for (const value of ['secret', uid, 'licensed synopsis', 'private'])
        assert.equal(options.body.includes(value), false);
      const generationConfig = JSON.parse(options.body).generationConfig;
      assert.equal(
        generationConfig.responseJsonSchema.additionalProperties,
        false,
      );
      assert.equal('temperature' in generationConfig, false);
      assert.equal('topP' in generationConfig, false);
      assert.equal('topK' in generationConfig, false);
      assert.deepEqual(generationConfig.thinkingConfig, {
        thinkingLevel: 'minimal',
      });
      assert.match(
        generationConfig.responseJsonSchema.properties.visualDistinctiveness
          .description,
        /visual craft/i,
      );
      return {
        ok: true,
        json: async () => ({
          candidates: [
            {
              finishReason: 'STOP',
              content: { parts: [{ text: JSON.stringify(expected) }] },
            },
          ],
        }),
      };
    },
  });
  assert.equal(result.status, 'complete');
  assert.equal(result.providerAttempts, 1);
  assert.equal(result.promptVersion, 'viewing-prompt-2');
  assert.equal(result.inferencePolicyVersion, 'gemini-policy-2');
  assert.match(gemini.policyKey(), /viewing-prompt-2:gemini-policy-2$/);
  assert.equal(count, 1);
});
test('Gemini quota, budget, invalid JSON, semantic errors, timeout and retry exhaustion fall back', async () => {
  enable();
  const valid = await attributes();
  for (const [payload, expected] of [
    [{ ok: false, status: 429 }, 'quota'],
    [{ ok: false, status: 500 }, 'upstream'],
    [
      {
        ok: true,
        json: async () => ({ candidates: [{ finishReason: 'MAX_TOKENS' }] }),
      },
      'invalid',
    ],
    [
      {
        ok: true,
        json: async () => ({
          candidates: [
            {
              finishReason: 'STOP',
              content: {
                parts: [{ text: JSON.stringify({ ...valid, invented: true }) }],
              },
            },
          ],
        }),
      },
      'invalid',
    ],
  ]) {
    let attempts = 0;
    const result = await gemini.infer({
      input: movie,
      reserveAttempt: async () => {
        attempts++;
        return true;
      },
      fetchImpl: async () => payload,
    });
    assert.equal(result.status, expected);
    assert.ok(attempts <= 2);
    assert.equal(result.providerAttempts, attempts);
    if (expected === 'invalid') assert.ok(result.reason);
  }
  assert.equal(
    (await gemini.infer({ input: movie, reserveAttempt: async () => false }))
      .status,
    'budget',
  );
  process.env.GEMINI_TIMEOUT_MS = '100';
  const result = await gemini.infer({
    input: movie,
    reserveAttempt: async () => true,
    fetchImpl: async (_, { signal }) =>
      new Promise((_, reject) =>
        signal.addEventListener('abort', () =>
          reject(Object.assign(new Error('timeout'), { name: 'AbortError' })),
        ),
      ),
  });
  assert.equal(result.status, 'timeout');
});

test('demo classification reuses public cache and budget without reading or writing catalogs', async () => {
  const catalogPath = 'artifacts/app/media_catalog/tmdb:603';
  const original = {
    source: { provider: 'tmdb', providerId: '603' },
    media: { type: 'movie' },
    note: 'private',
  };
  const store = fakeDb({ [catalogPath]: original });
  const doc = store.doc;
  store.doc = (path) => {
    assert.ok(
      !path.startsWith('artifacts/'),
      'demo must never access household or catalog records',
    );
    return doc(path);
  };
  let calls = 0;
  const service = createClassificationService({
    db: () => store,
    getDetails: details,
    persistCatalog: false,
    ai: {
      ...disabled,
      infer: async ({ reserveAttempt }) => {
        calls++;
        assert.equal(await reserveAttempt(), true);
        return { status: 'disabled' };
      },
    },
  });
  const args = { id: '603', type: 'movie', appId: 'app' };
  const first = await service.classify(args);
  assert.deepEqual(await service.classify(args), first);
  assert.equal(calls, 1);
  assert.deepEqual(store.records.get(catalogPath), original);
  assert.ok(store.records.has('classification_cache/tmdb:movie:603'));
  assert.ok(
    [...store.records.keys()].some((key) =>
      key.startsWith('classification_budgets/'),
    ),
  );
});
