import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import PosterCard from './PosterCard.jsx';

describe('PosterCard energy accessibility', () => {
  beforeAll(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
  });

  it.each([undefined, 'unknown', 'light'])(
    'only labels known energy values: %s',
    async (energy) => {
      const container = document.createElement('div');
      document.body.appendChild(container);
      const root = createRoot(container);
      await act(async () => {
        root.render(
          <PosterCard
            item={{ id: '1', title: 'A film', type: 'movie', energy }}
            onOpenDetails={() => {}}
          />,
        );
      });
      const badge = container.querySelector('[title^="Energy:"]');
      if (energy === 'light') {
        expect(badge.textContent).toBe('Light energy');
        expect(container.querySelector('.h-1.bg-sky-400')).toBeTruthy();
      } else {
        expect(badge).toBeNull();
        expect(container.querySelector('.h-1')).toBeNull();
      }
      await act(async () => {
        root.unmount();
      });
      container.remove();
    },
  );

  it('describes show progress and reports bulk selection separately from its name', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    const item = {
      id: 'show',
      title: 'A show',
      type: 'show',
      status: 'watching',
      seasons: [
        {
          number: 1,
          episodes: [
            { id: 'e1', number: 1 },
            { id: 'e2', number: 2 },
          ],
        },
      ],
      episodeProgress: { e1: true },
    };
    await act(async () =>
      root.render(<PosterCard item={item} onOpenDetails={() => {}} />),
    );
    const details = container.querySelector('button');
    expect(details.getAttribute('aria-label')).toBe('View details for A show');
    const description = document.getElementById(
      details.getAttribute('aria-describedby'),
    );
    expect(description.textContent).toContain('1 of 2 episodes watched');
    expect(details.hasAttribute('aria-pressed')).toBe(false);

    await act(async () =>
      root.render(
        <PosterCard item={item} selectionMode isSelected onSelect={() => {}} />,
      ),
    );
    expect(container.querySelector('button').getAttribute('aria-pressed')).toBe(
      'true',
    );
    await act(async () =>
      root.render(
        <PosterCard
          item={item}
          selectionMode
          isSelected={false}
          onSelect={() => {}}
        />,
      ),
    );
    expect(container.querySelector('button').getAttribute('aria-pressed')).toBe(
      'false',
    );
    await act(async () => root.unmount());
    container.remove();
  });
});
