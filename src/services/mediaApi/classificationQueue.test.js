import {
  startClassificationBackfill,
  requestClassification,
} from './classificationQueue.js';
import {
  CLASSIFIER_VERSION,
  classifyMedia,
} from '../../domain/media/classification.mjs';
const item = {
  id: 'tmdb:603',
  source: { provider: 'tmdb', providerId: '603' },
  type: 'movie',
  title: 'Film',
  note: 'private',
  userState: { vibe: 'visual' },
};
const result = {
  ...classifyMedia(item),
  pipelineVersion: 'viewing-2',
  classifiedAt: 1000,
};
const storage = () => {
  const map = new Map();
  return {
    getItem: (key) => map.get(key),
    setItem: (key, value) => map.set(key, value),
  };
};

describe('classification pending queue', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });
  it('processes canonical titles once, preserves personal data and skips cached work across sessions', async () => {
    const request = vi
      .fn()
      .mockResolvedValue([
        { id: '603', type: 'movie', ok: true, data: result },
      ]);
    const onResult = vi.fn();
    const store = storage();
    const args = {
      getItems: () => [item, { ...item, id: 'duplicate' }],
      getToken: async () => 'token',
      onResult,
      request,
      storage: store,
    };
    let stop = startClassificationBackfill(args);
    await vi.advanceTimersByTimeAsync(5000);
    stop();
    expect(request).toHaveBeenCalledOnce();
    expect(request.mock.calls[0][0]).toMatchObject({
      items: [{ id: '603', type: 'movie' }],
      token: 'token',
    });
    expect(request.mock.calls[0][0]).not.toHaveProperty('note');
    expect(onResult).toHaveBeenCalledWith(item, result);
    stop = startClassificationBackfill(args);
    await vi.advanceTimersByTimeAsync(5000);
    stop();
    expect(request).toHaveBeenCalledOnce();
  });
  it('retries after offline failure, caps attempts at three per session, and survives restarting', async () => {
    const request = vi.fn().mockRejectedValue(new Error('offline'));
    const store = storage();
    const args = {
      getItems: () => [item],
      getToken: async () => 'token',
      onResult: vi.fn(),
      request,
      storage: store,
    };
    let stop = startClassificationBackfill(args);
    await vi.advanceTimersByTimeAsync(60 * 60000);
    expect(request).toHaveBeenCalledTimes(3);
    stop();
    request.mockResolvedValue([
      { id: '603', type: 'movie', ok: true, data: result },
    ]);
    stop = startClassificationBackfill(args);
    await vi.advanceTimersByTimeAsync(1001);
    stop();
    expect(request).toHaveBeenCalledTimes(4);
    expect(args.onResult).toHaveBeenCalledOnce();
  });
  it('cancels pending results on space changes or exit', async () => {
    let finish;
    const onResult = vi.fn();
    const request = vi.fn(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const stop = startClassificationBackfill({
      getItems: () => [item],
      getToken: async () => 'token',
      onResult,
      request,
      storage: storage(),
    });
    await vi.advanceTimersByTimeAsync(1000);
    stop();
    finish([{ id: '603', type: 'movie', ok: true, data: result }]);
    await Promise.resolve();
    expect(onResult).not.toHaveBeenCalled();
    expect(request.mock.calls[0][0].signal.aborted).toBe(true);
  });
  it('sends only canonical public identity and bearer auth to the backend', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, data: result }),
    });
    vi.stubGlobal('fetch', fetchMock);
    await requestClassification({ id: '603', type: 'movie', token: 'token' });
    expect(fetchMock.mock.calls[0][0]).toBe('/api/media/classify');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      id: '603',
      type: 'movie',
    });
  });
});

it('reclassifies when public source evidence changes, without waiting for cache age', async () => {
  vi.useFakeTimers();
  let items = [item];
  const request = vi
    .fn()
    .mockResolvedValue([{ id: '603', type: 'movie', ok: true, data: result }]);
  const stop = startClassificationBackfill({
    getItems: () => items,
    getToken: async () => 'token',
    onResult: vi.fn(),
    request,
    storage: storage(),
  });
  try {
    await vi.advanceTimersByTimeAsync(2000);
    expect(request).toHaveBeenCalledOnce();
    items = [{ ...item, keywords: ['heist'] }];
    await vi.advanceTimersByTimeAsync(35000);
    expect(request).toHaveBeenCalledTimes(2);
  } finally {
    stop();
    vi.useRealTimers();
  }
});

it('batches ten, isolates failures, coalesces results and counts only unfinished titles', async () => {
  vi.useFakeTimers();
  const titles = Array.from({ length: 12 }, (_, i) => ({
    ...item,
    id: `tmdb:${i + 1}`,
    source: { provider: 'tmdb', providerId: String(i + 1) },
  }));
  titles.push({
    ...item,
    source: { provider: 'tmdb', providerId: '99' },
    media: { classification: result },
  });
  const request = vi.fn(async ({ items }) =>
    items.map(({ id, type }) =>
      id === '2'
        ? { id, type, ok: false, code: 'UNAVAILABLE' }
        : { id, type, ok: true, data: { ...result, key: `tmdb:movie:${id}` } },
    ),
  );
  const onBatchResult = vi.fn();
  const onProgress = vi.fn();
  const onResult = vi.fn();
  const stop = startClassificationBackfill({
    getItems: () => titles,
    getToken: async () => 'token',
    request,
    onResult,
    onBatchResult,
    onProgress,
    storage: storage(),
  });
  try {
    await vi.advanceTimersByTimeAsync(1000);
    expect(request.mock.calls[0][0].items).toHaveLength(10);
    expect(onResult).toHaveBeenCalledTimes(9);
    expect(onBatchResult).toHaveBeenCalledOnce();
    expect(onBatchResult.mock.calls[0][0]).toHaveLength(9);
    expect(onProgress).toHaveBeenLastCalledWith({
      processed: 9,
      failed: 1,
      pending: 3,
    });
    await vi.advanceTimersByTimeAsync(1200);
    expect(request.mock.calls[1][0].items).toHaveLength(2);
    expect(onProgress).toHaveBeenLastCalledWith({
      processed: 11,
      failed: 1,
      pending: 1,
    });
    await vi.advanceTimersByTimeAsync(60 * 60000);
    expect(
      request.mock.calls.filter(([args]) =>
        args.items.some(({ id }) => id === '2'),
      ),
    ).toHaveLength(3);
    expect(onProgress).toHaveBeenLastCalledWith({
      processed: 11,
      failed: 3,
      pending: 1,
    });
  } finally {
    stop();
    vi.useRealTimers();
  }
});

it('bounds persistence concurrency and sends only batch identities', async () => {
  vi.useFakeTimers();
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ ok: true, data: [] }),
  });
  vi.stubGlobal('fetch', fetchMock);
  const { requestClassificationBatch } = await import(
    './classificationQueue.js'
  );
  await requestClassificationBatch({
    items: [{ id: '603', type: 'movie', note: 'private' }],
    token: 'token',
  });
  expect(fetchMock.mock.calls[0][0]).toBe('/api/media/classify-batch');
  expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
    items: [{ id: '603', type: 'movie' }],
  });
  let active = 0;
  let peak = 0;
  const releases = [];
  const titles = Array.from({ length: 10 }, (_, i) => ({
    ...item,
    source: { provider: 'tmdb', providerId: String(i + 1) },
  }));
  const stop = startClassificationBackfill({
    getItems: () => titles,
    getToken: async () => 'token',
    storage: storage(),
    request: async ({ items }) =>
      items.map(({ id, type }) => ({
        id,
        type,
        ok: true,
        data: { ...result, key: `tmdb:movie:${id}` },
      })),
    onResult: async () => {
      peak = Math.max(peak, ++active);
      await new Promise((resolve) => releases.push(resolve));
      active--;
    },
  });
  try {
    await vi.advanceTimersByTimeAsync(1000);
    expect(active).toBe(3);
    for (let i = 0; i < 10; i++) {
      releases.shift()();
      await vi.advanceTimersByTimeAsync(0);
    }
    expect(peak).toBe(3);
  } finally {
    stop();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  }
});

it('isolates whole-batch 429 and timeout failures with persisted 15-minute retries and a three-attempt cap', async () => {
  vi.useFakeTimers();
  const startedAt = Date.now();
  const titles = Array.from({ length: 21 }, (_, index) => ({
    ...item,
    source: { provider: 'tmdb', providerId: String(index + 1) },
  }));
  const store = storage();
  const onResult = vi.fn();
  const fetchMock = vi.fn(async (_url, options) => {
    const { items } = JSON.parse(options.body);
    if (items.some(({ id }) => Number(id) <= 10)) {
      return {
        ok: false,
        status: 429,
        json: async () => ({ ok: false, error: { code: 'RATE_LIMITED' } }),
      };
    }
    if (items.some(({ id }) => Number(id) <= 20)) {
      throw new DOMException('Request timed out', 'TimeoutError');
    }
    return {
      ok: true,
      json: async () => ({
        ok: true,
        data: items.map(({ id, type }) => ({
          id,
          type,
          ok: true,
          data: { ...result, key: `tmdb:movie:${id}` },
        })),
      }),
    };
  });
  vi.stubGlobal('fetch', fetchMock);
  const stop = startClassificationBackfill({
    getItems: () => titles,
    getToken: async () => 'stub',
    onResult,
    storage: store,
  });
  const state = (id) =>
    JSON.parse(store.getItem(`hearth:classification:default:tmdb:movie:${id}`));
  try {
    await vi.advanceTimersByTimeAsync(3400);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(onResult).toHaveBeenCalledOnce();
    expect(onResult.mock.calls[0][0]).toBe(titles[20]);
    for (let id = 1; id <= 20; id++) {
      expect(state(id)).toMatchObject({
        completed: false,
        version: CLASSIFIER_VERSION,
        retryAt: startedAt + (id <= 10 ? 1000 : 2200) + 15 * 60000,
      });
      expect(typeof state(id).signature).toBe('string');
    }
    expect(state(21).completed).toBe(true);
    await vi.advanceTimersByTimeAsync(15 * 60000 - 3401);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    await vi.advanceTimersByTimeAsync(60 * 60000);
    const attempts = new Map();
    for (const [url, options] of fetchMock.mock.calls) {
      expect(url).toBe('/api/media/classify-batch');
      for (const { id } of JSON.parse(options.body).items)
        attempts.set(id, (attempts.get(id) || 0) + 1);
    }
    for (let id = 1; id <= 20; id++) {
      expect(attempts.get(String(id))).toBe(3);
      expect(state(id).completed).toBe(false);
      expect(state(id).retryAt).toBeGreaterThan(startedAt + 30 * 60000);
    }
    expect(attempts.get('21')).toBe(1);
    expect(onResult).toHaveBeenCalledOnce();
  } finally {
    stop();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  }
});
