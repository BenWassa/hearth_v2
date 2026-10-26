import { lazy, useRef } from 'react';

/**
 * React.lazy wrapper that remembers its loader so the chunk can be fetched
 * ahead of time (`Component.preload()`). Safe to call preload many times: the
 * import promise is cached, and a failed prefetch is forgotten so the real
 * render can retry.
 */
export const lazyWithPrefetch = (loader) => {
  let promise = null;
  const load = () => {
    if (!promise) {
      promise = loader().catch((error) => {
        promise = null;
        throw error;
      });
    }
    return promise;
  };
  const Component = lazy(load);
  Component.preload = () => load().catch(() => {});
  return Component;
};

const scheduleIdle = (callback) => {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    const id = window.requestIdleCallback(callback, { timeout: 4000 });
    return () => window.cancelIdleCallback?.(id);
  }
  const id = setTimeout(callback, 1500);
  return () => clearTimeout(id);
};

/**
 * Prefetch lazy components (those made with lazyWithPrefetch) when the
 * browser is idle. Returns a cancel function, usable as a useEffect cleanup.
 */
export const prefetchOnIdle = (components = []) =>
  scheduleIdle(() => {
    components.forEach((component) => component?.preload?.());
  });

/**
 * True from the first render where `value` was truthy, and stays true. Use it
 * to mount a lazy modal on first open and keep it mounted afterwards, so its
 * own open/close behaviour is unchanged and the chunk is not fetched until
 * needed (or prefetched on idle).
 */
export const useHasBeenTrue = (value) => {
  const seen = useRef(false);
  if (value) seen.current = true;
  return seen.current;
};
