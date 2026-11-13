import { useEffect, useRef, useState } from 'react';

const KEY = '__hearthDirectors';
// Each layer shares Hearth's top-level view marker, so Back consumes only one
// Directors layer while Tonight and its scroll container stay mounted.
export default function useDirectorsHistory(onClose) {
  const [stage, setStage] = useState({ director: null, film: null });
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const pending = useRef(false);
  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      const current = window.history.state || {};
      const navigation = current.__hearthNavigation;
      window.history.pushState(
        {
          ...current,
          __hearthNavigation: {
            view: navigation?.view || 'tonight',
            depth: (navigation?.depth || 0) + 1,
          },
          [KEY]: { director: null, film: null },
        },
        '',
      );
    }
    const pop = (event) => {
      pending.current = false;
      if (event.state?.[KEY]) setStage(event.state[KEY]);
      else closeRef.current?.();
    };
    window.addEventListener('popstate', pop);
    return () => window.removeEventListener('popstate', pop);
  }, []);
  const navigate = (next) => {
    if (pending.current) return;
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
    setStage(next);
  };
  const back = () => {
    if (pending.current) return;
    pending.current = true;
    window.history.back();
  };
  return { stage, navigate, back };
}
