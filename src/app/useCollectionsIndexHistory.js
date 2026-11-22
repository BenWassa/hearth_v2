import { useCallback, useEffect, useRef, useState } from 'react';

const KEY = '__hearthCollectionsIndex';

// Keep index and saga entries under Tonight so its scroller stays mounted.
export default function useCollectionsIndexHistory() {
  const [entry, setEntry] = useState(() => window.history.state?.[KEY]);
  const opener = useRef(null);
  const pendingBack = useRef(false);

  useEffect(() => {
    const onPop = (event) => {
      pendingBack.current = false;
      const next = event.state?.[KEY];
      setEntry(next);
      if (entry && !next) {
        requestAnimationFrame(() => {
          if (opener.current?.isConnected)
            opener.current.focus({ preventScroll: true });
        });
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [entry]);

  const push = (next) => {
    const current = window.history.state || {};
    const navigation = current.__hearthNavigation;
    window.history.pushState(
      {
        ...current,
        __hearthNavigation: {
          view: navigation?.view || 'tonight',
          depth: (navigation?.depth || 0) + 1,
        },
        [KEY]: next,
      },
      '',
    );
    setEntry(next);
  };

  const open = (element) => {
    if (pendingBack.current || window.history.state?.[KEY]) return;
    opener.current = element;
    element?.focus({ preventScroll: true });
    push({ collectionId: null });
  };

  const openCollection = (collectionId) => {
    const current = window.history.state?.[KEY];
    if (pendingBack.current || !current || current.collectionId !== null)
      return;
    push({ collectionId });
  };

  const openFilm = (film) => {
    const current = window.history.state?.[KEY];
    if (pendingBack.current || !current?.collectionId || current.film) return;
    push({ ...current, film });
  };

  const back = useCallback(() => {
    if (pendingBack.current || !window.history.state?.[KEY]) return;
    pendingBack.current = true;
    window.history.back();
  }, []);

  return { entry, open, openCollection, openFilm, back };
}
