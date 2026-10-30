import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import ShelfView from './ShelfView.jsx';
import { classifyMedia } from '../domain/media/classification.mjs';

vi.mock('../components/cards/PosterCard.jsx', () => ({
  default: ({ item, onSelect }) => (
    <button data-testid={`card-${item.id}`} onClick={onSelect}>
      {item.title}
    </button>
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

it('bulk removal copy, transient live status, selection clearing and Memories visibility', async () => {
  vi.useFakeTimers();
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  const props = {
    items: [{ id: 'one', title: 'One', type: 'movie', status: 'unwatched' }],
    onBulkDelete: async () => [{ itemId: 'one', status: 'removed' }],
    removedItems: [{ id: 'older', title: 'Older', removedAt: Date.now() }],
    onBack: vi.fn(),
  };
  const click = async (label) => {
    const button = [...container.querySelectorAll('button')].find(
      (el) => el.textContent.trim() === label,
    );
    expect(button, label).toBeTruthy();
    await act(async () => button.click());
  };
  const remove = async () => {
    await click('Select');
    await act(async () =>
      container.querySelector('[data-testid="card-one"]').click(),
    );
    await click('Delete');
    expect(container.textContent).toContain('Remove Selected Titles?');
    expect(container.textContent).toContain(
      'You can restore them from Recently removed for 24 hours.',
    );
    expect(container.textContent).toContain('Cancel');
    await click('Remove Selected');
  };
  try {
    await act(async () => root.render(<ShelfView {...props} />));
    expect(container.textContent).not.toContain('Recently removed');
    await remove();
    const status = container.querySelector('[role="status"]');
    expect(status.getAttribute('aria-live')).toBe('polite');
    expect(status.className).toContain('min-h-8');
    expect(status.textContent).toContain(
      '1 title removed. Restore within 24 hours from the ⋯ menu on Tonight.',
    );
    await act(async () => vi.advanceTimersByTime(8000));
    expect(status.textContent).toBe('');
    await remove();
    await click('Select');
    expect(status.textContent).toBe('');
    await click('Done');
    await remove();
    await act(async () =>
      root.render(
        <ShelfView
          {...props}
          showRemoved
          removedItems={[{ id: 'one', title: 'One', removedAt: Date.now() }]}
          onRestoreRemoved={async () => ({ status: 'restored' })}
          onPurgeRemoved={async () => []}
        />,
      ),
    );
    await click('Restore');
    await act(async () => root.render(<ShelfView {...props} />));
    expect(container.querySelector('[role="status"]').textContent).toBe('');
    await click('Memories');
    expect(container.textContent).not.toContain('Recently removed');
  } finally {
    await act(async () => root.unmount());
    container.remove();
    vi.useRealTimers();
  }
});
