import { beforeEach, describe, expect, it, vi } from 'vitest';

const sdk = vi.hoisted(() => ({
  initializeApp: vi.fn(),
  getAuth: vi.fn(),
  getFirestore: vi.fn(),
}));
vi.mock('firebase/app', () => ({ initializeApp: sdk.initializeApp }));
vi.mock('firebase/auth', () => ({ getAuth: sdk.getAuth }));
vi.mock('firebase/firestore', () => ({ getFirestore: sdk.getFirestore }));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  delete window.__firebase_config;
  sdk.initializeApp.mockReturnValue({ name: 'test' });
  sdk.getAuth.mockReturnValue({ currentUser: { uid: 'persisted' } });
  sdk.getFirestore.mockReturnValue({ name: 'shelf' });
});

const config = { apiKey: 'synthetic', projectId: 'test' };

describe('Firebase bootstrap contract', () => {
  it('auth-only demo client never initializes Firestore or clears the session', async () => {
    window.__firebase_config = config;
    const { initializeFirebase } = await import('./authClient.js');
    const ready = vi.fn();
    const result = initializeFirebase(ready);
    expect(result.auth.currentUser.uid).toBe('persisted');
    expect(result.db).toBeNull();
    expect(ready).toHaveBeenCalledWith(result);
    expect(sdk.getFirestore).not.toHaveBeenCalled();
  });

  it('publishes auth and db together with immediate config', async () => {
    window.__firebase_config = config;
    const { initializeFirebase } = await import('./client.js');
    const ready = vi.fn();
    const result = initializeFirebase(ready);
    expect(result.auth.currentUser.uid).toBe('persisted');
    expect(result.db).toEqual({ name: 'shelf' });
    expect(ready).toHaveBeenCalledWith(result);
  });

  it('waits for delayed config before publishing usable auth and db', async () => {
    vi.useFakeTimers();
    try {
      const { initializeFirebase } = await import('./client.js');
      const ready = vi.fn();
      expect(initializeFirebase(ready)).toEqual({
        app: null,
        auth: null,
        db: null,
      });
      expect(ready).not.toHaveBeenCalled();
      window.__firebase_config = config;
      await vi.advanceTimersByTimeAsync(500);
      expect(ready).toHaveBeenCalledTimes(1);
      expect(ready.mock.calls[0][0].auth.currentUser.uid).toBe('persisted');
      expect(ready.mock.calls[0][0].db).toEqual({ name: 'shelf' });
    } finally {
      vi.useRealTimers();
    }
  });

  it('resolves offline without touching either SDK for invalid config', async () => {
    window.__firebase_config = {};
    const { initializeFirebase } = await import('./client.js');
    const ready = vi.fn();
    expect(initializeFirebase(ready)).toEqual({
      app: null,
      auth: null,
      db: null,
    });
    expect(ready).toHaveBeenCalledWith({ app: null, auth: null, db: null });
    expect(sdk.getAuth).not.toHaveBeenCalled();
    expect(sdk.getFirestore).not.toHaveBeenCalled();
  });
});
