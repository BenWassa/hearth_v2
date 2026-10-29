import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { vi } from 'vitest';
import TonightView from './TonightView.jsx';
import { stableOrder } from '../domain/media/tonightComposition.js';
import { buildTemplateSeedItems } from '../template/seedLibrary.js';

vi.mock('./components/tonight/HeroCarousel.jsx', () => ({
  default: () => <div data-testid="hero-carousel" />,
}));

vi.mock('./components/tonight/CollectionsRail.jsx', () => ({
  default: () => <div data-testid="collections-rail" />,
}));

vi.mock('./components/tonight/WorldsRail.jsx', () => ({
  default: () => <div data-testid="worlds-rail" />,
}));

// Renders title and card ids so tests can assert row membership.
vi.mock('./components/tonight/SuggestionSection.jsx', () => ({
  default: ({ title, suggestions = [] }) => (
    <section data-testid="suggestion-section" data-title={title}>
      {title}
      <ul>
        {suggestions.map((item) => (
          <li key={item.id} data-item-id={item.id}>
            {item.title}
          </li>
        ))}
      </ul>
    </section>
  ),
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

vi.mock('../components/SagaPage.jsx', () => ({
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

describe('TonightView thematic rows', () => {
  beforeAll(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
  });

  const CURRENTLY_WATCHING = 'Currently Watching';
  const thematicSections = (container) =>
    [
      ...container.querySelectorAll('[data-testid="suggestion-section"]'),
    ].filter((node) => node.getAttribute('data-title') !== CURRENTLY_WATCHING);

  it('uses the daily shuffle even when a title was just manually added', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 28, 12));
    const items = Array.from({ length: 5 }, (_, index) => ({
      id: `shuffle-${index}`,
      title: `Shuffle ${index}`,
      type: 'movie',
      status: 'unwatched',
      additionOrigin: 'manual',
      createdAt: '2020-01-01',
    }));
    const expected = stableOrder(items, '20261028');
    expected.at(-1).createdAt = new Date().toISOString();
    const mounted = await renderTonight(items);
    try {
      const ids = () =>
        [
          ...thematicSections(mounted.container)[0].querySelectorAll(
            '[data-item-id]',
          ),
        ].map((node) => node.dataset.itemId);
      expect(ids()).toEqual(expected.map(({ id }) => id));
    } finally {
      await cleanupTonight(mounted);
      vi.useRealTimers();
    }
  });

  it('renders the capped demo row set with substantial rails and no duplicates', async () => {
    const seed = buildTemplateSeedItems().map((item) => ({
      ...item,
      status: 'unwatched',
      episodeProgress: {},
      startedAt: null,
    }));
    expect(seed).toHaveLength(30);
    const mounted = await renderTonight(seed);

    const sections = thematicSections(mounted.container);
    expect(
      sections.map((section) => section.getAttribute('data-title')).sort(),
    ).toEqual([
      'Deep Dives',
      'Easy & Comforting',
      'Need a Laugh',
      'Quick Bites',
      'Spectacles',
      'The Classics',
    ]);
    expect(
      sections.map((section) => [
        section.getAttribute('data-title'),
        section.querySelectorAll('[data-item-id]').length,
      ]),
    ).toEqual([
      ['Easy & Comforting', 7],
      ['Need a Laugh', 3],
      ['Quick Bites', 4],
      ['Deep Dives', 4],
      ['Spectacles', 5],
      ['The Classics', 4],
    ]);
    const ids = sections.flatMap((section) =>
      [...section.querySelectorAll('[data-item-id]')].map((node) =>
        node.getAttribute('data-item-id'),
      ),
    );
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
    sections.forEach((section) => {
      expect(
        section.querySelectorAll('[data-item-id]').length,
      ).toBeGreaterThanOrEqual(3);
    });
    expect(mounted.container.textContent).not.toContain(
      'Nothing queued for tonight',
    );

    await cleanupTonight(mounted);
  });

  it('keeps the Worlds rail after the first rail and Collections above The Classics', async () => {
    const mounted = await renderTonight(
      buildTemplateSeedItems().map((item) => ({
        ...item,
        status: 'unwatched',
        episodeProgress: {},
        startedAt: null,
      })),
    );
    const html = mounted.container.innerHTML;
    const first = thematicSections(mounted.container)[0];
    const worlds = mounted.container.querySelector(
      '[data-testid="worlds-rail"]',
    );
    const collections = mounted.container.querySelector(
      '[data-testid="collections-rail"]',
    );
    expect(html).toContain('worlds-rail');
    expect(
      first.compareDocumentPosition(worlds) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    const classics = thematicSections(mounted.container).find(
      (node) => node.getAttribute('data-title') === 'The Classics',
    );
    if (classics) {
      expect(
        collections.compareDocumentPosition(classics) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }
    await cleanupTonight(mounted);
  });

  it('shows one compact row and no 1-card themed rails for a library of 3', async () => {
    const mounted = await renderTonight(
      buildTemplateSeedItems()
        .filter((item) => item.status === 'unwatched')
        .slice(0, 3),
    );

    const sections = thematicSections(mounted.container);
    expect(sections).toHaveLength(1);
    expect(sections[0].getAttribute('data-title')).toBe("Tonight's picks");
    expect(sections[0].querySelectorAll('[data-item-id]')).toHaveLength(3);

    await cleanupTonight(mounted);
  });

  it('shows a calm empty state pointing to Add for an empty library', async () => {
    const mounted = await renderTonight([]);

    expect(thematicSections(mounted.container)).toHaveLength(0);
    const text = mounted.container.textContent;
    expect(text).toContain('Nothing added yet');
    expect(text).toContain('Add your first title');

    await cleanupTonight(mounted);
  });

  it('omits the empty state when a show is in progress', async () => {
    const mounted = await renderTonight([
      {
        id: 'show-1',
        type: 'show',
        status: 'watching',
        title: 'The North Road',
        seasons: [],
      },
    ]);

    expect(mounted.container.textContent).toContain(CURRENTLY_WATCHING);
    expect(mounted.container.textContent).not.toContain(
      'Nothing queued for tonight',
    );

    await cleanupTonight(mounted);
  });
});
