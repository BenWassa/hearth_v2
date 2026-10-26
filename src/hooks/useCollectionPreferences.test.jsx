import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => ({
  initialize: vi.fn(),
  subscribe: vi.fn(),
  save: vi.fn(),
}));
vi.mock('../services/firebase/client.js', () => ({
  initializeFirebase: mock.initialize,
  getAppId: () => 'app',
}));
vi.mock('../services/firebase/collectionPreferences.js', async (original) => ({
  ...(await original()),
  subscribeCollectionPreferences: mock.subscribe,
  saveCollectionPreference: mock.save,
}));
import useCollectionPreferences from './useCollectionPreferences.js';

global.IS_REACT_ACT_ENVIRONMENT = true;
let latest, root, host;
const Harness = (props) => {
  latest = useCollectionPreferences(props);
  return null;
};
const render = async (props) => {
  if (!host) {
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
  }
  await act(async () => root.render(<Harness {...props} />));
};
beforeEach(() => {
  mock.initialize.mockReset();
  mock.subscribe.mockReset();
  mock.save.mockReset();
  mock.initialize.mockImplementation((ready) => {
    ready({ db: 'db' });
    return { db: 'db' };
  });
  mock.subscribe.mockReturnValue(vi.fn());
  mock.save.mockResolvedValue(undefined);
});
afterEach(async () => {
  if (root) await act(async () => root.unmount());
  host?.remove();
  root = null;
  host = null;
});

describe('household collection preference lifecycle', () => {
  it('loads shared preferences once and saves without inventing optimistic server state', async () => {
    await render({ spaceId: 'a' });
    expect(mock.subscribe).toHaveBeenCalledOnce();
    expect(latest.loading).toBe(true);
    const subscription = mock.subscribe.mock.calls[0][0];
    await act(async () => subscription.onNext({ 'tmdb:263': false }));
    expect(latest.preferences).toEqual({ 'tmdb:263': false });
    expect(latest.loading).toBe(false);
    await act(async () => {
      expect(await latest.setPreference('tmdb:263', true)).toBe(true);
    });
    expect(mock.save).toHaveBeenCalledWith({
      db: 'db',
      appId: 'app',
      spaceId: 'a',
      key: 'tmdb:263',
      visible: true,
    });
    expect(latest.preferences['tmdb:263']).toBe(false);
    await act(async () => subscription.onNext({ 'tmdb:263': true }));
    expect(latest.preferences['tmdb:263']).toBe(true);
  });
  it('clears household context on switching and ignores stale reads and errors', async () => {
    await render({ spaceId: 'a' });
    const first = mock.subscribe.mock.calls[0][0];
    const unsubscribe = mock.subscribe.mock.results[0].value;
    await act(async () => first.onNext({ 'tmdb:263': false }));
    await render({ spaceId: 'b' });
    expect(unsubscribe).toHaveBeenCalledOnce();
    expect(latest.preferences).toEqual({});
    await act(async () => {
      first.onNext({ 'tmdb:264': false });
      first.onError(new Error('old'));
    });
    expect(latest.preferences).toEqual({});
    expect(latest.error).toBeNull();
    await act(async () => latest.setPreference('tmdb:264', true));
    expect(mock.save.mock.calls[0][0].spaceId).toBe('b');
  });
  it('surfaces failed saves and reads without treating absence as an explicit hide', async () => {
    await render({ spaceId: 'a' });
    const subscription = mock.subscribe.mock.calls[0][0];
    await act(async () => subscription.onNext({}));
    mock.save.mockRejectedValue(new Error('offline'));
    await act(async () => {
      expect(await latest.setPreference('tmdb:263', false)).toBe(false);
    });
    expect(latest.error).toContain('Could not save');
    expect(latest.saving).toBe(false);
    expect(latest.preferences).toEqual({});
    await act(async () => subscription.onError(new Error('permission-denied')));
    expect(latest.error).toContain('Could not load');
    expect(latest.loading).toBe(false);
  });
  it('waits for delayed initialization and detaches before a stale callback can subscribe', async () => {
    let ready;
    mock.initialize.mockImplementation((callback) => {
      ready = callback;
      return { db: null };
    });
    await render({ spaceId: 'a' });
    expect(latest.loading).toBe(true);
    const oldReady = ready;
    await render({ spaceId: undefined });
    await act(async () => oldReady({ db: 'db' }));
    expect(mock.subscribe).not.toHaveBeenCalled();
    expect(latest.loading).toBe(false);
  });
  it('keeps template preferences across view navigation without touching Firestore', async () => {
    const props = { spaceId: 'demo-only-test', isTemplateSession: true };
    await render(props);
    await act(async () => latest.setPreference('tmdb:263', false));
    expect(latest.preferences['tmdb:263']).toBe(false);
    await act(async () => root.unmount());
    root = createRoot(host);
    await render(props);
    expect(latest.preferences['tmdb:263']).toBe(false);
    await act(async () => latest.setPreference('tmdb:263', null));
    expect(latest.preferences).not.toHaveProperty('tmdb:263');
    expect(mock.initialize).not.toHaveBeenCalled();
    expect(mock.save).not.toHaveBeenCalled();
  });
  it('reports offline/no-household write failure without issuing an unscoped request', async () => {
    await render({});
    await act(async () => {
      expect(await latest.setPreference('tmdb:263', true)).toBe(false);
    });
    expect(mock.initialize).not.toHaveBeenCalled();
    expect(mock.save).not.toHaveBeenCalled();
    expect(latest.error).toContain('Could not save');
  });
});
