import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { vi } from 'vitest';
import TonightView from './TonightView.jsx';

vi.mock('./components/tonight/HeroCarousel.jsx', () => ({
  default: () => <div data-testid="hero-carousel" />,
}));

vi.mock('./components/tonight/CollectionsRail.jsx', () => ({
  default: () => <div data-testid="collections-rail" />,
}));

vi.mock('./components/tonight/SuggestionSection.jsx', () => ({
  default: ({ title }) => <section>{title}</section>,
}));

vi.mock('./components/tonight/TonightHeaderMenu.jsx', () => ({
  default: () => <header data-testid="tonight-header" />,
}));

vi.mock('./components/tonight/BottomNav.jsx', () => ({
  default: () => <nav data-testid="bottom-nav" />,
}));

vi.mock('../components/ItemDetailsModal.jsx', () => ({
  default: () => null,
}));

vi.mock('../components/CollectionDetailsModal.jsx', () => ({
  default: () => null,
}));

vi.mock('./components/tonight/MetadataAuditModal.jsx', () => ({
  default: () => null,
}));

vi.mock('./components/tonight/WipeConfirmModal.jsx', () => ({
  default: () => null,
}));

const renderTonight = async (items) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(
      <TonightView
        items={items}
        onToggleStatus={() => {}}
        onAdd={() => {}}
        goToShelf={() => {}}
      />,
    );
  });
  return { container, root };
};

const cleanupTonight = async ({ container, root }) => {
  await act(async () => {
    root.unmount();
  });
  container.remove();
};

describe('TonightView coming soon row', () => {
  beforeAll(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
  });

  it('renders Coming Soon directly after Currently Watching when releases exist', async () => {
    const mounted = await renderTonight([
      {
        id: 'show-1',
        type: 'show',
        status: 'watching',
        title: 'The North Road',
        seasons: [
          {
            seasonNumber: 2,
            name: 'Season 2',
            episodes: [
              {
                id: 's2e1',
                episodeNumber: 1,
                name: 'The Signal',
                airDate: '2099-01-01',
              },
            ],
          },
        ],
      },
    ]);

    const text = mounted.container.textContent;
    expect(text).toContain('Currently Watching');
    expect(text).toContain('Coming Soon');
    expect(text.indexOf('Coming Soon')).toBeGreaterThan(
      text.indexOf('Currently Watching'),
    );
    expect(text).toContain('The North Road');
    expect(text).toContain('The Signal');

    await cleanupTonight(mounted);
  });

  it('omits Coming Soon when no upcoming releases exist', async () => {
    const mounted = await renderTonight([
      {
        id: 'show-1',
        type: 'show',
        status: 'watching',
        title: 'The North Road',
        seasons: [
          {
            seasonNumber: 1,
            episodes: [
              {
                id: 's1e1',
                episodeNumber: 1,
                name: 'The Pilot',
                airDate: '2020-01-01',
              },
            ],
          },
        ],
      },
    ]);

    expect(mounted.container.textContent).not.toContain('Coming Soon');

    await cleanupTonight(mounted);
  });
});
