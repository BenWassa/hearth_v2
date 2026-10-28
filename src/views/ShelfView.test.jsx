import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import ShelfView from './ShelfView.jsx';
import { classifyMedia } from '../domain/media/classification.mjs';

vi.mock('../components/cards/PosterCard.jsx', () => ({
  default: ({ item }) => (
    <div data-testid={`card-${item.id}`}>{item.title}</div>
  ),
}));
vi.mock('../components/ItemDetailsModal.jsx', () => ({ default: () => null }));

const renderShelf = async (items) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(
      <ShelfView
        items={items}
        onToggleStatus={() => {}}
        onAdd={() => {}}
        onUpdate={() => {}}
        onDelete={() => {}}
        onBack={() => {}}
      />,
    );
  });
  return { container, root };
};

const cleanupShelf = async ({ container, root }) => {
  await act(async () => root.unmount());
  container.remove();
};

describe('ShelfView grouping', () => {
  beforeAll(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
  });

  it('groups a title without a vibe by its automatic comfort classification', async () => {
    const mounted = await renderShelf([
      {
        id: 'comfort-title',
        type: 'movie',
        status: 'unwatched',
        title: 'A Gentle Film',
        classification: {
          ...classifyMedia({ type: 'movie' }),
          attributes: {
            ...classifyMedia({ type: 'movie' }).attributes,
            comfort: { value: 'high', confidence: 'medium' },
          },
        },
      },
    ]);
    const comfortHeader = [...mounted.container.querySelectorAll('h3')].find(
      (node) => node.textContent === 'Comfort',
    );

    expect(comfortHeader).toBeTruthy();
    expect(
      comfortHeader.parentElement.parentElement.contains(
        mounted.container.querySelector('[data-testid="card-comfort-title"]'),
      ),
    ).toBe(true);

    await cleanupShelf(mounted);
  });

  it('keeps a legacy tagged title in its tag group', async () => {
    const mounted = await renderShelf([
      {
        id: 'legacy-title',
        type: 'movie',
        status: 'unwatched',
        title: 'Legacy Visual',
        vibe: 'visual',
      },
    ]);
    const visualHeader = [...mounted.container.querySelectorAll('h3')].find(
      (node) => node.textContent === 'Visual',
    );

    expect(visualHeader).toBeTruthy();
    expect(
      visualHeader.parentElement.parentElement.contains(
        mounted.container.querySelector('[data-testid="card-legacy-title"]'),
      ),
    ).toBe(true);

    await cleanupShelf(mounted);
  });
});
