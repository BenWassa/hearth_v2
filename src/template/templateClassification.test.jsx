import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useTemplateAppState } from './useTemplateAppState.js';
import { requestClassificationBatch } from '../services/mediaApi/classificationQueue.js';
import { classifyMedia } from '../domain/media/classification.mjs';
import { getEffectiveShelfEnergy } from '../domain/media/shelfGroups.js';

const demoUser = vi.hoisted(() => ({
  uid: 'demo-user',
  isAnonymous: true,
  getIdToken: vi.fn(async () => 'demo-token'),
}));
vi.mock('../services/firebase/client.js', () => ({
  initializeFirebase: (ready) =>
    ready({ auth: { app: {}, currentUser: demoUser } }),
}));
vi.mock('../services/firebase/auth.js', () => ({
  signInAnonymousUser: vi.fn(async () => demoUser),
  signOutUser: vi.fn(),
  subscribeToAuth: (_auth, callback) => {
    callback(demoUser);
    return () => {};
  },
}));
vi.mock('../services/mediaApi/classificationQueue.js', async (original) => ({
  ...(await original()),
  requestClassificationBatch: vi.fn(),
}));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});
const newTitle = {
  title: 'New film',
  type: 'movie',
  note: 'Our private plan',
  source: { provider: 'tmdb', providerId: '603' },
  media: { title: 'New film', type: 'movie', keywords: ['heist'] },
  userState: { tagProvenance: { vibe: 'automatic', energy: 'automatic' } },
};
const resultFor = (item) => {
  const classification = classifyMedia(item);
  return {
    ...classification,
    pipelineVersion: classification.version,
    attributes: {
      ...classification.attributes,
      attentionDemand: {
        value: 'medium',
        confidence: 'high',
        method: 'gemini',
      },
    },
  };
};
const mount = async () => {
  let state;
  function Probe() {
    state = useTemplateAppState();
    return null;
  }
  const root = createRoot(document.createElement('div'));
  await act(async () => root.render(<Probe />));
  return { get: () => state, close: () => act(async () => root.unmount()) };
};

describe('demo classification parity', () => {
  it('classifies visitor additions in memory, leaves curated seeds alone and preserves personal state', async () => {
    vi.useFakeTimers();
    requestClassificationBatch.mockResolvedValue([
      { id: '603', type: 'movie', ok: true, data: resultFor(newTitle) },
    ]);
    const mounted = await mount();
    try {
      await act(async () => vi.advanceTimersByTimeAsync(1000));
      expect(requestClassificationBatch).not.toHaveBeenCalled();
      await act(async () => mounted.get().handleAddItem(newTitle));
      await act(async () => vi.advanceTimersByTimeAsync(1000));
      expect(requestClassificationBatch).toHaveBeenCalledWith(
        expect.objectContaining({
          demo: true,
          token: 'demo-token',
          items: [{ id: '603', type: 'movie' }],
        }),
      );
      const added = mounted
        .get()
        .items.find((item) => item.source.providerId === '603');
      expect(added.energy).toBe('');
      expect(getEffectiveShelfEnergy(added)).toBe('balanced');
      expect(added.note).toBe('Our private plan');
      expect(added.status).toBe('unwatched');
      expect(added.tagProvenance).toEqual({
        vibe: 'automatic',
        energy: 'automatic',
      });
      expect(
        Object.keys(localStorage).filter((key) =>
          key.startsWith('hearth:classification:'),
        ),
      ).toEqual([]);
      await act(async () => mounted.get().loadTemplateScenario('full'));
      expect(
        mounted.get().items.some((item) => item.source.providerId === '603'),
      ).toBe(false);
    } finally {
      await mounted.close();
    }
  });

  it('ignores an enrichment response after a scenario reset', async () => {
    vi.useFakeTimers();
    let resolve;
    requestClassificationBatch.mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const mounted = await mount();
    try {
      await act(async () => mounted.get().handleAddItem(newTitle));
      await act(async () => vi.advanceTimersByTimeAsync(1000));
      expect(resolve).toBeTypeOf('function');
      await act(async () => mounted.get().loadTemplateScenario('empty'));
      await act(async () =>
        resolve([
          { id: '603', type: 'movie', ok: true, data: resultFor(newTitle) },
        ]),
      );
      expect(mounted.get().items).toEqual([]);
    } finally {
      await mounted.close();
    }
  });
});
