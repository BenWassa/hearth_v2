import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { vi } from 'vitest';
import SuggestionSection from './SuggestionSection';

vi.mock('../../../components/cards/ItemCard.js', () => {
  return function MockItemCard({ item }) {
    return <div data-testid={`item-${item.id}`}>{item.title}</div>;
  };
});

const renderIntoDom = async (element) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(element);
  });
  return { container, root };
};

const cleanupDom = async ({ container, root }) => {
  await act(async () => {
    root.unmount();
  });
  container.remove();
};

describe('SuggestionSection rewind', () => {
  beforeAll(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
  });

  beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  it('rewinds to start when scrolled to the end and rewind is enabled', async () => {
    vi.useFakeTimers();
    const mounted = await renderIntoDom(
      <SuggestionSection
        title="Movies"
        pool={[{ id: '1' }, { id: '2' }]}
        suggestions={[
          { id: '1', title: 'A', status: 'unwatched' },
          { id: '2', title: 'B', status: 'unwatched' },
        ]}
        emptyLabel="none"
        onDecide={() => {}}
        onToggleStatus={() => {}}
        onOpenDetails={() => {}}
        layout="rail"
        enableRewind
      />,
    );

    const rail = mounted.container.querySelector('.overflow-x-auto');
    rail.scrollTo = vi.fn();
    Object.defineProperty(rail, 'scrollWidth', {
      value: 600,
      configurable: true,
    });
    Object.defineProperty(rail, 'clientWidth', {
      value: 300,
      configurable: true,
    });
    Object.defineProperty(rail, 'scrollLeft', {
      value: 280,
      configurable: true,
    });

    await act(async () => {
      rail.dispatchEvent(new Event('scroll', { bubbles: true }));
      vi.advanceTimersByTime(1200);
    });

    expect(rail.scrollTo).toHaveBeenCalledWith({
      left: 0,
      behavior: 'smooth',
    });

    await cleanupDom(mounted);
    vi.useRealTimers();
  });
});
