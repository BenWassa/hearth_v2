import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../services/firebase/client.js', async (importOriginal) => ({
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
