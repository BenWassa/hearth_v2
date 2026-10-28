import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it } from 'vitest';
import { HearthAppView } from '../App.jsx';

it('keeps onboarding hidden until auth and bootstrap have both resolved', async () => {
  const container = document.createElement('div');
  const root = createRoot(container);
  try {
    for (const state of [
      { authResolved: false, isBootstrapping: false },
      { authResolved: true, isBootstrapping: true },
    ]) {
      await act(async () => {
        root.render(
          <HearthAppView
            appState={{
              ...state,
              items: [],
              userSpaces: [],
              view: 'onboarding',
            }}
          />,
        );
      });
      expect(container.querySelector('.animate-pulse')).not.toBeNull();
      expect(container.querySelector('button')).toBeNull();
    }
  } finally {
    await act(async () => root.unmount());
  }
});
