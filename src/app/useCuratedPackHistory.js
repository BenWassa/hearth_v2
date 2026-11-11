import { useCallback, useEffect, useRef, useState } from 'react';

const PACK_KEY = '__hearthCuratedPack';

// Keep the current top-level view in the shared history marker so browser Back
// consumes the pack entry without leaving Tonight or unmounting its scroller.
export default function useCuratedPackHistory(packs) {
  const findPack = useCallback(
    (state) => packs.find((pack) => pack.id === state?.[PACK_KEY]) || null,
    [packs],
  );
  const [pack, setPack] = useState(() => findPack(window.history.state));
  const opener = useRef(null);
  const pendingBack = useRef(false);

  useEffect(() => {
    const onPop = (event) => {
      pendingBack.current = false;
      const next = findPack(event.state);
      setPack(next);
      if (!next) {
        requestAnimationFrame(() => {
          if (opener.current?.isConnected)
            opener.current.focus({ preventScroll: true });
        });
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [findPack]);

  const openPack = useCallback((next, element) => {
    if (pendingBack.current) return;
    opener.current = element || document.activeElement;
    opener.current?.focus({ preventScroll: true });
    const current = window.history.state || {};
    const navigation = current.__hearthNavigation;
    window.history.pushState(
      {
        ...current,
        __hearthNavigation: {
          view: navigation?.view || 'tonight',
          depth: (navigation?.depth || 0) + 1,
        },
        [PACK_KEY]: next.id,
      },
      '',
    );
    setPack(next);
  }, []);

  const closePack = useCallback(() => {
    if (pendingBack.current) return;
    if (window.history.state?.[PACK_KEY]) {
      pendingBack.current = true;
      window.history.back();
    } else {
      setPack(null);
    }
  }, []);

  return { pack, openPack, closePack };
}
