import React, { useEffect, useRef, useState } from 'react';
import Button from '../components/ui/Button.jsx';
import {
  isExpired,
  removalMillis,
  REMOVAL_TTL,
} from '../domain/watchlist/removal.js';

export const timeLeftLabel = (remaining) => {
  const hours = remaining / 3600000;
  if (hours > 23) return 'About 24 hours left';
  if (hours < 1) return 'Less than an hour left';
  const count = Math.floor(hours);
  return count === 1 ? 'About 1 hour left' : `${count} hours left`;
};

export default function RecentlyRemoved({ items, onRestore, onPurge, onBack }) {
  const [now, setNow] = useState(Date.now);
  const [messages, setMessages] = useState({});
  const [busy, setBusy] = useState({});
  const purgeRef = useRef(onPurge);
  purgeRef.current = onPurge;
  useEffect(() => {
    let active = true;
    const purge = async () => {
      try {
        const results = await purgeRef.current();
        if (active && results?.some((result) => result.status === 'failed'))
          setMessages((current) => ({
            ...current,
            purge:
              'Some expired titles could not be cleared. Reopen this list to try again.',
          }));
      } catch {
        if (active)
          setMessages((current) => ({
            ...current,
            purge:
              'Expired titles could not be cleared. Reopen this list to try again.',
          }));
      }
    };
    purge();
    const timer = setInterval(() => {
      setNow(Date.now());
      purge();
    }, 60000);
    return () => {
      active = false;
      clearInterval(timer);
    };
    // Opening the list and the timer deliberately use the latest mounted scope.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const restore = async (item) => {
    setBusy((current) => ({ ...current, [item.id]: true }));
    try {
      const result = await onRestore(item.id);
      const message =
        result.status === 'restored'
          ? `Restored ${item.title}.`
          : result.status === 'conflict'
          ? 'This title is already on your shelf.'
          : result.status === 'expired' || result.status === 'missing'
          ? 'This title is no longer available to restore.'
          : 'Could not restore this title. Try again.';
      setMessages((current) => ({ ...current, [item.id]: message }));
    } catch {
      setMessages((current) => ({
        ...current,
        [item.id]: 'Could not restore this title. Try again.',
      }));
    } finally {
      setBusy((current) => ({ ...current, [item.id]: false }));
    }
  };
  const available = items
    .filter((item) => !isExpired(item, now))
    .sort((a, b) => removalMillis(a.removedAt) - removalMillis(b.removedAt));
  return (
    <section className="px-4 py-4 pb-40 text-stone-300">
      <Button
        variant="ghost"
        onClick={onBack}
        className="!pl-0 min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60"
      >
        Back to Shelf
      </Button>
      <h1 className="font-serif text-2xl text-stone-100 mt-4">
        Recently removed
      </h1>
      <p className="text-sm text-stone-300 mt-2">
        Either of you can restore a title for 24 hours after removal.
      </p>
      <div role="status" className="text-sm mt-3">
        {Object.entries(messages).map(([id, message]) => (
          <p key={id}>{message}</p>
        ))}
      </div>
      {available.length === 0 && (
        <p className="text-sm py-8">No titles to restore.</p>
      )}
      <ul className="divide-y divide-stone-800 mt-4">
        {available.map((item) => (
          <li key={item.id} className="flex items-center gap-3 py-4">
            {item.poster ? (
              <img
                src={item.poster}
                alt=""
                className="w-12 h-[4.5rem] rounded-lg object-cover"
              />
            ) : (
              <div className="w-12 h-[4.5rem] bg-stone-800 rounded-lg" />
            )}
            <div className="flex-1 min-w-0">
              <h2 className="font-serif text-lg text-stone-100">
                {item.title}
              </h2>
              <p className="text-sm text-stone-300">
                {timeLeftLabel(
                  removalMillis(item.removedAt) + REMOVAL_TTL - now,
                )}
              </p>
            </div>
            <Button
              variant="secondary"
              className="min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60"
              aria-label={`Restore ${item.title}`}
              disabled={busy[item.id]}
              onClick={() => restore(item)}
            >
              {busy[item.id] ? 'Restoring...' : 'Restore'}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
