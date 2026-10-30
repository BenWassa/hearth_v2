import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../services/firebase/authClient.js', async (importOriginal) => ({
  ...(await importOriginal()),
  initializeFirebase: vi.fn((onReady) => onReady?.({ auth: null, db: null })),
}));
vi.mock('../services/firebase/auth.js', async (importOriginal) => ({
  ...(await importOriginal()),
  signInAnonymousUser: vi.fn(() => Promise.resolve(null)),
  signOutUser: vi.fn(() => Promise.resolve()),
  subscribeToAuth: vi.fn((cb) => {
    cb?.(null);
    return () => {};
  }),
}));
vi.mock('../services/mediaApi/client.js', async (importOriginal) => ({
  ...(await importOriginal()),
  getMediaDetails: vi.fn(() => Promise.reject(new Error('offline'))),
}));

describe('TemplateApp (lazy template entry)', () => {
  it('loads through dynamic import and renders the seeded Tonight view', async () => {
    const { default: TemplateApp } = await import('./TemplateApp.jsx');
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(<TemplateApp />);
    });
    for (let i = 0; i < 20 && !container.textContent; i += 1) {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 25));
      });
    }
    expect(container.textContent).toMatch(
      /Template mode: all changes reset on refresh/i,
    );
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});

describe('Template Recently removed', () => {
  it.each(['', 'Retained note'])(
    're-adding preserves a retained note or fills an empty one: %s',
    async (note) => {
      const { useTemplateAppState } = await import('./useTemplateAppState.js');
      let state;
      function Probe() {
        state = useTemplateAppState();
        return null;
      }
      const root = createRoot(document.createElement('div'));
      try {
        await act(async () => root.render(<Probe />));
        const original = state.items[0];
        original.note = note;
        await act(async () =>
          state.handleBulkDelete([original.id], { skipConfirm: true }),
        );
        await act(async () => state.setView('add'));
        await act(async () =>
          state.handleAddItem({ ...original, note: 'Typed note' }),
        );
        expect(state.items.find((item) => item.id === original.id).note).toBe(
          note || 'Typed note',
        );
        expect(state.view).toBe('tonight');
        expect(state.updateMessage).toBe(
          `Brought back ${original.title} from Recently removed.`,
        );
      } finally {
        await act(async () => root.unmount());
      }
    },
  );

  it('removes from all active items, restores exact data, rejects conflicts and purges expiry', async () => {
    const { useTemplateAppState } = await import('./useTemplateAppState.js');
    let state;
    function Probe() {
      state = useTemplateAppState();
      return null;
    }
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => root.render(<Probe />));
    const original = structuredClone(state.items[0]);
    const second = state.items[1];
    await act(async () => {
      await state.handleBulkDelete([original.id], { skipConfirm: true });
    });
    expect(state.items.some((item) => item.id === original.id)).toBe(false);
    expect(state.removedItems[0]).toMatchObject(original);
    await act(async () => {
      expect((await state.handleRestoreRemoved(original.id)).status).toBe(
        'restored',
      );
    });
    const restored = { ...state.items.find((item) => item.id === original.id) };
    delete restored.removedAt;
    delete restored.removedBy;
    delete restored.removedItem;
    expect(restored).toEqual(original);
    await act(async () => {
      await state.handleBulkDelete([original.id, second.id], {
        skipConfirm: true,
      });
    });
    await act(async () =>
      state.handleAddItem({ ...original, note: 'Overwrite attempt' }),
    );
    expect(state.items.find((item) => item.id === original.id).note).toBe(
      original.note?.trim() ? original.note : 'Overwrite attempt',
    );
    expect(state.view).toBe('tonight');
    expect(state.updateMessage).toBe(
      `Brought back ${original.title} from Recently removed.`,
    );
    await act(async () =>
      state.handleBulkDelete([original.id], { skipConfirm: true }),
    );
    const active = state.items[0];
    const savedIdentity = {
      title: active.title,
      type: active.type,
      year: active.year,
      mediaId: active.mediaId,
      source: active.source,
    };
    Object.assign(active, {
      title: original.title,
      type: original.type,
      year: original.year,
      mediaId: original.mediaId,
      source: original.source,
    });
    await act(async () =>
      expect((await state.handleRestoreRemoved(original.id)).status).toBe(
        'conflict',
      ),
    );
    Object.assign(active, savedIdentity);
    state.removedItems.find((item) => item.id === original.id).note =
      'Newer change';
    await act(async () => {
      expect((await state.handleRestoreRemoved(original.id)).status).toBe(
        'restored',
      );
    });
    const clock = vi
      .spyOn(Date, 'now')
      .mockReturnValue(Date.now() + 24 * 60 * 60 * 1000 + 1);
    try {
      await act(async () => {
        expect((await state.handleRestoreRemoved(second.id)).status).toBe(
          'expired',
        );
        await state.handlePurgeRemoved();
      });
      expect(state.removedItems).toHaveLength(1);
      await act(async () => state.handleDeleteAll());
      expect(state.items).toEqual([]);
      expect(state.removedItems).toEqual([]);
      clock.mockReturnValue(Date.now() + 7 * 86400000);
      await act(async () => state.handlePurgeRemoved());
      expect(state.removedItems).toEqual([]);
      expect(state.items.some((item) => item.id === second.id)).toBe(false);
    } finally {
      clock.mockRestore();
      await act(async () => root.unmount());
      container.remove();
    }
  });
});
