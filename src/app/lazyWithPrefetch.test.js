import { afterEach, describe, expect, it, vi } from 'vitest';
import { lazyWithPrefetch, prefetchOnIdle } from './lazyWithPrefetch.js';

describe('lazyWithPrefetch', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('loads the chunk once no matter how often it is preloaded', async () => {
    const loader = vi.fn(() => Promise.resolve({ default: () => null }));
    const Lazy = lazyWithPrefetch(loader);
    await Promise.all([Lazy.preload(), Lazy.preload()]);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('swallows a failed prefetch and retries on the next preload', async () => {
    const loader = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ default: () => null });
    const Lazy = lazyWithPrefetch(loader);
    await expect(Lazy.preload()).resolves.toBeUndefined();
    await Lazy.preload();
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('prefetchOnIdle falls back to a timeout and can be cancelled', () => {
    vi.useFakeTimers();
    const preload = vi.fn();
    const originalIdle = window.requestIdleCallback;
    delete window.requestIdleCallback;
    try {
      prefetchOnIdle([{ preload }]);
      expect(preload).not.toHaveBeenCalled();
      vi.runAllTimers();
      expect(preload).toHaveBeenCalledTimes(1);

      const cancel = prefetchOnIdle([{ preload }]);
      cancel();
      vi.runAllTimers();
      expect(preload).toHaveBeenCalledTimes(1);
    } finally {
      if (originalIdle) window.requestIdleCallback = originalIdle;
    }
  });
});
