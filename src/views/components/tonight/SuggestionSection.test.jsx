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
        pool={[{ id: '1' }, { id: '2' }, { id: '3' }]}
        suggestions={[
          { id: '1', title: 'A', status: 'unwatched' },
          { id: '2', title: 'B', status: 'unwatched' },
          { id: '3', title: 'C', status: 'unwatched' },
        ]}
        emptyLabel="none"
        onDecide={() => {}}
        onToggleStatus={() => {}}
        onOpenDetails={() => {}}
        layout="rail"
        enableRewind
      />,
    );

    const animationCallbacks = [];
    const originalRequestAnimationFrame = window.requestAnimationFrame;
    const originalCancelAnimationFrame = window.cancelAnimationFrame;
    window.requestAnimationFrame = vi.fn((callback) => {
      animationCallbacks.push(callback);
      return animationCallbacks.length;
    });
    window.cancelAnimationFrame = vi.fn();

    const rail = mounted.container.querySelector('.overflow-x-auto');
    Object.defineProperty(rail, 'scrollWidth', {
      value: 600,
      configurable: true,
    });
    Object.defineProperty(rail, 'clientWidth', {
      value: 300,
      configurable: true,
    });
    Object.defineProperty(rail, 'scrollLeft', {
      value: 240,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(
      rail.firstElementChild.firstElementChild,
      'offsetWidth',
      {
        value: 70,
        configurable: true,
      },
    );

    await act(async () => {
      rail.dispatchEvent(new Event('scroll', { bubbles: true }));
      animationCallbacks.shift()?.();
      animationCallbacks.shift()?.();
    });

    expect(rail.scrollLeft).toBe(0);
    expect(rail.style.scrollSnapType).toBe('');

    await cleanupDom(mounted);
    window.requestAnimationFrame = originalRequestAnimationFrame;
    window.cancelAnimationFrame = originalCancelAnimationFrame;
    vi.useRealTimers();
  });
});
