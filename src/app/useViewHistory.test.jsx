import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useViewHistory, __viewHistoryTestUtils } from './useViewHistory.js';

let latest;
let root;
let container;

function Harness({ initialView = 'tonight' }) {
  latest = useViewHistory(initialView);
  return null;
}

const renderHarness = (initialView = 'tonight') => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(<Harness initialView={initialView} />);
  });
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
});
