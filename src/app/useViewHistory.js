import { useCallback, useEffect, useRef, useState } from 'react';

const HISTORY_KEY = '__hearthNavigation';
const ROOT_VIEWS = new Set(['tonight', 'onboarding']);

const resolveInitialView = (initialView) =>
  typeof initialView === 'function' ? initialView() : initialView;

const buildHistoryState = (existingState, view, depth) => ({
  ...(existingState && typeof existingState === 'object' ? existingState : {}),
  [HISTORY_KEY]: { view, depth },
});

const readHistoryEntry = (state) => {
  const entry = state?.[HISTORY_KEY];
  if (!entry || typeof entry.view !== 'string') return null;
  return {
    view: entry.view,
    depth: Number.isFinite(entry.depth) ? Math.max(0, entry.depth) : 0,
  };
};

export const useViewHistory = (initialView) => {
  const [view, setReactView] = useState(() => resolveInitialView(initialView));
  const viewRef = useRef(view);
  const depthRef = useRef(0);
  const pendingRootRef = useRef(null);

  const commitView = useCallback((nextView) => {
    viewRef.current = nextView;
    setReactView(nextView);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const restoredEntry = readHistoryEntry(window.history.state);
    if (restoredEntry) {
      depthRef.current = restoredEntry.depth;
      commitView(restoredEntry.view);
    } else {
      const initial = viewRef.current;
      const rootView = initial === 'onboarding' ? 'onboarding' : 'tonight';

      window.history.replaceState(
        buildHistoryState(window.history.state, rootView, 0),
        '',
      );
      depthRef.current = 0;

      if (initial !== rootView) {
        window.history.pushState(
          buildHistoryState(window.history.state, initial, 1),
          '',
        );
        depthRef.current = 1;
      }
    }

    const handlePopState = (event) => {
      const entry = readHistoryEntry(event.state);
      if (!entry) return;

      const pendingRoot = pendingRootRef.current;
      if (pendingRoot) {
        pendingRootRef.current = null;
        depthRef.current = 0;
        window.history.replaceState(
          buildHistoryState(window.history.state, pendingRoot, 0),
          '',
        );
        commitView(pendingRoot);
        return;
      }

      depthRef.current = entry.depth;
      commitView(entry.view);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [commitView]);

  const setView = useCallback(
    (nextValue) => {
      const nextView =
        typeof nextValue === 'function'
          ? nextValue(viewRef.current)
          : nextValue;

      if (!nextView || nextView === viewRef.current) return;

      if (typeof window === 'undefined') {
        commitView(nextView);
        return;
      }

      if (ROOT_VIEWS.has(nextView)) {
        if (depthRef.current > 0) {
          pendingRootRef.current = nextView;
          commitView(nextView);
          window.history.go(-depthRef.current);
          return;
        }

        window.history.replaceState(
          buildHistoryState(window.history.state, nextView, 0),
          '',
        );
        depthRef.current = 0;
        commitView(nextView);
        return;
      }

      const nextDepth = depthRef.current + 1;
      window.history.pushState(
        buildHistoryState(window.history.state, nextView, nextDepth),
        '',
      );
      depthRef.current = nextDepth;
      commitView(nextView);
    },
    [commitView],
  );

  const goBack = useCallback(
    (fallbackView = 'tonight') => {
      if (typeof window !== 'undefined' && depthRef.current > 0) {
        window.history.back();
        return;
      }

      if (viewRef.current !== fallbackView) {
        setView(fallbackView);
      }
    },
    [setView],
  );

  return { view, setView, goBack };
};

export const __viewHistoryTestUtils = {
  HISTORY_KEY,
  buildHistoryState,
  readHistoryEntry,
};
