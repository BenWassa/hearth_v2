import {
  startClassificationBackfill,
  requestClassification,
} from './classificationQueue.js';
import { classifyMedia } from '../../domain/media/classification.mjs';
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
  pipelineVersion: 'viewing-1',
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
    const request = vi.fn().mockResolvedValue(result);
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
      id: '603',
      type: 'movie',
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
    request.mockResolvedValue(result);
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
    finish(result);
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
  const request = vi.fn().mockResolvedValue(result);
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
