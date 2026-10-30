import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HearthAppView } from '../App.jsx';
import { useVersionUpdates } from '../app/useVersionUpdates.js';

vi.mock('../views/TonightView.jsx', () => ({
  default: () => <header className="fixed z-40">Tonight</header>,
}));
vi.mock('../app/lazyWithPrefetch.js', () => ({
  lazyWithPrefetch: () => () => null,
  prefetchOnIdle: () => () => {},
}));

let root;
afterEach(() => {
  act(() => root?.unmount());
  document.body.innerHTML = '';
  vi.useRealTimers();
});

describe('Recently removed confirmation in the app shell', () => {
  it('announces above content below the safe-area header, lasts six seconds and dismisses on tap', () => {
    vi.useFakeTimers();
    let updates;
    function Harness() {
      updates = useVersionUpdates();
      return (
        <HearthAppView
          appState={{
            ...updates,
            authResolved: true,
            items: [],
            removedItems: [],
            userSpaces: [],
            view: 'tonight',
          }}
        />
      );
    }
    const container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    act(() => root.render(<Harness />));
    const message = 'Brought back Arrival from Recently removed.';
    act(() => updates.notifyUpdate(message));
    const status = container.querySelector('[role="status"]');
    expect(status.getAttribute('aria-live')).toBe('polite');
    expect(status.textContent).toContain(message);
    expect(status.className).toContain('fixed');
    expect(status.className).toContain('top-[calc(var(--safe-top)+76px)]');
    expect(status.className).toContain('z-50');
    expect(status.querySelector('button').className).toContain('min-h-11');
    act(() => vi.advanceTimersByTime(5999));
    expect(status.textContent).toContain(message);
    act(() => vi.advanceTimersByTime(1));
    expect(status.textContent).toBe('');
    act(() => updates.notifyUpdate(message));
    act(() => status.querySelector('button').click());
    expect(status.textContent).toBe('');

    act(() => updates.notifyUpdate('Metadata refreshed.'));
    expect(status.textContent).toBe('');
    expect(container.querySelector('.text-xs').textContent).toBe(
      'Metadata refreshed.',
    );
    act(() => vi.advanceTimersByTime(3500));
    expect(container.textContent).not.toContain('Metadata refreshed.');
  });
});
