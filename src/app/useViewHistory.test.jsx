import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useViewHistory, __viewHistoryTestUtils } from './useViewHistory.js';

let latest;
let root;
let container;

function Harness({
  initialView = 'tonight',
  canRestore,
  deferRestore = false,
}) {
  latest = useViewHistory(
    initialView,
    deferRestore ? { canRestore } : undefined,
  );
  return <div data-testid="view">{latest.view}</div>;
}

const renderHarness = (
  initialView = 'tonight',
  canRestore,
  deferRestore = false,
) => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(
      <Harness
        initialView={initialView}
        canRestore={canRestore}
        deferRestore={deferRestore}
      />,
    );
  });
};

const { buildHistoryState, readHistoryEntry } = __viewHistoryTestUtils;

const currentEntry = () => readHistoryEntry(window.history.state);

// jsdom delivers history traversal (and its popstate) asynchronously.
const traverse = async (action) => {
  const popped = new Promise((resolve) => {
    window.addEventListener('popstate', () => resolve(true), { once: true });
  });
  const timeout = new Promise((resolve) =>
    setTimeout(() => resolve(false), 250),
  );
  let fired;
  await act(async () => {
    action();
    fired = await Promise.race([popped, timeout]);
    // Let any follow-up traversal (e.g. a collapse) settle too.
    await new Promise((resolve) => setTimeout(resolve, 40));
  });
  return fired;
};

describe('useViewHistory', () => {
  beforeEach(() => {
    latest = null;
    window.history.replaceState(null, '', '/');
  });

  afterEach(() => {
    if (root) {
      act(() => root.unmount());
    }
    container?.remove();
    root = null;
    container = null;
    vi.restoreAllMocks();
  });

  it('establishes Tonight as the baseline and pushes top-level screens', () => {
    renderHarness('tonight');

    expect(latest.view).toBe('tonight');
    expect(
      __viewHistoryTestUtils.readHistoryEntry(window.history.state),
    ).toEqual({ view: 'tonight', depth: 0 });

    act(() => latest.setView('shelf'));

    expect(latest.view).toBe('shelf');
    expect(
      __viewHistoryTestUtils.readHistoryEntry(window.history.state),
    ).toEqual({ view: 'shelf', depth: 1 });

    act(() => latest.setView('add'));

    expect(latest.view).toBe('add');
    expect(
      __viewHistoryTestUtils.readHistoryEntry(window.history.state),
    ).toEqual({ view: 'add', depth: 2 });
  });

  it('creates a Tonight entry behind a restored non-home initial view', () => {
    renderHarness('shelf');

    expect(latest.view).toBe('shelf');
    expect(
      __viewHistoryTestUtils.readHistoryEntry(window.history.state),
    ).toEqual({ view: 'shelf', depth: 1 });
  });

  it('syncs the React view when browser history pops', () => {
    renderHarness('tonight');

    act(() => latest.setView('shelf'));

    act(() => {
      window.dispatchEvent(
        new PopStateEvent('popstate', {
          state: __viewHistoryTestUtils.buildHistoryState({}, 'tonight', 0),
        }),
      );
    });

    expect(latest.view).toBe('tonight');
  });

  it('uses browser back while Hearth has internal history', () => {
    renderHarness('tonight');
    act(() => latest.setView('shelf'));

    const backSpy = vi
      .spyOn(window.history, 'back')
      .mockImplementation(() => {});

    act(() => latest.goBack());

    expect(backSpy).toHaveBeenCalledTimes(1);
  });

  it('moves real history on back() and syncs the React view', async () => {
    renderHarness('tonight');
    act(() => latest.setView('shelf'));
    act(() => latest.setView('add'));

    expect(await traverse(() => window.history.back())).toBe(true);
    expect(latest.view).toBe('shelf');
    expect(currentEntry()).toEqual({ view: 'shelf', depth: 1 });

    expect(await traverse(() => window.history.back())).toBe(true);
    expect(latest.view).toBe('tonight');
    expect(currentEntry()).toEqual({ view: 'tonight', depth: 0 });

    // Forward restores the pushed screens in order.
    await traverse(() => window.history.forward());
    expect(latest.view).toBe('shelf');
  });

  it('goBack unwinds one real history entry at a time', async () => {
    renderHarness('tonight');
    act(() => latest.setView('shelf'));
    act(() => latest.setView('add'));

    await traverse(() => latest.goBack());
    expect(latest.view).toBe('shelf');

    await traverse(() => latest.goBack());
    expect(latest.view).toBe('tonight');
    expect(currentEntry().depth).toBe(0);
  });

  it('collapses a deep stack to the root in one step', async () => {
    renderHarness('tonight');
    act(() => latest.setView('shelf'));
    act(() => latest.setView('add'));
    act(() => latest.setView('decision'));

    expect(currentEntry().depth).toBe(3);

    await traverse(() => latest.setView('tonight'));

    expect(latest.view).toBe('tonight');
    expect(currentEntry()).toEqual({ view: 'tonight', depth: 0 });

    // Back is now left to the browser: no further Hearth entry to consume.
    act(() => latest.setView('shelf'));
    expect(currentEntry().depth).toBe(1);
  });

  it('goBack at depth 0 falls back without touching history', () => {
    renderHarness('tonight');
    const backSpy = vi.spyOn(window.history, 'back');
    const lengthBefore = window.history.length;

    act(() => latest.goBack());
    expect(backSpy).not.toHaveBeenCalled();
    expect(latest.view).toBe('tonight');

    // A non-root view at depth 0 still resolves to the fallback.
    act(() => latest.goBack('shelf'));
    expect(latest.view).toBe('shelf');
    expect(window.history.length).toBe(lengthBefore + 1);
  });

  it('goBack recovers when depth bookkeeping disagrees with history.state', () => {
    renderHarness('tonight');
    act(() => latest.setView('shelf'));
    // Something external replaced the entry with an unmarked one.
    window.history.replaceState({ external: true }, '');
    const backSpy = vi.spyOn(window.history, 'back');

    act(() => latest.goBack());

    expect(backSpy).not.toHaveBeenCalled();
    expect(latest.view).toBe('tonight');
    expect(currentEntry()).toEqual({ view: 'tonight', depth: 0 });
  });

  it('restores a non-root view from existing state with Tonight behind it', async () => {
    window.history.replaceState(buildHistoryState(null, 'tonight', 0), '');
    window.history.pushState(buildHistoryState(null, 'shelf', 1), '');
    const lengthBefore = window.history.length;

    renderHarness('tonight');

    expect(latest.view).toBe('shelf');
    expect(window.history.length).toBe(lengthBefore);

    await traverse(() => latest.goBack());
    expect(latest.view).toBe('tonight');
    expect(currentEntry()).toEqual({ view: 'tonight', depth: 0 });
  });

  it('never renders a restored Shelf entry after auth resolves signed out', async () => {
    window.history.replaceState(buildHistoryState(null, 'tonight', 0), '');
    window.history.pushState(buildHistoryState(null, 'shelf', 1), '');

    renderHarness('tonight', undefined, true);
    expect(container.querySelector('[data-testid="view"]').textContent).toBe(
      'tonight',
    );

    act(() =>
      root.render(
        <Harness initialView="tonight" canRestore={false} deferRestore />,
      ),
    );

    expect(container.querySelector('[data-testid="view"]').textContent).toBe(
      'onboarding',
    );
    expect(latest.view).toBe('onboarding');
    expect(currentEntry()).toEqual({ view: 'onboarding', depth: 0 });
    await traverse(() => window.history.back());
    expect(latest.view).toBe('onboarding');
  });

  it('applies a restored entry after auth resolves signed in', () => {
    window.history.replaceState(buildHistoryState(null, 'tonight', 0), '');
    window.history.pushState(buildHistoryState(null, 'shelf', 1), '');

    renderHarness('tonight', undefined, true);
    expect(latest.view).toBe('tonight');

    act(() =>
      root.render(<Harness initialView="tonight" canRestore deferRestore />),
    );

    expect(container.querySelector('[data-testid="view"]').textContent).toBe(
      'shelf',
    );
    expect(latest.view).toBe('shelf');
    expect(currentEntry()).toEqual({ view: 'shelf', depth: 1 });
  });

  it('sign-out from a pushed screen leaves no navigable Hearth entry', async () => {
    // A stale authenticated entry sits before the baseline.
    window.history.replaceState(buildHistoryState(null, 'tonight', 0), '');
    window.history.pushState(null, '');
    renderHarness('tonight');
    act(() => latest.setView('shelf'));
    act(() => latest.setView('add'));

    await traverse(() => latest.setView('onboarding'));

    expect(latest.view).toBe('onboarding');
    expect(currentEntry()).toEqual({ view: 'onboarding', depth: 0 });

    // Forward must not reveal the old Add/Shelf screens.
    await traverse(() => window.history.forward());
    expect(latest.view).toBe('onboarding');
    expect(currentEntry()).toEqual({ view: 'onboarding', depth: 0 });

    // System Back from Onboarding must not reveal the stale Tonight entry.
    await traverse(() => window.history.back());
    expect(latest.view).toBe('onboarding');
    expect(currentEntry()).toEqual({ view: 'onboarding', depth: 0 });
  });

  it('signing in from Onboarding replaces the root instead of stacking', () => {
    renderHarness('onboarding');
    const lengthBefore = window.history.length;

    act(() => latest.setView('tonight'));

    expect(latest.view).toBe('tonight');
    expect(currentEntry()).toEqual({ view: 'tonight', depth: 0 });
    expect(window.history.length).toBe(lengthBefore);
  });

  it('starts signed-out on Onboarding even if history.state holds a deep screen', async () => {
    window.history.replaceState(buildHistoryState(null, 'tonight', 0), '');
    window.history.pushState(buildHistoryState(null, 'shelf', 1), '');

    renderHarness('tonight', undefined, true);
    act(() =>
      root.render(
        <Harness initialView="tonight" canRestore={false} deferRestore />,
      ),
    );

    expect(latest.view).toBe('onboarding');
    expect(currentEntry()).toEqual({ view: 'onboarding', depth: 0 });
  });

  it('treats a real unmarked entry as a fresh root', async () => {
    window.history.pushState(null, '');
    window.history.pushState(null, '');
    renderHarness('tonight');

    expect(await traverse(() => window.history.back())).toBe(true);

    expect(latest.view).toBe('tonight');
    expect(currentEntry()).toEqual({ view: 'tonight', depth: 0 });
  });

  it('resyncs React state and depth on an unmarked popstate', () => {
    renderHarness('tonight');
    act(() => latest.setView('shelf'));
    act(() => latest.setView('add'));

    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate', { state: null }));
    });

    expect(latest.view).toBe('tonight');
    expect(currentEntry()).toEqual({ view: 'tonight', depth: 0 });

    // Depth was reset, so goBack no longer tries to use browser history.
    const backSpy = vi.spyOn(window.history, 'back');
    act(() => latest.goBack());
    expect(backSpy).not.toHaveBeenCalled();
  });

  it('keeps Onboarding on an unmarked popstate while signed out', () => {
    renderHarness('onboarding');

    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate', { state: null }));
    });

    expect(latest.view).toBe('onboarding');
    expect(currentEntry()).toEqual({ view: 'onboarding', depth: 0 });
  });

  it('defers pushes while a root collapse is pending', async () => {
    renderHarness('tonight');
    act(() => latest.setView('shelf'));
    act(() => latest.setView('add'));
    const lengthBefore = window.history.length;

    await traverse(() => {
      act(() => latest.setView('tonight'));
      // Pending: this must not push onto an entry the go() will discard.
      act(() => latest.setView('decision'));
      expect(window.history.length).toBe(lengthBefore);
    });

    expect(latest.view).toBe('decision');
    expect(currentEntry()).toEqual({ view: 'decision', depth: 1 });

    await traverse(() => latest.goBack());
    expect(latest.view).toBe('tonight');
    expect(currentEntry()).toEqual({ view: 'tonight', depth: 0 });
  });

  it('drops pushes requested while collapsing to Onboarding', async () => {
    renderHarness('tonight');
    act(() => latest.setView('shelf'));

    await traverse(() => {
      act(() => latest.setView('onboarding'));
      act(() => latest.setView('add'));
    });

    expect(latest.view).toBe('onboarding');
    expect(currentEntry()).toEqual({ view: 'onboarding', depth: 0 });
  });

  it('ignores goBack while a collapse is pending', async () => {
    renderHarness('tonight');
    act(() => latest.setView('shelf'));
    act(() => latest.setView('add'));
    const backSpy = vi.spyOn(window.history, 'back');

    await traverse(() => {
      act(() => latest.setView('tonight'));
      act(() => latest.goBack());
    });

    expect(backSpy).not.toHaveBeenCalled();
    expect(latest.view).toBe('tonight');
    expect(currentEntry().depth).toBe(0);
  });

  it('clears a stuck pending collapse when no popstate arrives', () => {
    vi.useFakeTimers();
    try {
      renderHarness('tonight');
      act(() => latest.setView('shelf'));
      vi.spyOn(window.history, 'go').mockImplementation(() => {});

      act(() => latest.setView('tonight'));
      act(() => latest.setView('add')); // queued behind the pending collapse
      expect(currentEntry().view).toBe('shelf');

      act(() => {
        vi.advanceTimersByTime(1500);
      });

      expect(latest.view).toBe('add');
      expect(currentEntry()).toEqual({ view: 'add', depth: 1 });
    } finally {
      vi.useRealTimers();
    }
  });
});
