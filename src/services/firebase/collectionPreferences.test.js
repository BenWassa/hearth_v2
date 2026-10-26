import { beforeEach, describe, expect, it, vi } from 'vitest';

const sdk = vi.hoisted(() => ({
  collection: vi.fn((...args) => ({ args })),
  doc: vi.fn((...args) => ({ args })),
  onSnapshot: vi.fn(),
  setDoc: vi.fn(),
  deleteDoc: vi.fn(),
  serverTimestamp: vi.fn(() => 'server-time'),
}));
vi.mock('firebase/firestore', () => sdk);
import {
  isCollectionPreferenceKey,
  saveCollectionPreference,
  subscribeCollectionPreferences,
} from './collectionPreferences.js';
const context = { db: 'db', appId: 'app', spaceId: 'household' };
beforeEach(() => vi.clearAllMocks());

describe('canonical collection preferences', () => {
  it.each(['tmdb:263', 'provider-2:collection_42', 'x:a'])(
    'accepts bounded canonical identity %s',
    (key) => expect(isCollectionPreferenceKey(key)).toBe(true),
  );
  it.each([
    'collection:tmdb:263',
    'The Dark Knight',
    'tmdb:../263',
    'tmdb:263/child',
    'tmdb:',
    'x'.repeat(21) + ':1',
    'tmdb:' + '1'.repeat(81),
    '',
    null,
  ])('rejects invalid identity %s', (key) =>
    expect(isCollectionPreferenceKey(key)).toBe(false),
  );
  it('saves false as a real shared override and resets only by deletion', async () => {
    await saveCollectionPreference({
      ...context,
      key: 'tmdb:263',
      visible: false,
    });
    expect(sdk.doc.mock.calls[0]).toEqual([
      'db',
      'artifacts',
      'app',
      'spaces',
      'household',
      'collection_preferences',
      'tmdb:263',
    ]);
    expect(sdk.setDoc.mock.calls[0][1]).toEqual({
      visible: false,
      updatedAt: 'server-time',
    });
    await saveCollectionPreference({
      ...context,
      key: 'tmdb:263',
      visible: null,
    });
    expect(sdk.deleteDoc).toHaveBeenCalledOnce();
    expect(sdk.setDoc).toHaveBeenCalledOnce();
  });
  it('validates the requested value and scope before writing', async () => {
    await expect(
      saveCollectionPreference({
        ...context,
        key: 'tmdb:263',
        visible: 'show',
      }),
    ).rejects.toThrow('Choose');
    await expect(
      saveCollectionPreference({ ...context, key: 'bad/path', visible: true }),
    ).rejects.toThrow('identity');
    await expect(
      saveCollectionPreference({
        ...context,
        db: null,
        key: 'tmdb:263',
        visible: true,
      }),
    ).rejects.toThrow('unavailable');
    expect(sdk.setDoc).not.toHaveBeenCalled();
    expect(sdk.deleteDoc).not.toHaveBeenCalled();
  });
  it('subscribes only within the selected household and preserves false versus absence', () => {
    const next = vi.fn();
    const error = vi.fn();
    const unsubscribe = vi.fn();
    sdk.onSnapshot.mockReturnValue(unsubscribe);
    expect(
      subscribeCollectionPreferences({
        ...context,
        onNext: next,
        onError: error,
      }),
    ).toBe(unsubscribe);
    expect(sdk.collection.mock.calls[0]).toEqual([
      'db',
      'artifacts',
      'app',
      'spaces',
      'household',
      'collection_preferences',
    ]);
    const onSnapshot = sdk.onSnapshot.mock.calls[0][1];
    onSnapshot({
      docs: [
        { id: 'tmdb:263', data: () => ({ visible: false }) },
        { id: 'tmdb:264', data: () => ({ visible: true }) },
        { id: 'invalid', data: () => ({ visible: true }) },
        { id: 'tmdb:645', data: () => ({ visible: 'true' }) },
      ],
    });
    expect(next).toHaveBeenLastCalledWith({
      'tmdb:263': false,
      'tmdb:264': true,
    });
    onSnapshot({ docs: [] });
    expect(next).toHaveBeenLastCalledWith({});
    expect(sdk.onSnapshot.mock.calls[0][2]).toBe(error);
  });
});
