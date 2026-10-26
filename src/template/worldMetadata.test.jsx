import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import { useTemplateAppState } from './useTemplateAppState.js';
import { worldForItem } from '../config/collectionWorlds.js';

vi.mock('./seedLibrary.js', () => ({
  buildTemplateSeedItems: () => [],
  TEMPLATE_SPACE_ID: 'synthetic-template',
  TEMPLATE_SPACE_NAME: 'Synthetic',
}));
vi.mock('../services/firebase/client.js', () => ({
  initializeFirebase: (onReady) => onReady?.({ auth: null, db: null }),
}));
vi.mock('../services/firebase/auth.js', () => ({
  signInAnonymousUser: vi.fn(),
  signOutUser: vi.fn(),
  subscribeToAuth: vi.fn(),
}));
vi.mock('../services/mediaApi/client.js', () => ({
  getMediaDetails: vi.fn().mockResolvedValue({
    type: 'show',
    title: 'Synthetic World TV',
    runtimeMinutes: 45,
    year: '2026',
    seasonCount: 1,
    seasonSummaries: [],
  }),
}));
global.IS_REACT_ACT_ENVIRONMENT = true;
it('retains valid explicit TV affiliation through demo add, edit and metadata refresh', async () => {
  let state;
  const Harness = () => {
    state = useTemplateAppState();
    return null;
  };
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    await act(async () => root.render(<Harness />));
    await act(async () =>
      state.handleAddItem({
        type: 'show',
        title: 'Synthetic World TV',
        source: { provider: 'tmdb', providerId: 'synthetic-show' },
        worldIds: ['wizarding-world', 'invalid', 'wizarding-world'],
      }),
    );
    expect(state.items[0].media.worldIds).toEqual(['wizarding-world']);
    expect(worldForItem(state.items[0])?.id).toBe('wizarding-world');
    const id = state.items[0].id;
    await act(async () =>
      state.handleUpdateItem(id, { 'media.worldId': 'dc' }),
    );
    expect(state.items[0].media.worldIds).toEqual(['dc']);
    await act(async () => state.handleMetadataRefreshAll());
    expect(state.items[0].media.worldIds).toEqual(['dc']);
    await act(async () => state.handleUpdateItem(id, { worldIds: [] }));
    expect(state.items[0].media.worldIds).toEqual([]);
    expect(worldForItem(state.items[0])).toBeNull();
  } finally {
    await act(async () => root.unmount());
    host.remove();
  }
});
