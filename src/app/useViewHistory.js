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

const PENDING_ROOT_TIMEOUT_MS = 1000;

const rootViewFor = (view) =>
  view === 'onboarding' ? 'onboarding' : 'tonight';

export const useViewHistory = (initialView, options) => {
  const canRestore = options ? options.canRestore : true;
  const [view, setReactView] = useState(() => resolveInitialView(initialView));
  const viewRef = useRef(view);
  const depthRef = useRef(0);
  // Root view a history.go(-depth) collapse is currently travelling to.
  const pendingRootRef = useRef(null);
  // Non-root view requested while a collapse was pending; applied afterwards.
  const queuedViewRef = useRef(null);
  const pendingTimerRef = useRef(null);
  const setViewRef = useRef(null);
  const initializedRef = useRef(false);
  const canRestoreRef = useRef(canRestore);
  canRestoreRef.current = canRestore;

  const commitView = useCallback((nextView) => {
    viewRef.current = nextView;
    setReactView(nextView);
  }, []);

  const clearPendingTimer = useCallback(() => {
    if (pendingTimerRef.current !== null) {
      clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = null;
    }
  }, []);

  // Make the current history entry the Hearth root for `rootView`.
  const finalizeRoot = useCallback(
    (rootView) => {
      clearPendingTimer();
      pendingRootRef.current = null;
      depthRef.current = 0;
      window.history.replaceState(
        buildHistoryState(window.history.state, rootView, 0),
        '',
      );
      commitView(rootView);

      const queued = queuedViewRef.current;
      queuedViewRef.current = null;
      if (queued && rootView !== 'onboarding') setViewRef.current?.(queued);
    },
    [clearPendingTimer, commitView],
  );

  // Walk back to the baseline entry (async) and make it the root. Until the
  // matching popstate arrives, setView defers/ignores non-root pushes.
  const collapseToRoot = useCallback(
    (rootView) => {
      commitView(rootView);

      if (pendingRootRef.current) {
        pendingRootRef.current = rootView;
        return;
      }

      const depth = depthRef.current;
      if (depth <= 0) {
        finalizeRoot(rootView);
        return;
      }

      pendingRootRef.current = rootView;
      // If the browser never delivers the popstate (history already clamped),
      // settle in place so the pending flag cannot stay stuck.
      pendingTimerRef.current = setTimeout(() => {
        pendingTimerRef.current = null;
        if (pendingRootRef.current) finalizeRoot(pendingRootRef.current);
      }, PENDING_ROOT_TIMEOUT_MS);
      window.history.go(-depth);
    },
    [commitView, finalizeRoot],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    // Do not apply a browser-restored authenticated route until the app has
    // resolved authentication. The visible initial screen can remain mounted
    // while this gate is closed.
    if (typeof canRestore === 'boolean' && !initializedRef.current) {
      const restoredEntry = readHistoryEntry(window.history.state);
      if (!canRestore) {
        // Authentication has resolved signed out. Replace any stale
        // authenticated route with a single Onboarding baseline.
        depthRef.current = 0;
        window.history.replaceState(
          buildHistoryState(window.history.state, 'onboarding', 0),
          '',
        );
        commitView('onboarding');
      } else if (restoredEntry) {
        depthRef.current = restoredEntry.depth;
        if (restoredEntry.view !== 'onboarding') {
          commitView(restoredEntry.view);
        } else if (restoredEntry.view === 'onboarding') {
          commitView('onboarding');
        }
      } else {
        const initial = viewRef.current;
        const rootView = rootViewFor(initial);

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
      initializedRef.current = true;
    }

    const handlePopState = (event) => {
      const entry = readHistoryEntry(event.state);

      // Arrival of an in-flight root collapse (marked or not).
      const pendingRoot = pendingRootRef.current;
      if (pendingRoot) {
        finalizeRoot(pendingRoot);
        return;
      }

      // Entry Hearth did not create: treat it as a fresh root.
      if (!entry) {
        finalizeRoot(rootViewFor(viewRef.current));
        return;
      }

      // Signed out: a stale/forward entry must not reveal another screen.
      if (canRestoreRef.current === false && entry.view !== 'onboarding') {
        depthRef.current = entry.depth;
        collapseToRoot('onboarding');
        return;
      }

      if (viewRef.current === 'onboarding' && entry.view !== 'onboarding') {
        depthRef.current = entry.depth;
        collapseToRoot('onboarding');
        return;
      }

      depthRef.current = entry.depth;
      commitView(entry.view);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      clearPendingTimer();
    };
  }, [canRestore, clearPendingTimer, collapseToRoot, commitView, finalizeRoot]);

  const setView = useCallback(
    (nextValue) => {
      const nextView =
        typeof nextValue === 'function'
          ? nextValue(viewRef.current)
          : nextValue;

      if (!nextView) return;

      if (typeof window === 'undefined') {
        if (nextView !== viewRef.current) commitView(nextView);
        return;
      }

      // A root collapse is travelling through history. Pushing now would land
      // on an entry the pending go() then discards, so retarget or defer.
      if (pendingRootRef.current) {
        if (ROOT_VIEWS.has(nextView)) {
          queuedViewRef.current = null;
          collapseToRoot(nextView);
        } else if (pendingRootRef.current !== 'onboarding') {
          queuedViewRef.current = nextView;
        }
        return;
      }

      if (nextView === viewRef.current) return;

      if (ROOT_VIEWS.has(nextView)) {
        collapseToRoot(nextView);
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
    [collapseToRoot, commitView],
  );
  setViewRef.current = setView;

  const goBack = useCallback(
    (fallbackView = 'tonight') => {
      if (typeof window !== 'undefined') {
        // A collapse is already walking history back to the root.
        if (pendingRootRef.current) return;

        // history.state is the source of truth for where we really are.
        const current = readHistoryEntry(window.history.state);
        depthRef.current = current ? current.depth : 0;

        if (depthRef.current > 0) {
          window.history.back();
          return;
        }
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
