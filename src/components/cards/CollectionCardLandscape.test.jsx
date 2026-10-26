import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import CollectionCardLandscape from './CollectionCardLandscape.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('CollectionCardLandscape progress accessibility', () => {
  it.each([
    [0, '3 films'],
    [1, '1 of 3 watched'],
    [3, 'Shelf watched'],
  ])(
    'includes progress in the accessible name for %s watched',
    async (watchedCount, state) => {
      const container = document.createElement('div');
      document.body.appendChild(container);
      const root = createRoot(container);
      await act(async () =>
        root.render(
          <CollectionCardLandscape
            collection={{
              id: 'films',
              title: 'A Collection',
              totalCount: 3,
              watchedCount,
            }}
          />,
        ),
      );
      expect(container.querySelector('button').getAttribute('aria-label')).toBe(
        `Open A Collection, ${state}`,
      );
      await act(async () => root.unmount());
      container.remove();
    },
  );
});
